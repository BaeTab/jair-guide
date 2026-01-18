import React from 'react';
import TiltCard from './TiltCard';
import DataCard from './DataCard';
import RadarChart from './RadarChart';
import SupportButton from './SupportButton';
import { getWindDesc, getWeather, getPmStatus } from '../utils';
import { shareToKakao } from '../utils/share';

export default function InsightsTab({ currentData, loading }) {
    const pm10Info = currentData?.pm10 ? getPmStatus('pm10', currentData.pm10) : { text: '', color: '' };
    const pm25Info = currentData?.pm2_5 ? getPmStatus('pm25', currentData.pm2_5) : { text: '', color: '' };

    return (
        <div className="flex-1 overflow-y-auto p-4 pb-32 text-white">
            <div className="flex items-center justify-between mb-1">
                <h2 className="text-2xl font-black">상세 대기 리포트</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (!currentData) return;
                            shareToKakao({
                                title: `[제주바람] 상세 대기 리포트`,
                                description: `미세먼지 ${currentData.pm10}, 초미세 ${currentData.pm2_5}! 제주의 실시간 공기질을 확인하세요.`,
                                webUrl: 'https://jair-guide.web.app/?tab=insights'
                            });
                        }}
                        className="p-2 rounded-xl bg-[#FEE500] text-[#191919] active:scale-95 transition-all shadow-md"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.558 1.707 4.8 4.315 6.055-.188.702-.68 2.541-.777 2.928-.123.477.178.47.37.34.15-.102 2.386-1.622 3.347-2.27.575.087 1.15.132 1.745.132 4.97 0 9-3.184 9-7.115S16.97 3 12 3z" />
                        </svg>
                    </button>
                    <SupportButton />
                </div>
            </div>
            <p className="text-white/60 text-xs mb-8">실시간으로 분석된 제주의 공기 분석표입니다.</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <TiltCard>
                    <DataCard
                        label="미세먼지 (PM10)"
                        value={currentData?.pm10}
                        unit="µg/m³"
                        loading={loading}
                        statusText={pm10Info.text}
                        statusColor={pm10Info.color}
                    />
                </TiltCard>
                <TiltCard>
                    <DataCard
                        label="초미세먼지 (PM2.5)"
                        value={currentData?.pm2_5}
                        unit="µg/m³"
                        loading={loading}
                        statusText={pm25Info.text}
                        statusColor={pm25Info.color}
                    />
                </TiltCard>
                <TiltCard>
                    <DataCard label="풍속" value={currentData?.windSpeed} subValue={getWindDesc(currentData?.windSpeed)} unit="km/h" loading={loading} />
                </TiltCard>
                <TiltCard>
                    <DataCard label="습도" value={currentData?.humidity} unit="%" loading={loading} />
                </TiltCard>
            </div>

            {/* Jeju Life Balance Radar Chart */}
            <div className="glass-card glass-border rounded-[2.5rem] p-5 mb-8 shadow-2xl relative overflow-hidden text-center">
                <div className="mb-4">
                    <h4 className="text-xl font-black text-white mb-1">제주 라이프 밸런스</h4>
                    <p className="text-white/60 text-xs">5가지 요소로 분석한 오늘의 점수</p>
                </div>
                <div className="w-full max-w-[240px] mx-auto">
                    <RadarChart data={currentData?.radarStats} />
                </div>
                <div className="mt-4 bg-white/5 rounded-xl p-3 text-xs text-white/70 font-medium">
                    "현재 밸런스 점수는 <span className="text-emerald-300 font-bold">{currentData?.radarStats ? Math.round(Object.values(currentData.radarStats).reduce((a, b) => a + (isNaN(b) ? 0 : b), 0) / 5) : 0}점</span>입니다."
                </div>
            </div>

            {/* UV Index Placeholder */}
            {/* UV Index Section (Now Real Data) */}
            <div className="glass-card glass-border rounded-[2.5rem] p-5 mb-8 shadow-2xl">
                <h4 className="text-xs font-black text-white/40 mb-4 uppercase tracking-widest">자외선 지수 (UV)</h4>
                <div className="flex items-end gap-4">
                    <div className="text-4xl font-black">{currentData?.uvIndex !== undefined ? currentData.uvIndex : '-'}</div>
                    {currentData?.uvIndex !== undefined && (
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black border mb-1 ${currentData.uvIndex <= 2 ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/20' :
                            currentData.uvIndex <= 5 ? 'bg-yellow-500/30 text-yellow-300 border-yellow-500/20' :
                                currentData.uvIndex <= 7 ? 'bg-orange-500/30 text-orange-300 border-orange-500/20' :
                                    'bg-red-500/30 text-red-300 border-red-500/20'
                            }`}>
                            {currentData.uvIndex <= 2 ? '낮음' :
                                currentData.uvIndex <= 5 ? '보통' :
                                    currentData.uvIndex <= 7 ? '높음' : '매우 높음'}
                        </div>
                    )}
                </div>
                <div className="mt-6 w-full h-2 bg-white/10 rounded-full overflow-hidden relative">
                    <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-red-500 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, (currentData?.uvIndex || 0) * 10)}%` }}
                    ></div>
                </div>
                <p className="text-[10px] text-white/40 mt-4 leading-relaxed font-medium">
                    {currentData?.uvIndex <= 2 ? '자외선 걱정 없이 야외활동 즐깁서!' :
                        currentData?.uvIndex <= 5 ? '약한 선크림 정도면 충분하우다.' :
                            currentData?.uvIndex <= 7 ? '햇빛이 강하난 선글라스 챙깁서.' :
                                '망와! 자외선 강하난 그늘에만 있읍서.'}
                </p>
            </div>

            {/* Hourly Forecast Expanded */}
            <h3 className="text-xs font-black text-white/40 mb-4 uppercase tracking-widest">시간별 변화 추이</h3>
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                {currentData?.next6Hours?.map((hour, i) => (
                    <div key={i} className="flex-shrink-0 glass-card glass-border rounded-3xl p-5 flex flex-col items-center min-w-[100px] h-40 justify-between shadow-xl">
                        <span className="text-[11px] text-white/40 mb-3 font-black">{hour.time}</span>
                        <span className="text-4xl mb-4">{getWeather(hour.weatherCode).icon}</span>
                        <span className="text-xl font-black">{hour.temp}°</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
