import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { analytics, messaging } from './firebase';
import { getToken } from 'firebase/messaging';
import { logEvent } from 'firebase/analytics';
import { INITIAL_LOCATIONS, COLORS, MESSAGES, THEMES } from './constants';
import { getWeather, getStatus, getTravelIndex, calculateHallaIndex, getJejuActivity, getLifestyleTips, calculateRadarStats } from './utils';
import { logEvent as logAnalyticsEvent, trackPageView, trackFeatureUse } from './analytics';
import ShareModal from './components/ShareModal';
import NavButton from './components/NavButton';

const MapTab = React.lazy(() => import('./components/MapTab'));
const FishingTab = React.lazy(() => import('./components/FishingTab'));
const HomeTab = React.lazy(() => import('./components/HomeTab'));
const InsightsTab = React.lazy(() => import('./components/InsightsTab'));
const SettingsTab = React.lazy(() => import('./components/SettingsTab'));
const CctvTab = React.lazy(() => import('./components/CctvTab'));
const CleanHouseTab = React.lazy(() => import('./components/CleanHouseTab'));
const PharmacyTab = React.lazy(() => import('./components/PharmacyTab'));
const StoneTowerTab = React.lazy(() => import('./components/StoneTowerTab'));
const HospitalTab = React.lazy(() => import('./components/HospitalTab'));
import BackgroundMesh from './components/BackgroundMesh';

// --- Configuration & Constants ---

