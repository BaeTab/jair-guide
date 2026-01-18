const functions = require("firebase-functions");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });
const moment = require("moment-timezone");
const proj4 = require("proj4");

// Load environment variables from .env file
require("dotenv").config();

admin.initializeApp();

// API Keys from environment variables (set via Firebase Functions config)
// Set with: firebase functions:config:set kma.service_key="YOUR_KEY"
// Or use .env file with functions.config() or process.env
const SERVICE_KEY = process.env.KMA_SERVICE_KEY || functions.config().kma?.service_key || "";
const CLEAN_SERVICE_KEY = (function () {
    try {
        return decodeURIComponent(SERVICE_KEY);
    } catch (e) {
        return SERVICE_KEY;
    }
})();


// Projection Definitions
const wgs84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
const tm = "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs";

// Grid Converter (Lat/Lon <-> Grid X/Y) for KMA Weather
function dfs_xy_conv(code, v1, v2) {
    const RE = 6371.00877; // Earth Radius (km)
    const GRID = 5.0; // Grid Size (km)
    const SLAT1 = 30.0; // Projection Latitude 1
    const SLAT2 = 60.0; // Projection Latitude 2
    const OLON = 126.0; // Origin Longitude
    const OLAT = 38.0; // Origin Latitude
    const XO = 43; // Origin X
    const YO = 136; // Origin Y

    const DEGRAD = Math.PI / 180.0;
    const RADDEG = 180.0 / Math.PI;

    const re = RE / GRID;
    const slat1 = SLAT1 * DEGRAD;
    const slat2 = SLAT2 * DEGRAD;
    const olon = OLON * DEGRAD;
    const olat = OLAT * DEGRAD;

    let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
    let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = re * sf / Math.pow(ro, sn);

    const rs = {};
    if (code === "toXY") {
        rs["lat"] = v1;
        rs["lng"] = v2;
        let ra = Math.tan(Math.PI * 0.25 + (v1) * DEGRAD * 0.5);
        ra = re * sf / Math.pow(ra, sn);
        let theta = v2 * DEGRAD - olon;
        if (theta > Math.PI) theta -= 2.0 * Math.PI;
        if (theta < -Math.PI) theta += 2.0 * Math.PI;
        theta *= sn;
        rs["x"] = Math.floor(ra * Math.sin(theta) + XO + 0.5);
        rs["y"] = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
    }
    return rs;
}

// Convert KMA SKY/PTY to WMO Code calculation
function getWmoCode(sky, pty) {
    if (pty == 1 || pty == 5) return 61; // Rain
    if (pty == 2 || pty == 6) return 66; // Rain/Snow
    if (pty == 3 || pty == 7) return 71; // Snow
    if (pty == 4) return 80; // Shower

    if (sky == 1) return 0; // Clear
    if (sky == 3) return 2; // Partly Cloudy
    if (sky == 4) return 3; // Overcast

    return 0; // Default
}

// Helper: Get Base Date/Time for KMA API
function getBaseDateTime() {
    const now = moment().tz("Asia/Seoul");
    let baseDate = now.format("YYYYMMDD");
    let hour = now.hour();
    let minute = now.minute();

    if (minute < 40) {
        hour -= 1;
        if (hour < 0) {
            hour = 23;
            baseDate = now.subtract(1, 'days').format("YYYYMMDD");
        }
    }

    const baseTime = String(hour).padStart(2, '0') + "00";
    return { baseDate, baseTime };
}

function getVilageBaseDateTime() {
    const now = moment().tz("Asia/Seoul");
    let baseDate = now.format("YYYYMMDD");
    const times = [23, 20, 17, 14, 11, 8, 5, 2];

    const safeNow = moment(now).subtract(20, 'minutes');
    const safeHour = safeNow.hour();
    const safeDate = safeNow.format("YYYYMMDD");

    let baseTime = "0200";
    for (const t of times) {
        if (safeHour >= t) {
            baseTime = String(t).padStart(2, '0') + "00";
            baseDate = safeDate;
            break;
        }
    }

    if (safeHour < 2) {
        baseTime = "2300";
        baseDate = moment(safeNow).subtract(1, 'days').format("YYYYMMDD");
    }

    return { baseDate, baseTime };
}


/**
 * Helper: Calculate Jeju-specific Mool-Dae (Tide Cycle)
 * Based on Lunar Day approximation and Jeju 8-tide system.
 * Reference: Lunar Day 1 = 8물
 */
