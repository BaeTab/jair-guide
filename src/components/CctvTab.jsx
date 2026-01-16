import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';

// 제주도 CCTV 데이터 - 실제 작동하는 스트림 URL (25개+)
// 출처: hallasan-moa.kr (제주특별자치도 재난안전본부 CCTV)
const CCTV_DATA = [
    // 한라산 카테고리 (8개)
    { id: 'hallasan-1', name: '백록담', category: '한라산', url: 'http://119.65.216.155:1935/live/cctv01.stream_360p/playlist.m3u8', lat: 33.3617, lng: 126.5292 },
    { id: 'hallasan-2', name: '왕관릉', category: '한라산', url: 'http://119.65.216.155:1935/live/cctv02.stream_360p/playlist.m3u8', lat: 33.3583, lng: 126.5417 },
    { id: 'hallasan-3', name: '윗세오름', category: '한라산', url: 'http://119.65.216.155:1935/live/cctv03.stream_360p/playlist.m3u8', lat: 33.3667, lng: 126.5167 },
    { id: 'hallasan-4', name: '어승생악', category: '한라산', url: 'http://119.65.216.155:1935/live/cctv04.stream_360p/playlist.m3u8', lat: 33.3850, lng: 126.4972 },
    { id: 'hallasan-5', name: '1100도로', category: '한라산', url: 'http://211.114.96.121:1935/jejusi8/11-45.stream/playlist.m3u8', lat: 33.3639, lng: 126.4444 },
    { id: 'hallasan-6', name: '관음사 입구', category: '한라산', url: 'http://211.114.96.121:1935/jejusi8/11-44.stream/playlist.m3u8', lat: 33.4000, lng: 126.5667 },
    { id: 'hallasan-7', name: '절물자연휴양림', category: '한라산', url: 'http://211.114.96.121:1935/jejusi8/11-41.stream/playlist.m3u8', lat: 33.4500, lng: 126.6000 },

    // 해수욕장 카테고리 (9개)
    { id: 'beach-1', name: '함덕해수욕장', category: '해수욕장', url: 'http://211.114.96.121:1935/jejusi6/11-19.stream/playlist.m3u8', lat: 33.5433, lng: 126.6697 },
    { id: 'beach-2', name: '협재해수욕장', category: '해수욕장', url: 'http://211.114.96.121:1935/jejusi6/11-17.stream/playlist.m3u8', lat: 33.3936, lng: 126.2392 },
    { id: 'beach-3', name: '중문해수욕장', category: '해수욕장', url: 'http://59.8.86.15:1935/live/59.stream/playlist.m3u8', lat: 33.2456, lng: 126.4119 },
    { id: 'beach-4', name: '이호테우해수욕장', category: '해수욕장', url: 'http://211.114.96.121:1935/jejusi7/11-30T.stream/playlist.m3u8', lat: 33.4983, lng: 126.4533 },
    { id: 'beach-5', name: '월정리해수욕장', category: '해수욕장', url: 'http://211.114.96.121:1935/jejusi7/11-21.stream/playlist.m3u8', lat: 33.5569, lng: 126.7983 },
    { id: 'beach-6', name: '김녕해수욕장', category: '해수욕장', url: 'http://211.114.96.121:1935/jejusi6/11-20.stream/playlist.m3u8', lat: 33.5581, lng: 126.7578 },
    { id: 'beach-7', name: '삼양해수욕장', category: '해수욕장', url: 'http://211.114.96.121:1935/jejusi6/11-14.stream/playlist.m3u8', lat: 33.5256, lng: 126.5819 },
    { id: 'beach-8', name: '탑동해안도로', category: '해수욕장', url: 'http://59.8.86.15:1935/live/52.stream/playlist.m3u8', lat: 33.5167, lng: 126.5250 },

    // 주요 명소 카테고리 (5개)
    { id: 'spot-1', name: '성산일출봉', category: '주요명소', url: 'http://123.140.197.51/stream/34/play.m3u8', lat: 33.4583, lng: 126.9417 },
    { id: 'spot-2', name: '제주국제공항', category: '주요명소', url: 'http://123.140.197.51/stream/33/play.m3u8', lat: 33.5067, lng: 126.4931 },
    { id: 'spot-3', name: '섭지코지', category: '주요명소', url: 'http://211.34.191.215:1935/live/1-116.stream/playlist.m3u8', lat: 33.4244, lng: 126.9317 },
    { id: 'spot-4', name: '천지연폭포', category: '주요명소', url: 'http://211.34.191.215:1935/live/1-72.stream/playlist.m3u8', lat: 33.2472, lng: 126.5556 },
    { id: 'spot-5', name: '쇠소깍', category: '주요명소', url: 'http://211.34.191.215:1935/live/1-41.stream/playlist.m3u8', lat: 33.2500, lng: 126.6167 },

    // 항구 카테고리 (3개)
    { id: 'port-1', name: '모슬포항', category: '항구', url: 'http://211.34.191.215:1935/live/1-155.stream/playlist.m3u8', lat: 33.2139, lng: 126.2506 },
    { id: 'port-2', name: '추자도 예초항', category: '항구', url: 'http://211.114.96.121:1935/jejusi7/11-29.stream/playlist.m3u8', lat: 33.9500, lng: 126.3000 },

    // 도로 카테고리 (2개)
    { id: 'road-1', name: '평화로', category: '도로', url: 'http://59.8.86.94:8080/media/api/v1/hls/vurix/192871/100017/0/0/live.m3u8', lat: 33.3500, lng: 126.3000 },
];

const CATEGORIES = ['전체', '한라산', '해수욕장', '주요명소', '항구', '도로'];

