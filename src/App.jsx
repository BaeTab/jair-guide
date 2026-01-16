import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { analytics } from './firebase';
import { logEvent } from 'firebase/analytics';
import { INITIAL_LOCATIONS, COLORS, MESSAGES, THEMES } from './constants';
import { getWeather, getStatus, getTravelIndex, calculateHallaIndex, getJejuActivity, getLifestyleTips, calculateRadarStats } from './utils';
import ShareModal from './components/ShareModal';
import NavButton from './components/NavButton';

const MapTab = React.lazy(() => import('./components/MapTab'));
const FishingTab = React.lazy(() => import('./components/FishingTab'));
const HomeTab = React.lazy(() => import('./components/HomeTab'));
const InsightsTab = React.lazy(() => import('./components/InsightsTab'));
const SettingsTab = React.lazy(() => import('./components/SettingsTab'));
const CctvTab = React.lazy(() => import('./components/CctvTab'));

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
  const bgClass = themeColors?.bg ? `bg-gradient-to-br ${themeColors.bg}` : (isRain || isSnow || isCloudy ? 'bg-slate-900' : 'bg-slate-900');

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 transition-colors duration-1000 ${bgClass}`}>
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
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'map', 'insights', 'settings'

  // Analytics: Track screen views on tab change
  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'screen_view', {
        firebase_screen: activeTab,
        screen_name: activeTab
      });
    }
  }, [activeTab]);
  const [currentThemeId, setCurrentThemeId] = useState(localStorage.getItem('jeju-air-theme') || 'ocean');
  const [airportWeather, setAirportWeather] = useState(null);
  const [seaTripData, setSeaTripData] = useState(null);
  const [seaFishingData, setSeaFishingData] = useState(null);

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

        let locationName = "내 위치";
        try {
          // Use our own proxy to avoid CORS/403 with Nominatim
          const geoRes = await axios.get(
            '/api/reverse-geocode',
            {
              params: { lat: latitude, lon: longitude },
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

      return {
        ...currentAir,
        temp: appData.temp,
        weatherCode: appData.weatherCode,
        windSpeed: appData.windSpeed,
        windDirection: appData.windDirection,
        humidity: appData.humidity,
        uvIndex: appData.uvIndex, // Pass UV Index to frontend component
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

  const currentData = dataMap[selectedLoc.id];
  const weather = currentData ? getWeather(currentData.weatherCode) : { icon: '', label: '' };

  return (
    <motion.div
      className="min-h-screen w-full flex flex-col transition-colors duration-1000 ease-in-out font-sans scroll-smooth relative"
      animate={{ backgroundColor: mainStatus.color }}
      initial={{ backgroundColor: COLORS.good }}
    >
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

      {/* KakaoTalk In-App Browser Guide */}
      {isKakao && (
        <div className="fixed inset-0 z-[3000] flex flex-col items-center justify-center p-6 bg-emerald-600 text-white text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center max-w-sm"
          >
            <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center text-5xl mb-8 shadow-2xl animate-bounce">📱</div>
            <h2 className="text-2xl font-black mb-4 leading-tight">카카오톡에서는 <br />앱 설치가 루우(어렵습니다)!</h2>
            <p className="text-white/80 text-sm mb-10 leading-relaxed font-semibold">
              제바람 앱을 제대로 쓰려면 <br />
              <span className="text-yellow-300 underline font-bold">Safari(사파리)나 Chrome(크롬)</span>에서 <br />
              열어야 설치할 수 있수다!
            </p>

            <div className="bg-white/10 p-6 rounded-3xl border border-white/20 mb-10 w-full">
              <p className="text-xs font-bold mb-4 opacity-70">이동하는 방법</p>
              <p className="text-sm font-black mb-2 flex items-center gap-2 justify-center">
                <span className="bg-white text-emerald-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
                우측 상단 <strong className="text-yellow-300">세로 점 세개 (⋮ 또는 ···)</strong> 터치
              </p>
              <p className="text-sm font-black flex items-center gap-2 justify-center">
                <span className="bg-white text-emerald-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
                <strong className="text-yellow-300">'다른 브라우저로 열기'</strong> 또는 <br /> <strong className="text-yellow-300">'Safari로 열기'</strong> 선택
              </p>
            </div>

            <button
              onClick={() => {
                const url = window.location.href;
                // Common trick to force external browser for some versions of kakao
                if (isIOS) {
                  window.location.href = `kakaotalk://web/openExternalApp?url=${encodeURIComponent(url)}`;
                } else {
                  window.location.href = `intent://${url.replace(/https?:\/\//, '')}#Intent;scheme=http;package=com.android.chrome;end`;
                }
              }}
              className="w-full bg-white text-emerald-600 py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all text-sm mb-4"
            >
              지금 바로 사파리/크롬으로 열기
            </button>
            <button
              onClick={() => setIsKakao(false)}
              className="text-white/60 text-xs underline font-bold"
            >
              그냥 카톡에서 볼랩니다 (닫기)
            </button>
          </motion.div>
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
              />
            )}

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

            {activeTab === 'settings' && (
              <SettingsTab
                currentThemeId={currentThemeId}
                setCurrentThemeId={setCurrentThemeId}
                currentTheme={currentTheme}
                THEMES={THEMES}
              />
            )}


          </React.Suspense>
        </motion.div>
      </div >

      {/* Bottom Navigation */}
      < div className="fixed bottom-0 left-0 right-0 p-4 z-[4000] pointer-events-none" >
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="glass-premium glass-border rounded-[2.5rem] p-2 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 backdrop-blur-3xl overflow-x-auto">
            <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon="🏠" label="홈" />
            <NavButton active={activeTab === 'map'} onClick={() => setActiveTab('map')} icon="🗺️" label="공기맵" />
            <NavButton active={activeTab === 'cctv'} onClick={() => setActiveTab('cctv')} icon="📹" label="CCTV" />
            <NavButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} icon="📊" label="분석" />
            <NavButton active={activeTab === 'fishing'} onClick={() => setActiveTab('fishing')} icon="🎣" label="낚시" />
            <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon="✨" label="더보기" />
          </div>
        </div>
      </div >
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