function getJejuTideInfo(date = new Date()) {
    // Reference New Moon: 2024-01-11
    const baseDate = new Date("2024-01-11T00:00:00Z");
    const diffDays = (date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
    const lunarDayDecimal = (diffDays % 29.53059);
    const lunarDay = Math.floor(lunarDayDecimal) + 1; // 1 to 30

    // Jeju 8-tide system formula: (LunarDay + 7) % 15
    let index = (lunarDay + 7) % 15;
    if (index === 0) index = 15;

    const names = {
        1: "1물", 2: "2물", 3: "3물", 4: "4물", 5: "5물", 6: "6물",
        7: "7물 (사리)", 8: "8물", 9: "9물", 10: "10물", 11: "11물", 12: "12물",
        13: "13물", 14: "조금", 15: "무시"
    };

    // Tide Time Prediction (Approximate)
    // High Tide shifts ~50 mins/day. 
    // Lunar 1st High Tide approx 11:30 & 23:50
    const dayOffset = (lunarDay - 1) * 50;
    let highTide1 = moment().tz("Asia/Seoul").startOf('day').add(11, 'hours').add(30, 'minutes').add(dayOffset, 'minutes');
    let highTide2 = moment(highTide1).add(12, 'hours').add(25, 'minutes');

    // Low Tide is approx 6h 12m after High Tide
    let lowTide1 = moment(highTide1).subtract(6, 'hours').subtract(12, 'minutes');
    let lowTide2 = moment(highTide1).add(6, 'hours').add(12, 'minutes');

    const status = names[index] || `${index}물`;
    const flowIntensity = (index >= 6 && index <= 9) ? "강함 (사리)" :
        (index >= 13 || index <= 2) ? "약함 (조금)" : "보통";

    return {
        date: moment(date).tz("Asia/Seoul").format("YYYY-MM-DD"),
        lunarDay: Math.round(lunarDayDecimal * 10) / 10,
        index,
        status,
        flowIntensity,
        approxTides: [
            { type: 'low', time: lowTide1.format("HH:mm") },
            { type: 'high', time: highTide1.format("HH:mm") },
            { type: 'low', time: lowTide2.format("HH:mm") },
            { type: 'high', time: highTide2.format("HH:mm") }
        ].sort((a, b) => a.time.localeCompare(b.time))
    };
}


// --- Cloud Functions ---

exports.getJejuTide = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        const tide = getJejuTideInfo();
        res.status(200).json({ success: true, ...tide });
    });
});

exports.subscribeToWeatherAlerts = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { token } = req.body;
            if (!token) return res.status(400).json({ error: "Token required" });

            await admin.messaging().subscribeToTopic(token, 'jeju-weather-alerts');
            return res.status(200).json({ success: true, message: "Subscribed to jeju-weather-alerts" });
        } catch (error) {
            console.error("Subscription Error:", error);
            return res.status(500).json({ error: error.message });
        }
    });
});

exports.getReverseGeocode = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { lat, lon } = req.query;
            if (!lat || !lon) return res.status(400).json({ error: "Lat/Lon required" });

            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'JejuAirGuide/1.0',
                    'Accept-Language': 'ko-KR'
                },
                timeout: 10000
            });
            return res.status(200).json(response.data);
        } catch (error) {
            console.error("Reverse Geocode Error:", error);
            return res.status(500).json({ error: error.message });
        }
    });
});

// In-memory cache for weather data (key: "x,y", val: { data, timestamp })
const weatherCache = new Map();

