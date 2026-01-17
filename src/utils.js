import { COLORS, MESSAGES, WEATHER_CODES } from './constants';


export function getWeather(code) {
    return WEATHER_CODES[code] || { label: '알 수 없음', icon: '🌡️' };
}

export const getPmStatus = (type, value) => {
    // Returns { text, color }
    // type: 'pm10' or 'pm25'
    if (type === 'pm10') {
        if (value <= 30) return { text: "좋음", color: "text-blue-400" };
        if (value <= 80) return { text: "보통", color: "text-green-400" };
        if (value <= 150) return { text: "나쁨", color: "text-orange-400" };
        return { text: "매우 나쁨", color: "text-red-500" };
    } else { // pm2.5
        if (value <= 15) return { text: "좋음", color: "text-blue-400" };
        if (value <= 35) return { text: "보통", color: "text-green-400" };
        if (value <= 75) return { text: "나쁨", color: "text-orange-400" };
        return { text: "매우 나쁨", color: "text-red-500" };
    }
};


export const getStatus = (pm10, pm2_5) => {
    let score = 0;
    if (pm10 > 150) score = Math.max(score, 3);
    else if (pm10 > 80) score = Math.max(score, 2);
    else if (pm10 > 30) score = Math.max(score, 1);

    if (pm2_5 > 75) score = Math.max(score, 3);
    else if (pm2_5 > 35) score = Math.max(score, 2);
    else if (pm2_5 > 15) score = Math.max(score, 1);

    switch (score) {
        case 0: return { type: 'good', color: COLORS.good, ...MESSAGES.good };
        case 1: return { type: 'moderate', color: COLORS.moderate, ...MESSAGES.moderate };
        case 2: return { type: 'unhealthy', color: COLORS.unhealthy, ...MESSAGES.unhealthy };
        case 3: return { type: 'hazardous', color: COLORS.hazardous, ...MESSAGES.hazardous };
        default: return { type: 'good', color: COLORS.good, ...MESSAGES.good };
    }
};

export const getHealthTips = (statusType) => {
    switch (statusType) {
        case 'good': return [
            { icon: '⛰️', text: '오름 산책' },
            { icon: '🪟', text: '창문 활짝' }
        ];
        case 'moderate': return [
            { icon: '🚶', text: '올레길 걷기' },
            { icon: '👀', text: '민감군 조심' }
        ];
        case 'unhealthy': return [
            { icon: '😷', text: '마스크 필수' },
            { icon: '🏠', text: '일찍 귀가' }
        ];
        case 'hazardous': return [
            { icon: '🚫', text: '방콕 추천' },
            { icon: '🪟', text: '창문 닫기' }
        ];
        default: return [];
    }
};

export const getWindDesc = (speed) => {
    if (speed < 5) return '고요함';
    if (speed < 20) return '산들바람';
    if (speed < 40) return '약간 강함';
    if (speed < 60) return '강한 바람';
    return '매우 강함';
};

export const getTravelIndex = (windSpeed, windGust, visibility, weatherCode) => {
    const result = {
        flight: { status: '정상 운항', color: 'text-emerald-400', icon: '✈️', desc: '하늘길이 활짝 열렸수다.' },
        ship: { status: '운항 원활', color: 'text-emerald-400', icon: '🚢', desc: '바당이 잔잔하맨.' },
        drive: { status: '드라이브 굿', color: 'text-emerald-400', icon: '🚗', desc: '해안도로 달리기 좋수다.' }
    };

    // 1. Flight (Wind & Gust - using km/h thresholds)
    // Thresholds: ~50km/h (14m/s) for delay, ~70km/h (19m/s) for cancellation
    if (windGust > 70 || windSpeed > 60) {
        result.flight = { status: '결항 주의', color: 'text-red-400', icon: '⛔', desc: '바람이 쎄서 비행기 못 뜰수도.' };
    } else if (windGust > 50 || windSpeed > 40) {
        result.flight = { status: '지연 가능성', color: 'text-yellow-400', icon: '⚠️', desc: '비행기가 덜컹거릴 거우다.' };
    }

    // 2. Ship (Wind)
    // Thresholds: ~30km/h (8m/s) for rough sea, ~50km/h (14m/s) for control
    if (windSpeed > 50) {
        result.ship = { status: '결항 통제', color: 'text-red-400', icon: '⚓', desc: '배 뜨기 힘들겠수다.' };
    } else if (windSpeed > 30) {
        result.ship = { status: '멀미 주의', color: 'text-yellow-400', icon: '🌊', desc: '파도가 높으니 멀미약 챙깁서.' };
    }

    // 3. Drive (Visibility & Weather)
    const isRainSnow = [51, 53, 55, 61, 63, 65, 71, 73, 75, 80, 81, 82, 85, 86, 95, 96, 99].includes(weatherCode);
    if (visibility < 200) {
        result.drive = { status: '운전 위험', color: 'text-red-400', icon: '🌫️', desc: '안개가 하영 꼈수다 (비상등!).' };
    } else if (visibility < 1000 || isRainSnow) {
        result.drive = { status: '안전 운전', color: 'text-yellow-400', icon: '🌧️', desc: '미끄러우니 살살 댕깁서.' };
    }

    return result;
};