function WeatherBackground({ weatherCode, statusType, themeColors }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate random particles once
    const newParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${2 + Math.random() * 3}s`,
      opacity: 0.1 + Math.random() * 0.4,
      size: `${2 + Math.random() * 4}px`
    }));
    setParticles(newParticles);
  }, []);

  const isRain = [51, 53, 55, 61, 63, 65, 95].includes(weatherCode);
  const isSnow = [71, 73, 75].includes(weatherCode);
  const isCloudy = [3, 45, 48].includes(weatherCode);
  const isDusty = ['unhealthy', 'hazardous'].includes(statusType);

  // Use theme background gradient if available, otherwise fallback
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 transition-colors duration-1000`}>
      {/* Rain Effect */}
      {isRain && particles.map(p => (
        <div
          key={p.id}
          className="absolute bg-white/40"
          style={{
            left: p.left,
            top: '-10vh',
            width: '1px',
            height: '20px',
            opacity: p.opacity,
            animation: `rain ${p.duration} linear infinite`,
            animationDelay: p.delay
          }}
        />
      ))}

      {/* Snow Effect */}
      {isSnow && particles.map(p => (
        <div
          key={p.id}
          className="absolute bg-white rounded-full"
          style={{
            left: p.left,
            top: '-10vh',
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `snow ${p.duration} linear infinite`,
            animationDelay: p.delay
          }}
        />
      ))}

      {/* Clouds */}
      {(isCloudy || isRain || isSnow) && (
        <>
          <div className="absolute top-[10%] -left-[20%] w-[80%] h-64 bg-white/5 blur-[80px] animate-pulse transition-all duration-[8000ms]" style={{ transform: 'translateX(10%)' }}></div>
          <div className="absolute top-[20%] -right-[10%] w-[70%] h-64 bg-white/5 blur-[80px] animate-pulse transition-all duration-[9000ms]" style={{ transform: 'translateX(-10%)' }}></div>
        </>
      )}

      {/* Sunny/Clear Glow & Theme Glow */}
      {!isRain && !isSnow && !isCloudy && (
        <>
          <div className="absolute -top-20 right-0 w-[500px] h-[500px] bg-white/10 blur-[120px] rounded-full mix-blend-overlay"></div>
          <div className="absolute top-1/2 -right-1/4 w-full h-64 bg-white/10 blur-[100px] animate-pulse transition-all duration-[12000ms]" style={{ transform: 'translateX(-20%)' }}></div>
        </>
      )}

      {/* Sun Rays / Dust Particles */}
      {!isRain && !isSnow && !isCloudy && particles.map(p => (
        <motion.div
          key={p.id}
          animate={{
            x: [0, Math.random() * 100 - 50],
            y: [0, Math.random() * 100 - 50],
            opacity: [0, p.opacity, 0]
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute rounded-full ${isDusty ? 'bg-orange-200/30' : 'bg-white/20'}`}
          style={{
            left: p.left,
            top: `${Math.random() * 100}%`,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </div>
  );
}

function App() {
  const [locations, setLocations] = useState(INITIAL_LOCATIONS);
  const [dataMap, setDataMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedLoc, setSelectedLoc] = useState(INITIAL_LOCATIONS[0]);
  const [mainStatus, setMainStatus] = useState(getStatus(0, 0));
  const [lastUpdated, setLastUpdated] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isKakao, setIsKakao] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAllMenu, setShowAllMenu] = useState(false);
  const [isVirtualMode, setIsVirtualMode] = useState(false); // 가상 여행 모드 상태
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const queryTab = params.get('tab');
    const hashTab = window.location.hash.replace('#', '');
    const tab = queryTab || hashTab;
    const validTabs = ['home', 'map', 'cctv', 'fishing', 'insights', 'cleanhouse', 'pharmacy', 'hospital', 'settings', 'stonetower'];
    return validTabs.includes(tab) ? tab : 'home';
  }); // 'home', 'map', 'insights', 'settings'

  // Deep Linking Routing (Hash and Query Params)
  useEffect(() => {
    const handleRouting = () => {
      const params = new URLSearchParams(window.location.search);
      const queryTab = params.get('tab');
      const hashTab = window.location.hash.replace('#', '');
      const tab = queryTab || hashTab;

      const validTabs = ['home', 'map', 'cctv', 'fishing', 'insights', 'cleanhouse', 'pharmacy', 'hospital', 'settings', 'stonetower'];
      if (validTabs.includes(tab)) {
        setActiveTab(tab);
      }
    };

    handleRouting();
    window.addEventListener('hashchange', handleRouting);
    // Listen for history changes if needed, but for now hash/init is usually enough
    return () => window.removeEventListener('hashchange', handleRouting);
  }, []);

  // Initialize Kakao SDK
  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(import.meta.env.VITE_KAKAO_JS_KEY);
      console.log('Kakao SDK Initialized');
    }
  }, []);

  // Analytics: Track screen views on tab change
  useEffect(() => {
    // 1. Firebase Analytics (Legacy/Existing)
    if (analytics) {
      logEvent(analytics, 'screen_view', {
        firebase_screen: activeTab,
        screen_name: activeTab
      });
    }
    // 2. Custom GA4 Wrapper
    trackPageView(activeTab);
  }, [activeTab]);
  const [currentThemeId, setCurrentThemeId] = useState(localStorage.getItem('jeju-air-theme') || 'ocean');
  const [airportWeather, setAirportWeather] = useState(null);
  const [seaTripData, setSeaTripData] = useState(null);
  const [seaFishingData, setSeaFishingData] = useState(null);
  const [coupangAds, setCoupangAds] = useState(null);


  // ...

  const currentTheme = THEMES[currentThemeId];


  useEffect(() => {
    // Detect iOS, Kakao, and Standalone mode
    const ua = navigator.userAgent || "";
    const ios = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const kakao = /KAKAOTALK/i.test(ua);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    setIsIOS(ios);
    setIsKakao(kakao);
    setIsStandalone(standalone);

    const handler = (e) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      if (!kakao) setShowBanner(true); // Don't show regular banner in Kakao in-app
    };
    window.addEventListener('beforeinstallprompt', handler);

    // If iOS and not standalone and not Kakao, show banner
    if (ios && !standalone && !kakao) {
      setShowBanner(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    localStorage.setItem('jeju-air-theme', currentThemeId);
  }, [currentThemeId]);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) {
      console.log('Install prompt not available');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('Install outcome:', outcome);
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  useEffect(() => {
    // Auto-detect location on startup
    handleMyLocation();
  }, []);

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log("Detected coordinates:", latitude, longitude);

        // Check if inside Jeju (Approx Bounds: Lat 33.1~34.0, Lon 126.1~127.0)
        const isJeju = latitude > 33.1 && latitude < 34.0 && longitude > 126.0 && longitude < 127.0;

        let locationName = "내 위치";
        let targetLat = latitude;
        let targetLng = longitude;

        if (!isJeju) {
          // Virtual Mode: Force location to Jeju Airport
          console.log("User is outside Jeju. Activating Virtual Mode.");
          setIsVirtualMode(true);
          targetLat = 33.5066;
          targetLng = 126.4930;
          locationName = '제주공항 (여행 미리보기)';
        } else {
          // Real Jeju Mode
          setIsVirtualMode(false);
        }

        try {
          // Use our own proxy to avoid CORS/403 with Nominatim
          const geoRes = await axios.get(
            '/api/reverse-geocode',
            {
              params: { lat: targetLat, lon: targetLng },
              timeout: 10000
            }
          );
          if (geoRes.data && geoRes.data.address) {
            const addr = geoRes.data.address;
            locationName = addr.village || addr.suburb || addr.town || addr.neighbourhood || addr.city_district || addr.borough || addr.city;

            if (!locationName && geoRes.data.display_name) {
              const parts = geoRes.data.display_name.split(',');
              locationName = parts[0].trim();
            }

            locationName = locationName || "내 위치";
            console.log("Resolved location name:", locationName);
          }
        } catch (e) {
          console.warn("Geocoding failed, using fallback '내 위치'", e);
        }

        const myLoc = { id: 'my-location', name: locationName, lat: latitude, lng: longitude };

        setLocations(prev => {
          const filtered = prev.filter(l => l.id !== 'my-location');
          return [...filtered, myLoc];
        });
        setSelectedLoc(myLoc);
      },
      (error) => {
        setLoading(false);
        console.error("Geolocation error:", error);
        // Don't alert on startup if it's just a permission check, but log it
        if (error.code === 1) {
          console.log("Location permission denied");
        }
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 30000 }
    );
  };

  /* optimized data fetching */
  const fetchSingleLocation = async (loc) => {
    let currentAir = { pm10: 0, pm2_5: 0, stationName: 'N/A' };
    let appData = null;

    try {
      // Fetch Air Korea Quality via Firebase Cloud Function
      const airRes = await axios.get('/api/air', {
        params: { lat: loc.lat, lng: loc.lng },
        timeout: 5000
      });
      if (airRes.data.current) currentAir = airRes.data.current;
    } catch (e) {
      console.warn(`Air API failed for ${loc.name}`, e);
    }

    try {
      // Fetch KMA Weather via Firebase Cloud Function (Proxy)
      const weatherRes = await axios.get('/api/weather', {
        params: { lat: loc.lat, lng: loc.lng },
        timeout: 10000 // Reduced timeout
      });
      appData = weatherRes.data.app_compatible;
    } catch (e) {
      console.error(`Weather API failed for ${loc.name}`, e);
      return null;
    }

    if (appData) {
      const hallaIndex = calculateHallaIndex(currentAir.pm10, currentAir.pm2_5, appData.humidity);
      const status = getStatus(currentAir.pm10, currentAir.pm2_5);
      const activity = getJejuActivity(status.type, appData.temp);

      const travelIndex = getTravelIndex(
        appData.windSpeed,
        appData.windGusts,
        appData.visibility,
        appData.weatherCode
      );

      // Calculate feel temperature (wind chill approximation)
      const feelTemp = Math.round(appData.temp - (appData.windSpeed * 0.5));

      return {
        ...currentAir,
        temp: appData.temp,
        feelTemp, // Added: 체감온도
        rainAmt: 0, // Default: 현재 API에서 실시간 강수량 미제공
        weatherCode: appData.weatherCode,
        windSpeed: appData.windSpeed,
        windDirection: appData.windDirection,
        humidity: appData.humidity,
        uvIndex: appData.uvIndex,
        next6Hours: appData.hourly ? appData.hourly.slice(0, 6) : [],
        status,
        hallaIndex,
        activity,
        travelIndex,
        lifestyle: getLifestyleTips(currentAir.pm10, currentAir.pm2_5, appData.humidity, appData.weatherCode, null),
        radarStats: calculateRadarStats(currentAir.pm10, currentAir.pm2_5, appData.temp, appData.humidity, appData.windSpeed, appData.weatherCode)
      };
    }
    return null;
  };

  const fetchAllData = async (targetLocs = locations) => {
    // Only block UI on initial load
    if (Object.keys(dataMap).length === 0) setLoading(true);

    try {
      // 1. Fetch auxiliary data in background
      axios.get('/api/airport-weather', { timeout: 10000 })
        .then(res => { if (res.data?.data) setAirportWeather(res.data); })
        .catch(e => console.warn(e));

      axios.get('/api/sea-trip', { timeout: 30000 })
        .then(res => { if (res.data?.success !== false) setSeaTripData(res.data); })
        .catch(e => console.warn(e));

      axios.get('/api/fishing', { timeout: 30000 })
        .then(res => { if (res.data?.success !== false) setSeaFishingData(res.data); })
        .catch(e => console.warn(e));

      // 🎯 Coupang Ads Keyword Rotation Logic
      const adKeywords = [
        '제주 감귤', '제주 특산물', '제주 한라봉', '제주도 여행', '제주 흑돼지',
        '제주도 카페', '제주도 기념품', '한라산 기념품', '제주 갈치', '제주 마음샌드',
        '제주 오메기떡', '제주도 렌터카', '제주 항공권', '제주도 숙소', '제주도 굿즈',
        '제주 우산', '제주 보조배터리', '제주 등산용품', '제주 서핑', '제주도 낚시',
        '제주 선글라스', '제주 자외선차단제', '제주 비옷', '제주 캔들', '제주 방향제'
      ];

      // Get last used index from localStorage to ensure true rotation
      let lastIdx = parseInt(localStorage.getItem('lastAdKeywordIdx') || '-1');
      let nextIdx = (lastIdx + 1) % adKeywords.length;
      localStorage.setItem('lastAdKeywordIdx', nextIdx.toString());

      const rotationKeyword = adKeywords[nextIdx];

      axios.get('/api/ads', { params: { keyword: rotationKeyword, limit: 10 }, timeout: 10000 })
        .then(res => { if (res.data?.data?.productData) setCoupangAds(res.data.data.productData); })
        .catch(e => console.warn('Ads Fetch Error:', e));

      // 2. Prioritize Selected Location
      const currentLocData = await fetchSingleLocation(selectedLoc);
      if (currentLocData) {
        setDataMap(prev => ({ ...prev, [selectedLoc.id]: currentLocData }));

        // Critical data loaded, unblock UI immediately
        setLoading(false);
      }

      // 3. Fetch others in parallel chunks
      const otherLocs = targetLocs.filter(l => l.id !== selectedLoc.id);
      const CHUNK_SIZE = 2; // 2 concurrent requests

      for (let i = 0; i < otherLocs.length; i += CHUNK_SIZE) {
        const chunk = otherLocs.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(async (loc) => {
          // Small artificial delay to be nice to APIs not needed if parallel is low, but keeping logic sane
          // await new Promise(r => setTimeout(r, 100)); 
          const data = await fetchSingleLocation(loc);
          if (data) {
            setDataMap(prev => ({ ...prev, [loc.id]: data }));
          }
        }));
      }

      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    } catch (error) {
      console.error("Critical error in fetchAllData", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => fetchAllData(), 600000);
    return () => clearInterval(interval);
  }, [locations]);

  useEffect(() => {
    if (dataMap[selectedLoc.id]) {
      setMainStatus(dataMap[selectedLoc.id].status);
    }
  }, [selectedLoc, dataMap]);

  useEffect(() => {
    const handleTabChange = (e) => {
      if (e.detail) setActiveTab(e.detail);
    };
    window.addEventListener('changeTab', handleTabChange);
    return () => window.removeEventListener('changeTab', handleTabChange);
  }, []);

  const subscribeToAlerts = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.');
        return;
      }

      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });

      if (token) {
        await axios.post('/api/subscribe-alerts', { token });
        alert('제주 기상 특보 알림 구독이 완료되었습니다! ⚠️');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('알림 구독 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const currentData = dataMap[selectedLoc.id];
  const weather = currentData ? getWeather(currentData.weatherCode) : { icon: '', label: '' };

  return (
    <motion.div
      className="min-h-screen w-full flex flex-col transition-colors duration-1000 ease-in-out font-sans scroll-smooth relative overflow-hidden"
    >
      <BackgroundMesh themeId={currentThemeId} mainStatus={mainStatus} />
      {/* Install Banner at the absolute top */}
      {showBanner && activeTab === 'home' && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="w-full bg-white text-emerald-600 py-3 px-6 flex justify-between items-center z-[1000] sticky top-0 shadow-2xl border-b-2 border-emerald-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl shadow-inner">🍃</div>
            <div>
              <h4 className="text-sm font-black leading-tight">제주바람 앱 설치하기</h4>
              <p className="text-[10px] opacity-80 font-medium tracking-tight whitespace-nowrap">{isIOS ? "아이폰 설치 방법을 확인하세요" : "더 빠르고 편리하게 확인하세요!"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-emerald-200 active:scale-95 transition-all"
            >
              {isIOS ? "방법 보기" : "설치"}
            </button>
            <button onClick={() => setShowBanner(false)} className="p-2 text-emerald-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}

      {/* iOS Install Guide Overlay */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl relative overflow-hidden text-neutral-800"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center text-4xl mb-4 shadow-inner ring-4 ring-emerald-50/50">🍃</div>
              <h3 className="text-xl font-black mb-6 text-neutral-900">아이폰에서 앱 설치하기</h3>

              <div className="space-y-6 w-full text-left">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex-shrink-0 flex items-center justify-center text-emerald-600 font-bold text-sm">1</div>
                  <div className="text-sm leading-relaxed font-semibold">
                    하단의 브라우저 메뉴에서 <br />
                    <strong className="text-emerald-500 font-bold">공기 버튼(공유 아이콘)</strong>을 클릭하세요.
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex-shrink-0 flex items-center justify-center text-emerald-600 font-bold text-sm">2</div>
                  <div className="text-sm leading-relaxed font-semibold">
                    메뉴 리스트를 내려 <br />
                    <strong className="text-emerald-500 font-bold">'홈 화면에 추가'</strong>를 누르면 끝!
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full mt-10 bg-emerald-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-200 active:scale-95 transition-all text-sm"
              >
                확인했습니다!
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* KakaoTalk In-App Browser - 더 이상 전체 화면 블로킹 안함. 하단에 작은 배너로 대체 */}
      {isKakao && activeTab === 'home' && (
        <div className="fixed bottom-20 left-4 right-4 z-[1000] bg-amber-500 text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">💡</span>
            <p className="text-xs font-bold">앱 설치는 Safari/Chrome에서!</p>
          </div>
          <button
            onClick={() => setIsKakao(false)}
            className="text-white/80 text-xs font-bold px-3 py-1 bg-white/20 rounded-full"
          >
            닫기
          </button>
        </div>
      )}
      <WeatherBackground
        weatherCode={currentData?.weatherCode}
        statusType={mainStatus.type}
        themeColors={currentTheme.colors}
      />
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white rounded-full blur-3xl mix-blend-overlay"></div>
        <div className="absolute top-40 -left-20 w-72 h-72 bg-white rounded-full blur-3xl mix-blend-overlay"></div>
      </div>

      {/* Main Content Sections */}
      <div className="flex-1 relative overflow-hidden">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute inset-0 w-full h-full flex flex-col"
        >
          <React.Suspense fallback={<div className="flex-1 flex items-center justify-center text-white/50">로딩중...</div>}>
            {activeTab === 'home' && (
              <HomeTab
                setShowShareModal={setShowShareModal}
                selectedLoc={selectedLoc}
                handleMyLocation={handleMyLocation}
                lastUpdated={lastUpdated}
                fetchAllData={fetchAllData}
                loading={loading}
                mainStatus={mainStatus}
                currentData={currentData}
                seaTripData={seaTripData}
                airportWeather={airportWeather}
                coupangAds={coupangAds}
              />
            )}

            {activeTab === 'hospital' && <HospitalTab />}
            {activeTab === 'map' && (
              <MapTab
                locations={locations}
                dataMap={dataMap}
                selectedLoc={selectedLoc}
                setSelectedLoc={setSelectedLoc}
                mainStatus={mainStatus}
                seaTripData={seaTripData}
              />
            )}

            {activeTab === 'fishing' && (
              <FishingTab
                seaTripData={seaTripData}
                seaFishingData={seaFishingData}
                loading={loading}
              />
            )}

            {activeTab === 'cctv' && (
              <CctvTab />
            )}

            {activeTab === 'insights' && (
              <InsightsTab
                currentData={currentData}
                loading={loading}
              />
            )}

            {activeTab === 'stonetower' && (
              <StoneTowerTab currentTheme={currentTheme} />
            )}

            {activeTab === 'cleanhouse' && (
              <CleanHouseTab />
            )}

            {activeTab === 'pharmacy' && (
              <PharmacyTab />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                currentThemeId={currentThemeId}
                setCurrentThemeId={setCurrentThemeId}
                currentTheme={currentTheme}
                THEMES={THEMES}
                subscribeToAlerts={subscribeToAlerts}
              />
            )}


          </React.Suspense>
        </motion.div>
      </div >

      {/* Virtual Mode Banner */}
      <AnimatePresence>
        {isVirtualMode && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[6000] p-2 flex justify-center pointer-events-none"
          >
            <div className="bg-emerald-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg border border-white/10 flex items-center gap-2 text-xs font-bold pointer-events-auto shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <span>✈️ 제주 여행 미리보기 모드 실행 중</span>
              <button
                onClick={() => setIsVirtualMode(false)}
                className="ml-2 w-5 h-5 flex items-center justify-center bg-black/20 rounded-full hover:bg-black/30"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Menu */}
      <AnimatePresence>
        {showAllMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[5000]"
              onClick={() => setShowAllMenu(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-3xl rounded-t-[2.5rem] p-6 z-[6000] border-t border-white/10 pb-12 safe-area-bottom shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8" />

              <h3 className="text-white/50 text-xs font-bold mb-4 ml-1">전체 메뉴</h3>
              <div className="grid grid-cols-4 gap-4">
                <button
                  onClick={() => { setActiveTab('map'); setShowAllMenu(false); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
                >
                  <div className="text-3xl filter drop-shadow-lg">🗺️</div>
                  <span className="text-xs font-medium text-white">공기맵</span>
                </button>
                <button
                  onClick={() => { setActiveTab('cctv'); setShowAllMenu(false); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
                >
                  <div className="text-3xl filter drop-shadow-lg">📹</div>
                  <span className="text-xs font-medium text-white">CCTV</span>
                </button>
                <button
                  onClick={() => { setActiveTab('fishing'); setShowAllMenu(false); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
                >
                  <div className="text-3xl filter drop-shadow-lg">🎣</div>
                  <span className="text-xs font-medium text-white">낚시</span>
                </button>
                <button
                  onClick={() => { setActiveTab('insights'); setShowAllMenu(false); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
                >
                  <div className="text-3xl filter drop-shadow-lg">📊</div>
                  <span className="text-xs font-medium text-white">분석</span>
                </button>

                <button
                  onClick={() => { setActiveTab('cleanhouse'); setShowAllMenu(false); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
                >
                  <div className="text-3xl filter drop-shadow-lg">♻️</div>
                  <span className="text-xs font-medium text-white">클린하우스</span>
                </button>

                <button
                  onClick={() => { setActiveTab('pharmacy'); setShowAllMenu(false); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
                >
                  <div className="text-3xl filter drop-shadow-lg">💊</div>
                  <span className="text-xs font-medium text-white">약국</span>
                </button>

                <button
                  onClick={() => { setActiveTab('hospital'); setShowAllMenu(false); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
                >
                  <div className="text-3xl filter drop-shadow-lg">🏥</div>
                  <span className="text-xs font-medium text-white">병원</span>
                </button>

                <button
                  onClick={() => { window.open('https://myrealt.rip/T89qab', '_blank'); setShowAllMenu(false); }}
                  className="relative flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all group border border-white/5"
                >
                  <div className="absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg text-[8px] font-black text-white shadow-lg shadow-emerald-500/20 z-10 scale-0 group-hover:scale-100 transition-transform">GO!</div>
                  <div className="absolute top-2 right-2 px-1 py-0.5 bg-white/10 border border-white/10 rounded-[6px] text-[7px] font-black text-white/40 leading-none">REALT</div>
                  <div className="text-3xl filter drop-shadow-lg group-hover:scale-110 transition-transform">🚗</div>
                  <span className="text-xs font-medium text-white/80 group-hover:text-white">렌터카</span>
                </button>

                <button
                  onClick={() => { window.open('https://myrealt.rip/T8B1bc', '_blank'); setShowAllMenu(false); }}
                  className="relative flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all group border border-white/5"
                >
                  <div className="absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg text-[8px] font-black text-white shadow-lg shadow-emerald-500/20 z-10 scale-0 group-hover:scale-100 transition-transform">GO!</div>
                  <div className="absolute top-2 right-2 px-1 py-0.5 bg-white/10 border border-white/10 rounded-[6px] text-[7px] font-black text-white/40 leading-none">REALT</div>
                  <div className="text-3xl filter drop-shadow-lg group-hover:scale-110 transition-transform">🏄</div>
                  <span className="text-xs font-medium text-white/80 group-hover:text-white">액티비티</span>
                </button>

                <button
                  onClick={() => { window.open('https://myrealt.rip/T8Bk65', '_blank'); setShowAllMenu(false); }}
                  className="relative flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all group border border-white/5"
                >
                  <div className="absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg text-[8px] font-black text-white shadow-lg shadow-emerald-500/20 z-10 scale-0 group-hover:scale-100 transition-transform">GO!</div>
                  <div className="absolute top-2 right-2 px-1 py-0.5 bg-white/10 border border-white/10 rounded-[6px] text-[7px] font-black text-white/40 leading-none">REALT</div>
                  <div className="text-3xl filter drop-shadow-lg group-hover:scale-110 transition-transform">✈️</div>
                  <span className="text-xs font-medium text-white/80 group-hover:text-white">항공권</span>
                </button>

                <button
                  onClick={() => { window.open('https://myrealt.rip/T8C7fd', '_blank'); setShowAllMenu(false); }}
                  className="relative flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all group border border-white/5"
                >
                  <div className="absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg text-[8px] font-black text-white shadow-lg shadow-emerald-500/20 z-10 scale-0 group-hover:scale-100 transition-transform">GO!</div>
                  <div className="absolute top-2 right-2 px-1 py-0.5 bg-white/10 border border-white/10 rounded-[6px] text-[7px] font-black text-white/40 leading-none">REALT</div>
                  <div className="text-3xl filter drop-shadow-lg group-hover:scale-110 transition-transform">🏨</div>
                  <span className="text-xs font-medium text-white/80 group-hover:text-white">숙소</span>
                </button>

                <button
                  onClick={() => { window.open('https://link.coupang.com/a/duDnnA', '_blank'); setShowAllMenu(false); }}
                  className="relative flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all group border border-white/5"
                >
                  <div className="absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg text-[8px] font-black text-white shadow-lg shadow-orange-500/20 z-10 scale-0 group-hover:scale-100 transition-transform">HOT!</div>
                  <div className="absolute top-2 right-2 px-1 py-0.5 bg-white/10 border border-white/10 rounded-[6px] text-[7px] font-black text-white/40 leading-none">PANG</div>
                  <div className="text-3xl filter drop-shadow-lg group-hover:scale-110 transition-transform">☕</div>
                  <span className="text-xs font-medium text-white/80 group-hover:text-white">카페</span>
                </button>

                <button
                  onClick={() => { setActiveTab('stonetower'); setShowAllMenu(false); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-400/20 border border-amber-400/30 hover:bg-amber-400/30 active:scale-95 transition-all"
                >
                  <div className="text-3xl filter drop-shadow-lg">🪨</div>
                  <span className="text-xs font-black text-amber-200">소원 돌탑</span>
                </button>

                {/* Future Features (Coming Soon) */}
                <button className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 opacity-40 grayscale">
                  <div className="text-3xl">🚌</div>
                  <span className="text-xs font-medium text-white">교통(예정)</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-[4000] pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="glass-premium glass-border rounded-[2.5rem] p-2 flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 backdrop-blur-3xl px-4">
            <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon="🏠" label="홈" />

            <div className="relative -top-6">
              <button
                onClick={() => setShowAllMenu(true)}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex flex-col items-center justify-center shadow-[0_10px_20px_rgba(16,185,129,0.3)] border-4 border-[#1a1f2c] active:scale-95 transition-all"
              >
                <span className="filter drop-shadow-md text-white text-2xl mb-0.5">🧊</span>
                <span className="text-[10px] font-bold text-white/90 leading-none">메뉴</span>
              </button>
            </div>

            <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon="✨" label="더보기" />
          </div>
        </div>
      </div>
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        data={{ ...currentData, locationName: selectedLoc.name }}
        mainStatus={mainStatus}
        weather={weather}
        themeColors={currentTheme.colors}
      />
    </motion.div >
  );
}



export default App;