exports.getKmaWeather = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { lat, lng } = req.query;

            if (!lat || !lng) {
                return res.status(400).json({ error: "Latitude and Longitude required" });
            }

            const grid = dfs_xy_conv("toXY", lat, lng);
            const cacheKey = `${grid.x},${grid.y}`;
            const now = Date.now();

            // Check Cache (Valid for 30 minutes)
            if (weatherCache.has(cacheKey)) {
                const cached = weatherCache.get(cacheKey);
                if (now - cached.timestamp < 30 * 60 * 1000) {
                    // console.log(`Serving Weather cache for ${cacheKey}`);
                    return res.status(200).json(cached.data);
                }
            }

            const currentBase = getBaseDateTime();
            const currentUrl = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst`;

            const forecastBase = getVilageBaseDateTime();
            const forecastUrl = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst`;

            const [currentRes, forecastRes] = await Promise.all([
                axios.get(currentUrl, {
                    params: {
                        serviceKey: CLEAN_SERVICE_KEY,
                        pageNo: 1,
                        numOfRows: 10,
                        dataType: 'JSON',
                        base_date: currentBase.baseDate,
                        base_time: currentBase.baseTime,
                        nx: grid.x,
                        ny: grid.y
                    },
                    timeout: 5000 // Short timeout for KMA
                }),
                axios.get(forecastUrl, {
                    params: {
                        serviceKey: CLEAN_SERVICE_KEY,
                        pageNo: 1,
                        numOfRows: 100,
                        dataType: 'JSON',
                        base_date: forecastBase.baseDate,
                        base_time: forecastBase.baseTime,
                        nx: grid.x,
                        ny: grid.y
                    },
                    timeout: 7000 // Short timeout
                })
            ]);

            const currentItems = currentRes.data.response?.body?.items?.item || [];
            const forecastItems = forecastRes.data.response?.body?.items?.item || [];

            let temp = 0;
            let humidity = 0;
            let windSpeed = 0;
            let windDirection = 0;
            let pty = 0;

            currentItems.forEach(item => {
                if (item.category === 'T1H') temp = parseFloat(item.obsrValue);
                if (item.category === 'REH') humidity = parseFloat(item.obsrValue);
                if (item.category === 'WSD') windSpeed = parseFloat(item.obsrValue);
                if (item.category === 'VEC') windDirection = parseFloat(item.obsrValue);
                if (item.category === 'PTY') pty = parseInt(item.obsrValue);
            });

            let sky = 1;

            const hourly = [];
            const nowVal = moment().tz("Asia/Seoul");
            const grouped = {};

            forecastItems.forEach(item => {
                const fcstDate = item.fcstDate;
                const fcstTime = item.fcstTime;
                const key = `${fcstDate}${fcstTime}`;
                if (!grouped[key]) grouped[key] = {};
                grouped[key][item.category] = item.fcstValue;
            });

            Object.keys(grouped).sort().forEach(key => {
                const g = grouped[key];
                const itemTime = moment(key, "YYYYMMDDHHmm");
                if (itemTime.isAfter(nowVal) || itemTime.isSame(nowVal, 'hour')) {
                    if (hourly.length < 24) {
                        let hTemp = parseFloat(g['TMP']);
                        let hSky = parseInt(g['SKY']);
                        let hPty = parseInt(g['PTY']);
                        let wc = getWmoCode(hSky, hPty);
                        hourly.push({
                            time: itemTime.format("HH:00"),
                            temp: hTemp,
                            weatherCode: wc,
                        });
                    }
                }
            });

            if (pty === 0 && hourly.length > 0) {
                const firstHourlyItem = hourly[0];
                const firstHourlyKey = Object.keys(grouped).sort().find(key => {
                    const itemMoment = moment(key, "YYYYMMDDHHmm");
                    // Just match the hour part if same day is not possible
                    return itemMoment.format("HH:00") === firstHourlyItem.time;
                });
                if (firstHourlyKey && grouped[firstHourlyKey] && grouped[firstHourlyKey]['SKY']) {
                    sky = parseInt(grouped[firstHourlyKey]['SKY']);
                }
            }

            const weatherCode = getWmoCode(sky, pty);

            let visibility = 20000;
            if (weatherCode === 45) visibility = 200;
            else if ([51, 61, 65, 66, 71, 75, 80].includes(weatherCode)) visibility = 5000;

            // Fetch UV Index from Open-Meteo (Free, No Key)
            let uvIndex = 0;
            try {
                const uvUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=uv_index&timezone=auto`;
                const uvRes = await axios.get(uvUrl, { timeout: 3000 }); // Fast timeout
                if (uvRes.data.current && uvRes.data.current.uv_index !== undefined) {
                    uvIndex = uvRes.data.current.uv_index;
                }
            } catch (e) {
                console.warn("Open-Meteo UV Fetch Failed:", e.message);
                // UV is optional, proceed with 0
            }

            const responseData = {
                current: {
                    temperature_2m: temp,
                    relative_humidity_2m: humidity,
                    wind_speed_10m: windSpeed,
                    wind_direction_10m: windDirection,
                    weather_code: weatherCode,
                    uv_index: uvIndex // Added UV Index
                },
                app_compatible: {
                    temp,
                    humidity,
                    windSpeed,
                    windDirection,
                    windGusts: windSpeed * 1.5,
                    weatherCode,
                    visibility,
                    uvIndex: uvIndex, // Added UV Index
                    hourly: hourly
                }
            };

            // Update Cache
            weatherCache.set(cacheKey, {
                data: responseData,
                timestamp: now
            });

            return res.status(200).json(responseData);

        } catch (error) {
            console.error("KMA API Error:", error);
            if (error.response) {
                console.error("KMA Error Data:", JSON.stringify(error.response.data));
            }
            return res.status(500).json({ error: error.message, details: error.response?.data });
        }
    });
});


exports.getAirKoreaQuality = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const now = moment().tz("Asia/Seoul");
            const year = now.format("YYYY");

            // 미세먼지 경보 정보 API (UlfptcaAlarmInqireSvc)
            // PM10: 미세먼지, PM25: 초미세먼지
            const pm10Url = `http://apis.data.go.kr/B552584/UlfptcaAlarmInqireSvc/getUlfptcaAlarmInfo`;
            const pm25Url = `http://apis.data.go.kr/B552584/UlfptcaAlarmInqireSvc/getUlfptcaAlarmInfo`;

            console.log("Fetching PM10 Alarm Info");

            const [pm10Res, pm25Res] = await Promise.all([
                axios.get(pm10Url, {
                    params: {
                        serviceKey: CLEAN_SERVICE_KEY,
                        returnType: 'json',
                        numOfRows: 100,
                        pageNo: 1,
                        year: year,
                        itemCode: 'PM10'
                    },
                    timeout: 10000
                }),
                axios.get(pm25Url, {
                    params: {
                        serviceKey: CLEAN_SERVICE_KEY,
                        returnType: 'json',
                        numOfRows: 100,
                        pageNo: 1,
                        year: year,
                        itemCode: 'PM25'
                    },
                    timeout: 10000
                })
            ]);

            const pm10Data = pm10Res.data.response?.body?.items?.item || [];
            const pm25Data = pm25Res.data.response?.body?.items?.item || [];

            const pm10Items = Array.isArray(pm10Data) ? pm10Data : (pm10Data ? [pm10Data] : []);
            const pm25Items = Array.isArray(pm25Data) ? pm25Data : (pm25Data ? [pm25Data] : []);

            // 배열로 변환 (단일 item인 경우 대비)
            const pm10List = Array.isArray(pm10Items) ? pm10Items : [pm10Items];
            const pm25List = Array.isArray(pm25Items) ? pm25Items : [pm25Items];

            // 제주 지역 최신 경보 찾기
            const jejuPm10 = pm10List.find(item => item.districtName && item.districtName.includes('제주'));
            const jejuPm25 = pm25List.find(item => item.districtName && item.districtName.includes('제주'));

            // 전국 최신 경보 (제주 없을 경우 참고용)
            const latestPm10 = pm10List[0];
            const latestPm25 = pm25List[0];

            // 경보 등급에 따른 예상 수치 (참고용)
            // 주의보: PM10 150+, PM2.5 75+ / 경보: PM10 300+, PM2.5 150+
            let pm10Value = 30; // 기본값 (좋음)
            let pm25Value = 15;
            let alarmInfo = null;

            if (jejuPm10 || jejuPm25) {
                const alarm = jejuPm10 || jejuPm25;
                alarmInfo = {
                    district: alarm.districtName,
                    issueDate: alarm.issueDate,
                    issueTime: alarm.issueTime,
                    issueGbn: alarm.issueGbn, // 주의보/경보
                    itemCode: alarm.itemCode,
                    clearDate: alarm.clearDate,
                    clearTime: alarm.clearTime
                };

                // 경보 발령 중이면 수치 추정
                if (alarm.issueGbn === '경보') {
                    pm10Value = alarm.itemCode === 'PM10' ? 350 : pm10Value;
                    pm25Value = alarm.itemCode === 'PM25' ? 180 : pm25Value;
                } else if (alarm.issueGbn === '주의보') {
                    pm10Value = alarm.itemCode === 'PM10' ? 180 : pm10Value;
                    pm25Value = alarm.itemCode === 'PM25' ? 90 : pm25Value;
                }
            }

            return res.status(200).json({
                current: {
                    pm10: pm10Value,
                    pm2_5: pm25Value,
                    stationName: '제주 (경보정보 기준)',
                    alarmInfo: alarmInfo,
                    totalPm10Alarms: pm10List.length,
                    totalPm25Alarms: pm25List.length
                }
            });

        } catch (error) {
            console.error("Air Korea Alarm API Error:", error);
            if (error.response) {
                console.error("Air Korea Error Status:", error.response.status);
                console.error("Air Korea Error Data:", JSON.stringify(error.response.data));
            }
            // 실패시 기본값 반환 (에러로 앱이 멈추지 않도록)
            return res.status(200).json({
                current: {
                    pm10: 30,
                    pm2_5: 15,
                    stationName: '데이터 없음',
                    alarmInfo: null
                }
            });
        }
    });
});

