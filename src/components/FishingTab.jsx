import React from 'react';
import { motion } from 'framer-motion';
import TiltCard from './TiltCard';
import SupportButton from './SupportButton';
import { COLORS } from '../constants';

export default function FishingTab({ seaTripData, seaFishingData, loading }) {
    const [filterType, setFilterType] = React.useState('ALL'); // ALL, 갯바위, 선상
    const [filterTime, setFilterTime] = React.useState('ALL'); // ALL, 1 (오전), 2 (오후)
    const [searchFish, setSearchFish] = React.useState('');

    // Robustly calculate summary from regions if available
    const summaryStats = React.useMemo(() => {
        const defaultStats = { avgWave: '-', avgWind: '-', avgTemp: '-', index: '정보없음' };

        if (!seaTripData?.regions || seaTripData.regions.length === 0) return defaultStats;

        let totalWave = 0;
        let totalWind = 0;
        let totalTemp = 0;
        let count = 0;

        seaTripData.regions.forEach(region => {
            // Get today's first forecast (AM or PM)
            const forecast = region.forecast?.[0];
            if (forecast) {
                totalWave += (forecast.waveHeight || 0);
                totalWind += (forecast.windSpeed || 0);
                totalTemp += (forecast.waterTemp || 0);
                count++;
            }
        });

        if (count === 0) return defaultStats;

        return {
            avgWave: (totalWave / count).toFixed(1),
            avgWind: (totalWind / count).toFixed(1),
            avgTemp: (totalTemp / count).toFixed(1),
            index: seaTripData.summary?.overallIndex || '보통'
        };
    }, [seaTripData]);

    const fishingPoints = seaFishingData?.data || [];

    // Filter logic
    const filteredPoints = fishingPoints.filter(point => {
        const pointTimeStr = String(point.time || '').trim();
        const matchType = filterType === 'ALL' || point.type === filterType;
        const matchTime = filterTime === 'ALL' || pointTimeStr === filterTime;
        const matchFish = !searchFish || (point.targetFish && point.targetFish.includes(searchFish));
        return matchType && matchTime && matchFish;
    });

    if (loading || (!seaTripData && !seaFishingData)) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-white/50 h-full">
                <div className="animate-spin text-4xl mb-4">🎣</div>
                <p>낚시 정보를 낚아올리는 중...</p>
            </div>
        );
    }

    // Helper to determine fishing condition color based on index and score
    const getFishingConditionColor = (index, score) => {
        if (index === '좋음') return 'text-emerald-400';
        if (index === '보통') return 'text-blue-400';
        if (index === '나쁨') return 'text-orange-400';
        return 'text-red-400';
    };

    const formatDate = (dateVal) => {
        const s = String(dateVal || '').trim();
        if (s.length === 8) return `${s.slice(4, 6)}/${s.slice(6, 8)}`;
        return s;
    };

    return (
        <div className="flex-1 overflow-y-auto pt-6 px-4 pb-24 text-white z-10 scroll-smooth bg-slate-900/50">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <span className="text-4xl">🎣</span> 제주 낚시
                    </h2>
                    <SupportButton />
                </div>
                <p className="text-white/60 text-sm mt-1">물때와 파고 확인하고 안전하게 즐기세요.</p>
            </div>

            {/* Live Tide Banner */}
            {seaFishingData?.tide && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="glass-card glass-border rounded-[2rem] p-5 flex flex-col md:flex-row items-center justify-between gap-4 border-cyan-500/20 bg-cyan-500/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-cyan-500/10 transition-all duration-1000"></div>

                        <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
                            <div className="w-14 h-14 rounded-[1.25rem] bg-cyan-500/10 flex items-center justify-center text-3xl shadow-inner border border-cyan-500/20 animate-pulse">🌊</div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black text-cyan-400">{seaFishingData.tide.status}</span>
                                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-lg font-black uppercase tracking-tight border border-cyan-500/10">Jeju Tide</span>
                                </div>
                                <p className="text-xs text-white/50 mt-1 font-medium">물흐름: <span className="text-white font-black">{seaFishingData.tide.flowIntensity}</span></p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-8 bg-black/20 p-3 rounded-2xl border border-white/5 relative z-10">
                            {seaFishingData.tide.approxTides.map((t, i) => (
                                <div key={i} className="text-center group/tide">
                                    <div className={`text-[10px] font-black mb-1 uppercase tracking-tighter ${t.type === 'high' ? 'text-rose-400 group-hover/tide:text-rose-300' : 'text-cyan-400 group-hover/tide:text-cyan-300'} transition-colors`}>
                                        {t.type === 'high' ? '만조' : '간조'}
                                    </div>
                                    <div className="text-sm font-black text-white px-2">{t.time}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Summary Hero Card */}
            <div className="mb-8 relative group">
                <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full group-hover:bg-blue-500/20 transition-all duration-1000"></div>
                <TiltCard className="mb-0">
                    <div className="glass-card glass-border rounded-[2.5rem] p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl rotate-12 pointer-events-none">🐟</div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <div className="text-sm font-bold text-blue-300 mb-1">오늘의 바다 평균</div>
                                    <div className="text-4xl font-black tracking-tight">{summaryStats.avgWave}m <span className="text-2xl text-white/50 font-medium">파고</span></div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-cyan-300 mb-1">수온</div>
                                    <div className="text-3xl font-black">{summaryStats.avgTemp}°C</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
                                    <div className="text-2xl mb-1">🌊</div>
                                    <div className="text-[10px] text-white/60 font-bold">평균 파고</div>
                                    <div className="font-black text-lg">{summaryStats.avgWave}m</div>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
                                    <div className="text-2xl mb-1">🌬️</div>
                                    <div className="text-[10px] text-white/60 font-bold">평균 풍속</div>
                                    <div className="font-black text-lg">{summaryStats.avgWind}m/s</div>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
                                    <div className="text-2xl mb-1">🛡️</div>
                                    <div className="text-[10px] text-white/60 font-bold">안전 지수</div>
                                    <div className={`font-black text-lg ${summaryStats.index === '좋음' ? 'text-emerald-400' :
                                        summaryStats.index === '보통' ? 'text-yellow-400' : 'text-red-400'
                                        }`}>{summaryStats.index}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TiltCard>
            </div>

            {/* Filter & List Header */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
                        주요 포인트 ({filteredPoints.length})
                    </h3>

                    <div className="flex gap-2 w-full sm:w-auto">
                        {/* Type Filter */}
                        <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-md flex-1 sm:flex-none">
                            {['ALL', '갯바위', '선상'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`flex-1 sm:px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filterType === type
                                        ? 'bg-blue-500 text-white shadow-lg'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {type === 'ALL' ? '전체' : type}
                                </button>
                            ))}
                        </div>

                        {/* Time Filter */}
                        <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-md flex-1 sm:flex-none">
                            {[
                                { label: '전체', value: 'ALL' },
                                { label: '오전', value: '1' },
                                { label: '오후', value: '2' }
                            ].map((t) => (
                                <button
                                    key={t.value}
                                    onClick={() => setFilterTime(t.value)}
                                    className={`flex-1 sm:px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filterTime === t.value
                                        ? 'bg-cyan-500 text-white shadow-lg'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Fish Search */}
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="어종 검색 (예: 벵에돔, 무늬오징어...)"
                        value={searchFish}
                        onChange={(e) => setSearchFish(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/20"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-white/30 pointer-events-none group-focus-within:text-cyan-500 transition-colors">🔍</div>
                    {searchFish && (
                        <button
                            onClick={() => setSearchFish('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {filteredPoints.length === 0 ? (
                    <div className="text-center py-12 text-white/40 bg-white/5 rounded-[2rem] border border-white/5 border-dashed">
                        <div className="text-4xl mb-4 opacity-20">🎣</div>
                        <p className="text-sm font-medium">해당 조건에 맞는 포인트 정보가 없습니다.</p>
                        <button
                            onClick={() => { setFilterType('ALL'); setFilterTime('ALL'); setSearchFish(''); }}
                            className="mt-4 text-xs text-blue-400 font-bold underline underline-offset-4"
                        >
                            필터 초기화
                        </button>
                    </div>
                ) : (
                    filteredPoints.map((point, idx) => {
                        const conditionColor = getFishingConditionColor(point.index, point.score);
                        const isGood = point.index === '좋음' || point.index === '보통';
                        const timeStr = String(point.time || '').trim();

                        return (
                            <TiltCard key={`${point.name}-${idx}`} className="mb-0">
                                <div className="glass-card glass-border rounded-3xl p-5 relative overflow-hidden transition-all hover:bg-white/10">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isGood ? 'bg-emerald-500' : 'bg-red-500'}`}></div>

                                    <div className="flex justify-between items-start mb-3 pl-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${point.type === '갯바위' ? 'bg-orange-500/20 text-orange-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                                    {point.type}
                                                </span>
                                                <h4 className="text-lg font-black text-white">{point.name}</h4>
                                            </div>
                                            <p className="text-xs text-white/60 mt-1">
                                                대상어: <span className="text-white font-bold">{point.targetFish || '전어종'}</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-lg font-black ${conditionColor}`}>{point.index}</div>
                                            <div className="text-[10px] text-white/40">지수 점수 {point.score}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 pl-3">
                                        <div className="bg-white/5 rounded-xl p-2 text-center">
                                            <div className="text-[10px] text-white/50">물때</div>
                                            <div className="font-bold text-xs text-white mt-1">{point.tide}</div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-2 text-center">
                                            <div className="text-[10px] text-white/50">파고(max)</div>
                                            <div className="font-bold text-xs text-blue-200 mt-1">{point.wave.max}m</div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-2 text-center">
                                            <div className="text-[10px] text-white/50">수온</div>
                                            <div className="font-bold text-xs text-cyan-200 mt-1">{point.temp.max}°</div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-2 text-center">
                                            <div className="text-[10px] text-white/50">풍속</div>
                                            <div className="font-bold text-xs text-white mt-1">{point.wind.max}m/s</div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pl-3 flex justify-between items-center border-t border-white/10 pt-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg">
                                                <span className="text-[11px] font-bold text-white/70">{formatDate(point.date)}</span>
                                                <span className="w-0.5 h-3 bg-white/10"></span>
                                                <span className={`text-[11px] font-black ${timeStr === '1' ? 'text-cyan-400' : 'text-orange-400'}`}>
                                                    {timeStr === '1' ? '오전' : '오후'}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-white/30 font-medium">기준 데이터</span>
                                        </div>
                                    </div>
                                </div>
                            </TiltCard>
                        );
                    })
                )}
            </div>

            {/* Safety Tip */}
            <div className="mt-6 bg-red-900/20 p-4 rounded-2xl border border-red-500/20 flex items-start gap-3">
                <div className="text-2xl">⛑️</div>
                <div>
                    <h5 className="font-bold text-red-200 text-sm">안전 출조 안내</h5>
                    <p className="text-xs text-red-200/70 mt-1">
                        너울성 파도가 예보된 경우 갯바위 진입을 금지하고, 반드시 구명조끼를 착용하세요.
                    </p>
                </div>
            </div>
        </div>
    );
}