export const calculateHallaIndex = (pm10, pm2_5, humidity) => {
    // Higher is better. Max 100.
    let score = 100;
    score -= (pm10 * 0.4);
    score -= (pm2_5 * 0.8);
    if (humidity > 80) score -= (humidity - 80) * 2;

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));

    if (finalScore > 85) return { score: finalScore, text: "백록담까지 잘 보염! 🏔️", color: "text-blue-400" };
    if (finalScore > 65) return { score: finalScore, text: "한라산 형태가 뚜렷하쿠다", color: "text-emerald-400" };
    if (finalScore > 40) return { score: finalScore, text: "호꼼 보이긴 하쿠당... 🌫️", color: "text-orange-400" };
    return { score: finalScore, text: "오늘은 보지 맙서, 꽝이우다!", color: "text-red-400" };
};

export const getJejuActivity = (statusType, temp) => {
    if (statusType === 'good') {
        if (temp > 15 && temp < 25) return { title: "올레길 걷기", desc: "지금 당장 밖에 나가서 걸읍서!" };
        return { title: "오름 등반", desc: "공기 좋으니 오름 한 번 올라봅서." };
    }
    if (statusType === 'moderate') {
        return { title: "숲길 산책", desc: "피톤치드 마시러 숲으로 갑서." };
    }
    if (statusType === 'unhealthy') {
        return { title: "미술관/박물관", desc: "오늘은 실내에서 문화생활 하읍서." };
    }
    return { title: "방구석 휴식", desc: "이불 밖은 위험하우다, 집이 최고!" };
};

export const getLifestyleTips = (pm10, pm2_5, humidity, weatherCode, hourly) => {
    const tips = {};

    // 1. 빨래 (Laundry) - 습도와 오늘 날씨
    // 비(50~)가 오거나 습도가 70% 이상이면 나쁨
    const isRainingNow = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode);

    // Check next 12 hours for rain
    let rainComing = false;
    if (hourly && hourly.weather_code) {
        rainComing = hourly.weather_code.slice(0, 12).some(code => [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code));
    }

    if (isRainingNow || rainComing) {
        tips.laundry = { score: 1, label: "실내 건조", desc: "비가 오거나 올 예정!", icon: "🌧️", color: "text-blue-400" };
    } else if (humidity >= 70) {
        tips.laundry = { score: 2, label: "제습기 필수", desc: "꿉꿉해질 수 있수다.", icon: "💧", color: "text-blue-300" };
    } else if (pm10 > 80 || pm2_5 > 35) {
        tips.laundry = { score: 2, label: "실내 건조", desc: "먼지가 달라붙어요.", icon: "😷", color: "text-orange-400" };
    } else {
        tips.laundry = { score: 3, label: "뽀송뽀송", desc: "햇볕 냄새 나게 널어봅서!", icon: "👕", color: "text-emerald-400" };
    }

    // 2. 세차 (Car Wash) - 향후 24~48시간 예보
    let rainIn2Days = false;
    if (hourly && hourly.weather_code) {
        rainIn2Days = hourly.weather_code.slice(0, 48).some(code => [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code));
    }

    if (rainIn2Days) {
        tips.carwash = { score: 1, label: "돈 낭비 맙서", desc: "조만간 비 소식 있수다.", icon: "💸", color: "text-red-400" };
    } else {
        tips.carwash = { score: 3, label: "세차하기 딱!", desc: "광택 한번 내봅서.", icon: "🚗", color: "text-emerald-400" };
    }

    // 3. 환기 (Ventilation) - 미세먼지 기준
    if (pm10 > 80 || pm2_5 > 35) {
        tips.ventilation = { score: 1, label: "문 닫읍서", desc: "공기청정기 돌립서.", icon: "🪟", color: "text-red-400" };
    } else if (pm10 > 30 || pm2_5 > 15) {
        tips.ventilation = { score: 2, label: "짧게 환기", desc: "5분만 활짝 여시난.", icon: "⏱️", color: "text-yellow-400" };
    } else {
        tips.ventilation = { score: 3, label: "활짝 여십서", desc: "맞바람 치게 여는 게 최고!", icon: "🍃", color: "text-emerald-400" };
    }

    // 4. 별 보기 (Stargazing) - 구름(Cloud Cover) + 날씨 + 먼지 (밤 기준이지만 현재 상태로 제안)
    // Need current cloud cover. Assuming we get it or infer from weather code.
    // Using weather code approximation if cloud cover logic is complex to pass here differently.
    // Ideally passed from hourly[0] or current.

    // Simple Logic based on weather code & PM
    const isClear = [0, 1].includes(weatherCode);
    if (!isClear) {
        tips.star = { score: 1, label: "구름 많음", desc: "오늘은 글렀수다.", icon: "☁️", color: "text-gray-400" };
    } else if (pm10 > 50) {
        tips.star = { score: 2, label: "흐릿해요", desc: "먼지 땜에 잘 안보여.", icon: "✨", color: "text-orange-300" };
    } else {
        tips.star = { score: 3, label: "은하수 가능", desc: "1100고지로 뜁서!", icon: "🌌", color: "text-purple-400" };
    }

    return tips;
};