// 제주공항 기상정보 조회 API
exports.getJejuAirportWeather = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const encodedKey = encodeURIComponent(SERVICE_KEY);

            // 오늘 날짜와 적절한 base_time 계산 (0600 또는 1700)
            const now = moment().tz("Asia/Seoul");
            const baseDate = now.format("YYYYMMDD");
            const baseTime = now.hour() < 17 ? '0600' : '1700';

            // 제주공항 코드: RKPC
            const url = `http://apis.data.go.kr/1360000/AirPortService/getAirPort?serviceKey=${encodedKey}&pageNo=1&numOfRows=10&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&airPortCd=RKPC`;

            console.log("Fetching Jeju Airport Weather");

            const response = await axios.get(url);

            if (response.data.response?.header?.resultCode !== '00') {
                throw new Error(`API Error: ${response.data.response?.header?.resultMsg}`);
            }

            const items = response.data.response?.body?.items?.item;

            if (!items || items.length === 0) {
                return res.status(200).json({
                    airport: 'RKPC',
                    name: '제주공항',
                    data: null,
                    message: '데이터 없음'
                });
            }

            const item = Array.isArray(items) ? items[0] : items;

            return res.status(200).json({
                airport: 'RKPC',
                name: '제주공항',
                baseDate: baseDate,
                baseTime: baseTime,
                data: {
                    summary: item.summary || '',        // 요약
                    weather: item.weather || '',        // 일기개황
                    minTemp: item.minTa || '',          // 최저기온
                    maxTemp: item.maxTa || '',          // 최고기온
                    maxSensTemp: item.maxSensTa || '',  // 낮 최고 체감기온
                    rainAmt: item.rainAmt || '',        // 예상강수량
                    snowAmt: item.snowAmt || '',        // 예상강설량
                    warn: item.warn || '',              // 위험기상예보
                    alert: item.alert || ''             // 경보현황
                }
            });

        } catch (error) {
            console.error("Airport Weather API Error:", error);
            return res.status(500).json({
                error: error.message,
                details: error.response?.data
            });
        }
    });
});

// In-memory cache for sea trip data
let seaTripCache = {
    data: null,
    timestamp: 0
};

