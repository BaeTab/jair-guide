import React from 'react';
import { motion } from 'framer-motion';
import TiltCard from './TiltCard';
import DataCard from './DataCard';
import SupportButton from './SupportButton';
import { getHealthTips, getStyleRecommendation } from '../utils';
import { JEJU_DIALECTS } from '../constants';

export default function HomeTab({
    setShowShareModal,
    selectedLoc,
    handleMyLocation,
    lastUpdated,
    fetchAllData,
    loading,
    mainStatus,
    currentData,
    seaTripData,
    airportWeather
}) {
    return (
        <div className="flex-1 overflow-y-auto pt-6 px-4 pb-10 text-white z-10 scroll-smooth">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 opacity-90">
                    <span className="text-2xl">🍃</span>
                    <span className="text-lg font-bold tracking-tight">제주바람</span>
                </div>
                <div className="flex items-center gap-2">
                    <SupportButton />
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="p-2.5 rounded-2xl glass-premium glass-border text-white active:scale-95 flex items-center gap-2 transition-all shadow-xl"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 drop-shadow-sm">
                            <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
                            <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.742 2.742 0 0 1 2.332-1.39ZM9 12.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0Z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[11px] font-black tracking-tight">카드 생성</span>
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-2 text-white">
                        <h2 className="text-3xl font-bold drop-shadow-md">{selectedLoc.name}</h2>
                        <button
                            onClick={handleMyLocation}
                            className="p-2 rounded-full glass-premium glass-border transition-all text-white active:scale-95 shadow-lg"
                            title="내 위치 찾기"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-white/80 text-sm mt-1">{lastUpdated ? `업데이트 ${lastUpdated}` : '로딩중...'}</p>
                </div>
                <button
                    onClick={() => fetchAllData()}
                    disabled={loading}
                    className="p-3.5 rounded-full glass-premium glass-border text-white shadow-2xl active:rotate-180 transition-all duration-500"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                </button>
            </div>

            {/* Status Section */}
            <div className="mt-2 mb-8 flex flex-col items-center relative">
                <motion.div
                    className="w-32 h-32 mb-4 text-white filter drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                    key={mainStatus.text}
                    initial={{ scale: 0 }} animate={{ scale: [1, 1.05, 1] }}
                    transition={{ scale: { repeat: Infinity, duration: 4, ease: "easeInOut" } }}
                >
                    {mainStatus.icon}
                </motion.div>
                <h1 className="text-5xl font-bold mb-1 tracking-tight drop-shadow-lg text-center">{mainStatus.text}</h1>
                <p className="text-xl text-white/90 font-medium text-center opacity-90 mb-6">{mainStatus.sub}</p>
                <div className="flex gap-3 justify-center flex-wrap">
                    {getHealthTips(mainStatus.type).map((tip, idx) => (
                        <div key={idx} className="glass-card glass-border px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg text-white">
                            <span className="text-xl drop-shadow-sm">{tip.icon}</span>
                            <span className="tracking-tight">{tip.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Realtime Weather Bar */}
            {currentData && (
                <div className="mb-8 grid grid-cols-3 gap-3 px-2">
                    <div className="glass-card glass-border rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-lg">
                        <span className="text-2xl mb-1 drop-shadow-sm">🌡️</span>
                        <span className="text-[10px] text-white/50 font-bold mb-0.5">기온</span>
                        <span className="text-lg font-black text-white tracking-tight">{currentData.temp}°</span>
                        <span className="text-[9px] text-white/30">체감 {currentData.feelTemp}°</span>
                    </div>
                    <div className="glass-card glass-border rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-lg">
                        <span className="text-2xl mb-1 drop-shadow-sm">💧</span>
                        <span className="text-[10px] text-white/50 font-bold mb-0.5">습도</span>
                        <span className="text-lg font-black text-blue-200 tracking-tight">{currentData.humidity}%</span>
                        <span className="text-[9px] text-white/30">{currentData.rainAmt > 0 ? `${currentData.rainAmt}mm` : '강수없음'}</span>
                    </div>
                    <div className="glass-card glass-border rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-lg">
                        <span className="text-2xl mb-1 drop-shadow-sm">😷</span>
                        <span className="text-[10px] text-white/50 font-bold mb-0.5">미세먼지</span>
                        <span className={`text-lg font-black tracking-tight ${currentData.pm10 <= 30 ? 'text-emerald-300' :
                            currentData.pm10 <= 80 ? 'text-yellow-300' :
                                currentData.pm10 <= 150 ? 'text-orange-300' : 'text-red-300'
                            }`}>
                            {currentData.pm10 <= 30 ? '좋음' :
                                currentData.pm10 <= 80 ? '보통' :
                                    currentData.pm10 <= 150 ? '나쁨' : '최악'}
                        </span>
                        <span className="text-[9px] text-white/30">{currentData.pm10}㎍/㎥</span>
                    </div>
                </div>
            )}

            {/* OOTD & Hair Style Card (New Feature) */}
            {currentData && (
                <div className="mb-6">
                    <TiltCard className="mb-0">
                        <div className="glass-card glass-border rounded-[2rem] p-5 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">👕</div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xl">🧥</span>
                                <span className="text-xs font-black text-white/50 uppercase tracking-widest">오늘 뭐 입을쿠광?</span>
                            </div>

                            {(() => {
                                const style = getStyleRecommendation(
                                    currentData.temp,
                                    currentData.windSpeed,
                                    currentData.humidity
                                );
                                return (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-start gap-3 bg-white/5 rounded-2xl p-3 border border-white/5">
                                            <div className="text-3xl pt-1 drop-shadow-md">{style.hair.icon}</div>
                                            <div>
                                                <div className={`text-sm font-black mb-0.5 ${style.hair.color}`}>
                                                    헤어: {style.hair.status}
                                                </div>
                                                <div className="text-white/80 text-xs leading-relaxed">
                                                    {style.hair.text}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 text-white/90">
                                            <div className="flex-1 bg-white/5 rounded-xl p-3 text-center border border-white/5">
                                                <div className="text-[10px] text-white/40 mb-1 font-bold">상의</div>
                                                <div className="text-xs font-bold">{style.outfit.top}</div>
                                            </div>
                                            <div className="flex-1 bg-white/5 rounded-xl p-3 text-center border border-white/5">
                                                <div className="text-[10px] text-white/40 mb-1 font-bold">하의</div>
                                                <div className="text-xs font-bold">{style.outfit.bottom}</div>
                                            </div>
                                        </div>

                                        {style.outfit.acc.length > 0 && (
                                            <div className="flex gap-2 flex-wrap">
                                                {style.outfit.acc.map((acc, i) => (
                                                    <span key={i} className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-[10px] font-bold text-emerald-200">
                                                        + {acc}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </TiltCard>
                </div>
            )}

            {/* Lifestyle Index Grid (New Feature) */}
            <div className="mb-8">
                <h3 className="text-xs font-black text-white/50 mb-4 px-1 uppercase tracking-widest">오늘의 생활 지수</h3>
                <div className="grid grid-cols-2 gap-3">
                    {currentData?.lifestyle && [
                        currentData.lifestyle.laundry,
                        currentData.lifestyle.carwash,
                        currentData.lifestyle.ventilation,
                        currentData.lifestyle.star
                    ].map((item, idx) => (
                        <TiltCard key={idx}>
                            <div className="glass-card glass-border rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 p-3 opacity-20 text-4xl group-hover:scale-125 transition-transform duration-500`}>
                                    {item.icon}
                                </div>
                                <div className="relative z-10">
                                    <span className="text-[10px] font-bold text-white/60 mb-1 block">{['빨래 지수', '세차 지수', '환기 타임', '별 관측'][idx]}</span>
                                    <div className={`text-lg font-black ${item.color} mb-1 drop-shadow-sm`}>{item.label}</div>
                                    <div className="text-[11px] text-white/80 font-medium leading-tight">{item.desc}</div>
                                </div>
                            </div>
                        </TiltCard>
                    ))}
                </div>
            </div>

            {/* Data Summary Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <TiltCard>
                    <DataCard
                        label="테마 추천"
                        value={currentData?.activity?.title}
                        subValue={currentData?.activity?.desc}
                        unit=""
                        loading={loading}
                    />
                </TiltCard>
                <TiltCard>
                    <DataCard
                        label="한라산 가시성"
                        value={currentData?.hallaIndex?.score}
                        subValue={currentData?.hallaIndex?.text}
                        unit="%"
                        loading={loading}
                    />
                </TiltCard>
            </div>

            {/* Jeju Travel Index Section - Enhanced with Sea Trip Data */}
            {currentData?.travelIndex && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3 px-1 opacity-80">
                        <span className="text-lg">🚦</span>
                        <span className="text-xs font-bold uppercase tracking-widest">제주 여행/안전 지수</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {/* 항공 - 공항 기상정보 연동 */}
                        <TiltCard className="h-full mb-0">
                            <div className="glass-card glass-border rounded-2xl p-3 flex flex-col items-center justify-center text-center h-full min-h-[100px]">
                                <span className="text-2xl mb-1">{currentData.travelIndex.flight.icon}</span>
                                <span className="text-[10px] opacity-60 font-bold mb-1">항공 (바람)</span>
                                <span className={`text-xs font-black ${currentData.travelIndex.flight.color}`}>{currentData.travelIndex.flight.status}</span>
                                {airportWeather?.data?.warn && airportWeather.data.warn !== '없음' && airportWeather.data.warn !== '특보 없음' && (
                                    <span className="text-[8px] text-orange-300 mt-1">⚠️ 주의보</span>
                                )}
                            </div>
                        </TiltCard>

                        {/* 선박 - 바다여행지수 연동 */}
                        <TiltCard className="h-full mb-0">
                            <div className="glass-card glass-border rounded-2xl p-3 flex flex-col items-center justify-center text-center h-full min-h-[100px]">
                                <span className="text-2xl mb-1">
                                    {seaTripData?.summary?.overallIndex === '좋음' ? '⛵' :
                                        seaTripData?.summary?.overallIndex === '보통' ? '🚢' :
                                            seaTripData?.summary?.overallIndex === '나쁨' ? '⚓' : '🌊'}
                                </span>
                                <span className="text-[10px] opacity-60 font-bold mb-1">선박 (바다여행)</span>
                                <span className={`text-xs font-black ${seaTripData?.summary?.overallIndex === '좋음' ? 'text-emerald-300' :
                                    seaTripData?.summary?.overallIndex === '보통' ? 'text-yellow-300' :
                                        seaTripData?.summary?.overallIndex === '나쁨' ? 'text-orange-300' :
                                            seaTripData?.summary?.overallIndex === '매우나쁨' ? 'text-red-300' :
                                                currentData.travelIndex.ship.color
                                    }`}>
                                    {seaTripData?.summary?.overallIndex || currentData.travelIndex.ship.status}
                                </span>
                                {seaTripData?.summary?.avgWaveHeight > 0 && (
                                    <span className="text-[8px] text-white/50 mt-1">파고 {seaTripData.summary.avgWaveHeight}m</span>
                                )}
                            </div>
                        </TiltCard>

                        {/* 운전 */}
                        <TiltCard className="h-full mb-0">
                            <div className="glass-card glass-border rounded-2xl p-3 flex flex-col items-center justify-center text-center h-full min-h-[100px]">
                                <span className="text-2xl mb-1">{currentData.travelIndex.drive.icon}</span>
                                <span className="text-[10px] opacity-60 font-bold mb-1">운전 (시야)</span>
                                <span className={`text-xs font-black ${currentData.travelIndex.drive.color}`}>{currentData.travelIndex.drive.status}</span>
                            </div>
                        </TiltCard>
                    </div>

                    {/* 바다여행지수 상세 정보 */}
                    {seaTripData?.regions?.length > 0 && (
                        <div className="mt-3 glass-card glass-border rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-lg">🏝️</span>
                                <span className="text-xs font-bold">제주 바다여행지수</span>
                                <span className={`ml-auto text-xs font-black px-2 py-1 rounded-full ${seaTripData.summary.overallIndex === '좋음' ? 'bg-emerald-500/30 text-emerald-200' :
                                    seaTripData.summary.overallIndex === '보통' ? 'bg-yellow-500/30 text-yellow-200' :
                                        seaTripData.summary.overallIndex === '나쁨' ? 'bg-orange-500/30 text-orange-200' :
                                            'bg-red-500/30 text-red-200'
                                    }`}>
                                    {seaTripData.summary.overallIndex} ({seaTripData.summary.avgScore}점)
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {seaTripData.regions.slice(0, 4).map((region, idx) => (
                                    <div key={idx} className="bg-white/5 rounded-xl p-2 text-center">
                                        <div className="text-[10px] text-white/50">{region.name}</div>
                                        {region.forecast[0] && (
                                            <>
                                                <div className="text-sm font-bold">{region.forecast[0].index}</div>
                                                <div className="text-[9px] text-white/40">
                                                    파고 {region.forecast[0].waveHeight}m · {region.forecast[0].weather}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-2 text-center">
                        <p className="text-[10px] opacity-50">
                            * {currentData.travelIndex.flight.desc}
                        </p>
                    </div>
                </div>
            )}

            {/* Jeju Airport Weather Card */}
            {airportWeather?.data && (
                <div className="mb-6">
                    <TiltCard>
                        <div className="glass-card glass-border rounded-[2rem] p-5 shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-400/20 to-transparent pointer-events-none"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">✈️</span>
                                        <div>
                                            <h4 className="font-black text-lg">{airportWeather.name}</h4>
                                            <p className="text-[10px] text-white/50 font-medium">공항 기상정보 ({airportWeather.baseTime === '0600' ? '오전' : '오후'} 발표)</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black">
                                            {airportWeather.data.ta ? `${airportWeather.data.ta}°` : '-'}
                                        </div>
                                        <p className="text-[10px] text-white/60">현재 기온</p>
                                    </div>
                                </div>

                                <div className="text-sm text-white/90 leading-relaxed mb-4 line-clamp-3">
                                    {airportWeather.data.summary}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {airportWeather.data.rainAmt && (
                                        <div className="bg-white/10 rounded-xl p-3">
                                            <div className="text-[10px] text-white/50 mb-1">예상 강수량</div>
                                            <div className="font-bold text-sm">{airportWeather.data.rainAmt}</div>
                                        </div>
                                    )}
                                    {airportWeather.data.snowAmt && (
                                        <div className="bg-white/10 rounded-xl p-3">
                                            <div className="text-[10px] text-white/50 mb-1">예상 적설량</div>
                                            <div className="font-bold text-sm">{airportWeather.data.snowAmt}</div>
                                        </div>
                                    )}
                                </div>

                                {airportWeather.data.warn && airportWeather.data.warn !== '없음' && airportWeather.data.warn !== '특보 없음' && (
                                    <div className="mt-4 p-3 bg-orange-500/20 rounded-xl border border-orange-400/30">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg">⚠️</span>
                                            <span className="text-[11px] font-black text-orange-300">위험기상예보</span>
                                        </div>
                                        <p className="text-xs text-white/80 leading-relaxed">{airportWeather.data.warn}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TiltCard>
                </div>
            )}

            {/* Stone Tower Call-to-action */}
            <div className="mb-6">
                <TiltCard className="mb-0">
                    <button
                        onClick={() => {
                            // This is a bit tricky since HomeTab doesn't have setActiveTab, 
                            // but in App.jsx we can inject it or handle it via a global state if needed.
                            // However, App.jsx passes many props but not setActiveTab.
                            // I'll assume for now clicking this should trigger navigation.
                            // Actually, I should check if I should pass setActiveTab to HomeTab.
                            window.dispatchEvent(new CustomEvent('changeTab', { detail: 'stonetower' }));
                        }}
                        className="w-full glass-card glass-border rounded-[2.5rem] p-6 flex flex-col shadow-2xl overflow-hidden relative min-h-[140px] justify-center text-left"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-transparent pointer-events-none"></div>
                        <div className="flex flex-col gap-2 relative z-10">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">🪨</span>
                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">제주 디지털 소원 돌탑</span>
                            </div>
                            <div>
                                <p className="text-xl font-black tracking-tight text-white mb-1">
                                    마음을 담아 돌을 쌓아봅서
                                </p>
                                <p className="text-white/60 text-[11px] font-medium leading-relaxed">
                                    제주 곳곳에 쌓인 소원들을 보고,<br />당신의 소중한 마음도 하나 올려보세요. 🙏
                                </p>
                            </div>
                        </div>
                        <div className="absolute bottom-6 right-6 text-2xl opacity-40 group-hover:translate-x-1 transition-transform">➡️</div>
                    </button>
                </TiltCard>
            </div>

            {/* Dialect Card */}
            <TiltCard className="mb-0">
                <div className="glass-card glass-border rounded-[2.5rem] p-6 flex flex-col shadow-2xl overflow-hidden relative min-h-[140px] justify-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-transparent pointer-events-none"></div>
                    <div className="flex flex-col gap-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">🗿</span>
                            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">오늘의 제주말</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black tracking-tight text-white">
                                "{JEJU_DIALECTS[new Date().getDate() % JEJU_DIALECTS.length].word}"
                            </p>
                            <p className="text-white/60 text-sm font-medium mt-1">
                                어떵 하느냐? ➔ {JEJU_DIALECTS[new Date().getDate() % JEJU_DIALECTS.length].mean}
                            </p>
                        </div>
                    </div>
                </div>
            </TiltCard>
        </div>
    );
}