export const calculateRadarStats = (pm10, pm2_5, temp, humidity, windSpeed, weatherCode) => {
    // Returns 0-100 score for 5 axes. High is Good.

    // 1. Cleanliness (Air)
    let clean = 100;
    clean -= pm10 * 0.4;
    clean -= pm2_5 * 0.8;
    clean = Math.max(0, Math.min(100, Math.round(clean)));

    // 2. Comfort (Temp/Hum) logic simplified
    // Ideal: 20-24C, 40-60% Hum
    let comfort = 100;
    const tempDiff = Math.abs(temp - 22);
    const humDiff = Math.abs(humidity - 50);
    comfort -= (tempDiff * 3);
    comfort -= (humDiff * 0.5);
    comfort = Math.max(0, Math.min(100, Math.round(comfort)));

    // 3. Visibility (Fog/Mist/Dust)
    // Weather codes for fog: 45, 48. Rain reduces visibility too.
    let visibility = 100;
    if ([45, 48].includes(weatherCode)) visibility -= 50;
    if ([51, 53, 55, 61, 63, 65].includes(weatherCode)) visibility -= 30;
    visibility -= (pm10 * 0.2); // Dust also affects
    visibility = Math.max(0, Math.min(100, Math.round(visibility)));

    // 4. Safety (UV - Mocked mostly as we don't have real UV yet, but inverted logic)
    // Assuming day time. 
    // We'll map "Good" UV to high score. 
    // Since we don't have UV data passed here effectively yet, let's use cloud cover proxy if possible
    // For now, let's random-ish/static or base on weather code (Clear = High UV risk = Low Safety Score)
    let safety = 80;
    if ([0, 1].includes(weatherCode)) safety = 40; // High UV likely
    safety = Math.max(0, Math.min(100, safety));

    // 5. Active (Wind)
    // High wind = bad for activity
    let active = 100;
    if (windSpeed > 10) active -= (windSpeed - 10) * 2;
    active = Math.max(0, Math.min(100, Math.round(active)));

    return { clean, comfort, visibility, safety, active };
};

export const getStyleRecommendation = (temp, windSpeed, humidity) => {
    // 1. Hair Warning (Wind & Humidity)
    let hair = { status: '안전', text: '머리 스타일 맘대로!', icon: '✨', color: 'text-emerald-300' };
    if (windSpeed > 10) {
        hair = { status: '포기', text: '머리카락 난리남! 묶는게 최고.', icon: '🌪️', color: 'text-red-300' };
    } else if (windSpeed > 6) {
        hair = { status: '주의', text: '스프레이 꽉! 바람 붑니다.', icon: '🌬️', color: 'text-orange-300' };
    } else if (humidity > 85) {
        hair = { status: '곱슬', text: '습해서 고데기 다 풀려요.', icon: '💧', color: 'text-blue-300' };
    }

    // 2. Outfit Recommendation (Temp with Wind Chill consideration)
    // Wind Chill Approx: Temp - (WindSpeed * 0.7) roughly for simple advice
    const feelsLike = temp - (windSpeed * 0.5);
    let outfit = { top: '', bottom: '', acc: [] };

    if (feelsLike > 28) {
        outfit = { top: '민소매/반팔', bottom: '반바지', acc: ['모자', '선글라스'] };
    } else if (feelsLike > 24) {
        outfit = { top: '반팔/얇은 셔츠', bottom: '면바지', acc: [] };
    } else if (feelsLike > 20) {
        outfit = { top: '긴팔 티셔츠', bottom: '청바지', acc: ['얇은 가디건'] };
    } else if (feelsLike > 16) {
        outfit = { top: '맨투맨/니트', bottom: '긴바지', acc: ['트렌치코트'] };
    } else if (feelsLike > 12) {
        outfit = { top: '도톰한 아우터', bottom: '긴바지', acc: ['스카프'] };
    } else if (feelsLike > 5) {
        outfit = { top: '코트/가죽자켓', bottom: '기모바지', acc: ['히트텍'] };
    } else {
        outfit = { top: '롱패딩/두꺼운 패딩', bottom: '기모바지', acc: ['목도리', '장갑'] };
    }

    if (windSpeed > 8) {
        outfit.acc.push('바람막이');
        if (outfit.bottom.includes('치마')) outfit.bottom += '(바람주의!)';
    }

    return { hair, outfit };
};