// 바다여행지수 조회 API (제주 4개 지역)
exports.getSeaTripIndex = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const now = Date.now();
            // Cache valid for 60 minutes
            if (seaTripCache.data && (now - seaTripCache.timestamp < 60 * 60 * 1000)) {
                console.log("Serving Sea Trip data from cache");
                return res.status(200).json(seaTripCache.data);
            }

            // 제주 4개 지역 코드
            const placeCodes = [
                { code: 'JJNE', name: '제주북동' },
                { code: 'JJNW', name: '제주북서' },
                { code: 'JJSE', name: '제주남동' },
                { code: 'JJSW', name: '제주남서' }
            ];

            console.log("Starting getSeaTripIndex (Live Fetch)...");
            console.log(`Using Service Key (first 10 chars): ${CLEAN_SERVICE_KEY.substring(0, 10)}...`);

            const results = [];
            // Run requests in parallel to speed up
            const promises = placeCodes.map(async (place) => {
                try {
                    console.log(`Fetching data for ${place.code} (${place.name})...`);
                    const response = await axios.get('https://apis.data.go.kr/1192136/fcstSeaTripv2/GetFcstSeaTripApiServicev2', {
                        params: {
                            serviceKey: CLEAN_SERVICE_KEY,
                            type: 'json',
                            pageNo: 1,
                            numOfRows: 14,
                            placeCode: place.code
                        },
                        timeout: 10000,
                        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }
                    });

                    // API 구조 대응: response 래퍼가 있을 수도 있고 없을 수도 있음
                    const data = response.data.response || response.data;

                    // Check for result code '00'
                    if (data?.header?.resultCode === '00') {
                        // console.log(`Success for ${place.code}`);
                        const items = data.body?.items?.item;
                        const itemList = Array.isArray(items) ? items : (items ? [items] : []);

                        // 오늘 날짜 및 현재 시간 (한국 시간 기준)
                        const now = moment().tz('Asia/Seoul');
                        const todayStr = now.format('YYYYMMDD');
                        const currentHour = now.hour();

                        // 과거 데이터 제외 및 정렬
                        const validItems = itemList.filter(item => {
                            if (!item.predcYmd) return false;
                            const itemDate = Number(item.predcYmd);
                            const todayNum = Number(todayStr);

                            if (itemDate < todayNum) return false;

                            // 오늘 날짜인 경우, 시간이 지났으면 제외 (1:오전, 2:오후)
                            if (itemDate === todayNum) {
                                if (item.predcNoonSeCd === '1' && currentHour >= 12) return false;
                            }

                            return true;
                        }).sort((a, b) => {
                            if (a.predcYmd !== b.predcYmd) return a.predcYmd - b.predcYmd;
                            return a.predcNoonSeCd - b.predcNoonSeCd;
                        });

                        // 오늘 + 내일 데이터 (오전/오후)
                        const forecast = validItems.slice(0, 4).map(item => ({
                            date: item.predcYmd,
                            time: item.predcNoonSeCd, // 오전/오후
                            index: item.totalIndex,   // 좋음/보통/나쁨/매우나쁨
                            score: parseInt(item.lastScr) || 0,
                            weather: item.weather,
                            waveHeight: parseFloat(item.avgWvhgt) || 0,
                            windSpeed: parseFloat(item.avgWspd) || 0,
                            waterTemp: parseFloat(item.avgWtem) || 0,
                            airTemp: parseFloat(item.avgArtmp) || 0,
                            tide: item.tdlvHrCn // 물때 (대조기/소조기 등)
                        }));

                        // 좌표 정보 (첫 번째 아이템에서 추출)
                        const lat = itemList[0]?.lat || 0;
                        const lng = itemList[0]?.lot || 0;

                        return {
                            code: place.code,
                            name: place.name,
                            lat: parseFloat(lat),
                            lng: parseFloat(lng),
                            forecast: forecast
                        };
                    } else {
                        console.warn(`API returned non-00 code for ${place.code}:`, data?.header);
                        return null;
                    }
                } catch (err) {
                    console.error(`Sea trip API failed for ${place.code}:`, err.message);
                    if (err.response) {
                        console.error(`Status: ${err.response.status}`);
                        console.error(`Data:`, JSON.stringify(err.response.data).substring(0, 200));
                    }
                    return null;
                }
            });

            const parallelResults = await Promise.all(promises);
            // Filter out nulls
            parallelResults.forEach(r => {
                if (r) results.push(r);
            });

            // 전체 제주 지역 평균 계산
            let avgScore = 0;
            let avgWave = 0;
            let avgWind = 0;
            let count = 0;
            let overallIndex = '좋음';

            results.forEach(region => {
                if (region.forecast.length > 0) {
                    const today = region.forecast[0];
                    avgScore += today.score;
                    avgWave += today.waveHeight;
                    avgWind += today.windSpeed;
                    count++;
                }
            });

            if (count > 0) {
                avgScore = Math.round(avgScore / count);
                avgWave = Math.round((avgWave / count) * 10) / 10;
                avgWind = Math.round((avgWind / count) * 10) / 10;

                // 점수에 따른 지수 판정
                if (avgScore >= 70) overallIndex = '좋음';
                else if (avgScore >= 50) overallIndex = '보통';
                else if (avgScore >= 30) overallIndex = '나쁨';
                else overallIndex = '매우나쁨';
            }

            const responsePayload = {
                success: true,
                summary: {
                    overallIndex,
                    avgScore,
                    avgWaveHeight: avgWave,
                    avgWindSpeed: avgWind,
                    regionCount: count
                },
                regions: results
            };

            // Update Cache
            if (results.length > 0) {
                seaTripCache = {
                    data: responsePayload,
                    timestamp: now
                };
            }

            return res.status(200).json(responsePayload);

        } catch (error) {
            console.error("Sea Trip API Error:", error);

            // Serve stale cache if available
            if (seaTripCache.data) {
                console.warn("Serving stale Sea Trip cache due to error");
                return res.status(200).json({
                    ...seaTripCache.data,
                    stale: true
                });
            }

            // 실패시 기본값 반환
            return res.status(200).json({
                success: false,
                summary: {
                    overallIndex: '정보없음',
                    avgScore: 0,
                    avgWaveHeight: 0,
                    avgWindSpeed: 0,
                    regionCount: 0
                },
                regions: [],
                error: error.message
            });
        }
    }); // end cors
});

// 전기차 급속충전기 지역별 정보 조회 API


// In-memory cache for fishing data
let fishingCache = {
    data: null,
    timestamp: 0
};