// HLS Proxy URL Generator - HTTPS 프록시를 통해 Mixed Content 문제 해결
const getProxyUrl = (originalUrl) => {
    // 로컬 개발 환경에서는 원본 URL 사용 (Vite 프록시 또는 직접 접근)
    if (window.location.hostname === 'localhost') {
        return originalUrl;
    }
    // 프로덕션에서는 Cloud Function 프록시 사용
    const proxyBase = 'https://hlsproxy-nzdwns5qjq-uc.a.run.app';
    return `${proxyBase}?url=${encodeURIComponent(originalUrl)}`;
};

// HLS Video Player Component
function HlsPlayer({ url, onError }) {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !url) return;

        setIsLoading(true);
        setError(null);

        // Clean up previous HLS instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        // 프록시 URL 사용
        const streamUrl = getProxyUrl(url);

        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 30,
            });

            hlsRef.current = hls;
            hls.loadSource(streamUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setIsLoading(false);
                video.play().catch(e => console.log('Autoplay blocked:', e));
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    setError('스트림을 불러올 수 없습니다');
                    setIsLoading(false);
                    if (onError) onError(data);
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS support
            video.src = streamUrl;
            video.addEventListener('loadedmetadata', () => {
                setIsLoading(false);
                video.play().catch(e => console.log('Autoplay blocked:', e));
            });
            video.addEventListener('error', () => {
                setError('스트림을 불러올 수 없습니다');
                setIsLoading(false);
            });
        } else {
            setError('HLS를 지원하지 않는 브라우저입니다');
            setIsLoading(false);
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [url]);

    return (
        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                        <p className="text-white/60 text-sm">스트림 연결 중...</p>
                    </div>
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                    <div className="flex flex-col items-center gap-3 text-center px-4">
                        <div className="text-4xl">📹</div>
                        <p className="text-white/80 text-sm">{error}</p>
                        <p className="text-white/40 text-xs">잠시 후 다시 시도해주세요</p>
                    </div>
                </div>
            )}
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                controls
            />
        </div>
    );
}

// CCTV Card Component
function CctvCard({ cctv, onSelect, isSelected }) {
    const categoryColors = {
        '한라산': 'from-emerald-500 to-teal-600',
        '해수욕장': 'from-blue-500 to-cyan-600',
        '주요명소': 'from-purple-500 to-pink-600',
        '항구': 'from-orange-500 to-amber-600',
        '도로': 'from-slate-500 to-gray-600',
    };

    const categoryIcons = {
        '한라산': '⛰️',
        '해수욕장': '🏖️',
        '주요명소': '🏛️',
        '항구': '⚓',
        '도로': '🛣️',
    };

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(cctv)}
            className={`w-full text-left p-4 rounded-2xl transition-all duration-300 ${isSelected
                ? 'bg-white/20 ring-2 ring-white/40'
                : 'bg-white/5 hover:bg-white/10'
                }`}
        >
            <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryColors[cctv.category]} flex items-center justify-center text-xl shadow-lg`}>
                    {categoryIcons[cctv.category]}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{cctv.name}</h3>
                    <p className="text-xs text-white/60">{cctv.category}</p>
                </div>
                {isSelected && (
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                )}
            </div>
        </motion.button>
    );
}

export default function CctvTab() {
    const [selectedCategory, setSelectedCategory] = useState('전체');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCctv, setSelectedCctv] = useState(null);
    const [showPlayer, setShowPlayer] = useState(false);

    const filteredCctvs = CCTV_DATA.filter(cctv => {
        const matchesCategory = selectedCategory === '전체' || cctv.category === selectedCategory;
        const matchesSearch = cctv.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleSelect = (cctv) => {
        setSelectedCctv(cctv);
        setShowPlayer(true);
    };

    const handleClose = () => {
        setShowPlayer(false);
        setTimeout(() => setSelectedCctv(null), 300);
    };

    return (
        <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-black text-white">제주 CCTV</h1>
                        <p className="text-white/60 text-sm">실시간 제주도 현장 영상 ({CCTV_DATA.length}개)</p>
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">
                        📹
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="CCTV 검색..."
                        className="w-full bg-white/10 text-white placeholder-white/40 rounded-2xl px-5 py-3.5 pl-12 outline-none focus:ring-2 focus:ring-white/30 transition-all"
                    />
                    <svg
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
                    {CATEGORIES.map((category) => {
                        const count = category === '전체'
                            ? CCTV_DATA.length
                            : CCTV_DATA.filter(c => c.category === category).length;
                        return (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === category
                                    ? 'bg-white text-slate-900'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                                    }`}
                            >
                                {category} ({count})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* CCTV List */}
            <div className="flex-1 overflow-y-auto px-6 pb-32">
                <div className="space-y-3">
                    <p className="text-white/40 text-xs">{filteredCctvs.length}개의 CCTV</p>
                    {filteredCctvs.map((cctv) => (
                        <CctvCard
                            key={cctv.id}
                            cctv={cctv}
                            onSelect={handleSelect}
                            isSelected={selectedCctv?.id === cctv.id}
                        />
                    ))}
                </div>
            </div>

            {/* Video Player Modal */}
            <AnimatePresence>
                {showPlayer && selectedCctv && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                        onClick={handleClose}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            className="w-full max-w-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Player Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-black text-white">{selectedCctv.name}</h2>
                                    <p className="text-white/60 text-sm">{selectedCctv.category} · 실시간</p>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:bg-white/20 transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Video Player */}
                            <HlsPlayer url={selectedCctv.url} />

                            {/* Live Indicator */}
                            <div className="mt-4 flex items-center gap-2">
                                <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-xs font-bold">LIVE</span>
                                </div>
                                <span className="text-white/40 text-xs">
                                    ※ 일부 CCTV는 서버 상태에 따라 연결이 지연될 수 있습니다
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