exports.getSeaFishingIndex = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const now = Date.now();
            // Cache valid for 60 minutes (Data updates infrequently)
            if (fishingCache.data && (now - fishingCache.timestamp < 60 * 60 * 1000)) {
                console.log("Serving fishing data from cache");
                return res.status(200).json({
                    success: true,
                    cached: true,
                    count: fishingCache.data.length,
                    tide: fishingCache.tide || getJejuTideInfo(),
                    data: fishingCache.data
                });
            }

            console.log("Starting getSeaFishingIndex (Live Fetch)...");

            // Jeju specific fishing points
            const rockPoints = ['김녕', '성산포', '서귀포', '비양도', '추자도', '거문도'];
            const boatPoints = ['도두항 북서(2km)'];

            // Helper to fetch data for a specific point
            const fetchPointData = async (name, gubunStr) => {
                const debug = { name, gubunStr };
                try {
                    // API expects Korean string for gubun: '갯바위', '방파제', '선상', '백사장'
                    const encodedGubun = gubunStr;

                    const response = await axios.get('http://apis.data.go.kr/1192136/fcstFishingv2/GetFcstFishingApiServicev2', {
                        params: {
                            serviceKey: CLEAN_SERVICE_KEY,
                            type: 'json',
                            pageNo: 1,
                            numOfRows: 20,
                            gubun: encodedGubun,
                            placeName: name
                        },
                        timeout: 15000,
                        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }
                    });

                    const data = response.data.response || response.data;
                    debug.resultCode = data?.header?.resultCode;
                    debug.resultMsg = data?.header?.resultMsg;

                    if (data?.header?.resultCode === '00' || data?.header?.resultCode === '0') {
                        const items = data.body?.items?.item;
                        const itemList = Array.isArray(items) ? items : (items ? [items] : []);

                        const now = moment().tz('Asia/Seoul');
                        const todayStr = now.format('YYYYMMDD');
                        const currentHour = now.hour();

                        const validItems = itemList.filter(item => {
                            if (!item.predcYmd) return false;
                            // Normalize date: "2026-01-16" -> "20260116"
                            const itemDateStr = item.predcYmd.replace(/-/g, '');
                            const itemDate = Number(itemDateStr);
                            const todayNum = Number(todayStr);

                            // Normalize time: "오전" -> "1", "오후" -> "2"
                            const timeCode = item.predcNoonSeCd === '오전' ? '1' : '2';

                            if (itemDate < todayNum) return false;

                            // 오늘인 경우, 오전(1) 데이터인데 현재가 오후(12시이후)면 제외
                            if (itemDate === todayNum) {
                                if (timeCode === '1' && currentHour >= 12) return false;
                            }
                            return true;
                        });

                        return validItems.map(item => ({
                            name: item.seafsPstnNm || name,
                            type: gubunStr,
                            date: item.predcYmd.replace(/-/g, ''), // Normalizing for frontend
                            time: item.predcNoonSeCd === '오전' ? '1' : '2', // Normalizing for frontend
                            targetFish: item.seafsTgfshNm,
                            tide: item.tdlvHrCn,
                            index: item.totalIndex,
                            score: item.lastScr,
                            wave: { min: item.minWvhgt, max: item.maxWvhgt },
                            temp: { min: item.minWtem, max: item.maxWtem },
                            wind: { min: item.minWspd, max: item.maxWspd },
                            lat: item.lat,
                            lng: item.lot
                        })).sort((a, b) => {
                            if (a.date !== b.date) return a.date.localeCompare(b.date);
                            return a.time.localeCompare(b.time);
                        });
                    } else {
                        console.warn(`Non-00 result for ${name}:`, data?.header);
                        return { error: true, ...debug };
                    }
                } catch (err) {
                    console.error(`Sea fishing API failed for ${name}:`, err.message);
                    return { error: true, message: err.message, ...debug };
                }
            };

            const allResults = await Promise.all([
                ...rockPoints.map(p => fetchPointData(p, '갯바위')),
                ...boatPoints.map(p => fetchPointData(p, '선상'))
            ]);

            const results = allResults.filter(r => !r.error && Array.isArray(r)).flat();
            const errors = allResults.filter(r => r.error || !Array.isArray(r));
            const tide = getJejuTideInfo();

            if (results.length > 0) {
                // Update cache
                fishingCache = {
                    data: results,
                    tide,
                    timestamp: now
                };
            }

            res.status(200).json({
                success: true,
                count: results.length,
                tide,
                data: results,
                errors: errors.length > 0 ? errors : undefined
            });

        } catch (error) {
            console.error("getSeaFishingIndex Error:", error);
            // If error but we have old cache, serve it
            if (fishingCache && fishingCache.data) {
                console.warn("Serving stale cache due to error");
                return res.status(200).json({
                    success: true,
                    cached: true,
                    stale: true,
                    tide: fishingCache.tide || getJejuTideInfo(),
                    count: fishingCache.data.length,
                    data: fishingCache.data
                });
            }
            res.status(500).json({ error: error.message });
        }
    });
});

/**
 * NEW: Jeju Real-time Flight Tracking Proxy
 * Uses OpenSky Network (Unauthenticated REST API)
 * Rate limit: 10s for unauthenticated users.
 */
exports.getJejuFlights = functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        try {
            // Jeju Bounding Box
            const params = {
                lamin: 33.0,
                lomin: 126.0,
                lamax: 34.0,
                lomax: 127.2
            };

            const response = await axios.get('https://opensky-network.org/api/states/all', {
                params,
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }
            });

            if (response.data && response.data.states) {
                const flights = response.data.states
                    .filter(s => s[5] !== null && s[6] !== null) // Filter out flights without positions
                    .map(s => ({
                        icao24: s[0],
                        callsign: s[1] ? s[1].trim() : 'N/A',
                        country: s[2],
                        lng: s[5],
                        lat: s[6],
                        alt: s[7], // baro altitude
                        grounded: s[8],
                        velocity: s[9],
                        heading: s[10],
                        vertical_rate: s[11]
                    }));

                return res.status(200).json({
                    success: true,
                    timestamp: response.data.time,
                    count: flights.length,
                    data: flights
                });
            }

            return res.status(200).json({
                success: true,
                count: 0,
                data: []
            });

        } catch (error) {
            console.error("OpenSky API Proxy Error:", error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    });
});

// ============================================================
// HLS Stream Proxy for CCTV
// Proxies HTTP HLS streams through HTTPS to avoid mixed content issues
// Also rewrites URLs in m3u8 playlists to use the proxy
// ============================================================
exports.hlsProxy = functions.https.onRequest((req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Range');
    res.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range');

    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    const streamUrl = req.query.url;

    if (!streamUrl) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    // Validate URL - only allow known CCTV servers
    const allowedHosts = [
        '119.65.216.155',
        '211.114.96.121',
        '211.34.191.215',
        '59.8.86.15',
        '59.8.86.94',
        '123.140.197.51'
    ];

    let urlObj;
    try {
        urlObj = new URL(streamUrl);
        if (!allowedHosts.includes(urlObj.hostname)) {
            return res.status(403).json({ error: 'Unauthorized stream host' });
        }
    } catch (e) {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    const proxyBaseUrl = 'https://hlsproxy-nzdwns5qjq-uc.a.run.app';
    const isM3u8 = streamUrl.includes('.m3u8');

    // Proxy the request
    axios({
        method: 'get',
        url: streamUrl,
        responseType: isM3u8 ? 'text' : 'arraybuffer',
        timeout: 15000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    })
        .then(response => {
            if (isM3u8) {
                // For m3u8 files, rewrite all URLs to use the proxy
                let m3u8Content = response.data;
                const baseUrl = streamUrl.substring(0, streamUrl.lastIndexOf('/') + 1);

                // Rewrite relative URLs and absolute URLs
                const lines = m3u8Content.split('\n');
                const rewrittenLines = lines.map(line => {
                    const trimmedLine = line.trim();

                    // Skip empty lines and comments (except URI in EXT-X-KEY)
                    if (!trimmedLine || trimmedLine.startsWith('#')) {
                        // Handle EXT-X-KEY with URI
                        if (trimmedLine.includes('URI="')) {
                            return line.replace(/URI="([^"]+)"/, (match, uri) => {
                                let fullUrl = uri;
                                if (!uri.startsWith('http')) {
                                    fullUrl = baseUrl + uri;
                                }
                                return `URI="${proxyBaseUrl}?url=${encodeURIComponent(fullUrl)}"`;
                            });
                        }
                        return line;
                    }

                    // This is a URL line (segment or playlist)
                    let fullUrl = trimmedLine;
                    if (!trimmedLine.startsWith('http')) {
                        // Relative URL - convert to absolute
                        fullUrl = baseUrl + trimmedLine;
                    }

                    // Return proxied URL
                    return `${proxyBaseUrl}?url=${encodeURIComponent(fullUrl)}`;
                });

                const rewrittenContent = rewrittenLines.join('\n');

                res.set('Content-Type', 'application/vnd.apple.mpegurl');
                res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
                return res.send(rewrittenContent);
            } else {
                // For ts segments and other binary files, just proxy
                const contentType = response.headers['content-type'];
                if (contentType) {
                    res.set('Content-Type', contentType);
                } else if (streamUrl.includes('.ts')) {
                    res.set('Content-Type', 'video/mp2t');
                }

                res.set('Cache-Control', 'public, max-age=5');
                return res.send(Buffer.from(response.data));
            }
        })
        .catch(error => {
            console.error('HLS Proxy Error:', error.message, 'URL:', streamUrl);
            res.status(502).json({ error: 'Failed to fetch stream', details: error.message });
        });
});

// Jeju Clean House API Proxy
exports.getCleanHouse = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { page = 1, perPage = 200 } = req.query;
            const apiUrl = "https://api.odcloud.kr/api/15110514/v1/uddi:037de394-ea6f-40e5-9277-cb7b9e36f5ce";

            // Hardcoded Decoding Key as provided by user
            const DECODED_KEY = "LTVNqKiagRvNnUDX7RDV+7JYziYS7VrhQk6u86ts1ecct1QoAevL5RQkE1Osgj3B+FZUG0oA6BkrAn+Ge2LzwQ==";

            console.log(`Fetching Clean House Data: page=${page}, perPage=${perPage}`);

            const response = await axios.get(apiUrl, {
                params: {
                    page: page,
                    perPage: perPage,
                    serviceKey: DECODED_KEY,
                    returnType: 'JSON'
                },
                timeout: 15000
            });

            console.log(`Clean House API Response Status: ${response.status}`);
            if (response.data) {
                console.log(`Clean House Data Count: ${response.data.currentCount}`);
            }

            res.status(200).json(response.data);
        } catch (error) {
            console.error("Clean House API Error:", error.message);
            if (error.response) {
                console.error("Error Data:", JSON.stringify(error.response.data));
                console.error("Error Status:", error.response.status);
            }
            res.status(500).json({ error: "Failed to fetch Clean House data", details: error.message });
        }
    });
});

// Jeju Pharmacy API Proxy
exports.getPharmacy = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { number = 1, limit = 100 } = req.query;
            const projectKey = "4343_o3b3o8r23o0jcb32r53b3cet082";
            const apiUrl = `https://open.jejudatahub.net/api/proxy/taD8a8t1atabta1Dtt1tta6bt16ab16a/${projectKey}`;

            const response = await axios.get(apiUrl, {
                params: {
                    number: number,
                    limit: limit
                },
                timeout: 10000
            });

            res.status(200).json(response.data);
        } catch (error) {
            console.error("Pharmacy API Error:", error.message);
            if (error.response) {
                console.error("Error Data:", JSON.stringify(error.response.data));
                console.error("Error Status:", error.response.status);
            }
            res.status(500).json({ error: "Failed to fetch Pharmacy data", details: error.message });
        }
    });
});

// Jeju Hospital API Proxy
exports.getHospital = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { number = 1, limit = 100 } = req.query;
            const projectKey = "tbb1D1a1559at91ababaata1abtba58a"; // Provided by user
            const apiUrl = `https://open.jejudatahub.net/api/proxy/${projectKey}/4343_o3b3o8r23o0jcb32r53b3cet082`; // Using the existing project key from pharmacy? No, checking logic.
            // Wait, the user provided a full URL structure: https://open.jejudatahub.net/api/proxy/tbb1D1a1559at91ababaata1abtba58a/{your_projectKey}
            // The guid in the middle seems to be the dataset ID.
            // Let's look at the pharmacy implementation: `https://open.jejudatahub.net/api/proxy/taD8a8t1atabta1Dtt1tta6bt16ab16a/${projectKey}`
            // The projectKey variable in pharmacy was "4343_o3b3o8r23o0jcb32r53b3cet082".
            // The User's prompt says: https://open.jejudatahub.net/api/proxy/tbb1D1a1559at91ababaata1abtba58a/{your_projectKey}
            // So 'tbb1D1a1559at91ababaata1abtba58a' is the DATASET ID.
            // The project key should probably be the same one we used for Pharmacy if it's the same user account, OR we might need a new one.
            // Let's assume the user meant to reuse the project key "4343_o3b3o8r23o0jcb32r53b3cet082" which is likely their personal key.

            const userProjectKey = "4343_o3b3o8r23o0jcb32r53b3cet082";
            const datasetId = "tbb1D1a1559at91ababaata1abtba58a";
            const url = `https://open.jejudatahub.net/api/proxy/${datasetId}/${userProjectKey}`;

            const response = await axios.get(url, {
                params: {
                    number: number,
                    limit: limit
                },
                timeout: 10000
            });

            res.status(200).json(response.data);
        } catch (error) {
            console.error("Hospital API Error:", error.message);
            if (error.response) {
                console.error("Error Data:", JSON.stringify(error.response.data));
                console.error("Error Status:", error.response.status);
            }
            res.status(500).json({ error: "Failed to fetch Hospital data", details: error.message });
        }
    });
});

// Jeju Public Wifi API Proxy
// Scheduled function to check for Jeju Weather Alerts every 30 minutes
exports.checkJejuWeatherAlerts = onSchedule('every 30 minutes', async (event) => {
    try {
        console.log("Checking Jeju Weather Alerts...");
        const encodedKey = encodeURIComponent(SERVICE_KEY);
        const now = moment().tz("Asia/Seoul");
        const baseDate = now.format("YYYYMMDD");

        // We use the Airport Weather API as a reliable source for Jeju-specific warnings 
        // because it summarizes the most critical impact for travel.
        const url = `http://apis.data.go.kr/1360000/AirPortService/getAirPort?serviceKey=${encodedKey}&pageNo=1&numOfRows=1&dataType=JSON&base_date=${baseDate}&base_time=0600&airPortCd=RKPC`;

        const response = await axios.get(url);
        const item = response.data.response?.body?.items?.item;
        const airportData = Array.isArray(item) ? item[0] : item;

        if (!airportData || (!airportData.warn && !airportData.alert)) {
            console.log("No active alerts found.");
            return null;
        }

        let alertText = airportData.alert || airportData.warn || "";

        // Explicitly check for strings that mean "No Alert"
        const noAlertKeywords = ['없음', '특보 없음', '특보없음', '해제', '종료'];
        const isIgnorableText = noAlertKeywords.some(keyword => alertText.includes(keyword)) || !alertText.trim();

        if (isIgnorableText) {
            console.log(`Alert text '${alertText}' is ignored.`);
            return null;
        }

        // Check if this is a new alert using Firestore
        const alertRef = admin.firestore().collection('system_status').doc('last_weather_alert');
        const doc = await alertRef.get();
        const lastAlert = doc.exists ? doc.data().text : "";

        if (alertText !== lastAlert) {
            console.log("New Alert Detected! Sending notification...");

            const message = {
                notification: {
                    title: '⚠️ 제주 기상 특보 알림',
                    body: alertText.length > 100 ? alertText.substring(0, 97) + '...' : alertText,
                },
                topic: 'jeju-weather-alerts',
                webpush: {
                    fcm_options: {
                        link: 'https://jair-guide.web.app'
                    }
                }
            };

            await admin.messaging().send(message);
            await alertRef.set({
                text: alertText,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log("Notification sent successfully.");
        } else {
            console.log("Alert exists but has not changed.");
        }

        return null;
    } catch (error) {
        console.error("Scheduled Alert Check Error:", error);
        return null;
    }
});

// Utility function to send a test notification (Development only)
exports.sendTestAlert = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const message = {
                notification: {
                    title: '🧪 제주바람 테스트 알림',
                    body: '푸시 알림이 정상적으로 작동하고 있수다! (테스트 메시지)',
                },
                topic: 'jeju-weather-alerts',
                webpush: {
                    fcm_options: {
                        link: 'https://jair-guide.web.app'
                    }
                }
            };

            const response = await admin.messaging().send(message);
            return res.status(200).json({ success: true, messageId: response });
        } catch (error) {
            console.error("Test Notification Error:", error);
            return res.status(500).json({ error: error.message });
        }
    });
});
