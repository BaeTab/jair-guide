import React from 'react';
import { THEMES } from '../constants';
import { shareToKakao } from '../utils/share';

export default function SettingsTab({ currentThemeId, setCurrentThemeId, currentTheme, subscribeToAlerts }) {
    return (
        <div className="flex-1 overflow-y-auto p-4 text-white pb-32">
            <h2 className="text-2xl font-black mb-1">더보기</h2>
            <p className="text-white/60 text-xs mb-8">앱 설정 및 제주바람 정보</p>

            {/* Theme Switcher */}
            <div className="glass-card glass-border rounded-3xl p-5 mb-6 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">🎨</span>
                    <div>
                        <h4 className="font-black text-sm">제주 팔레트</h4>
                        <p className="text-[10px] text-white/40 font-bold">원하는 제주의 색을 입혀봅서</p>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {Object.values(THEMES).map(theme => (
                        <button
                            key={theme.id}
                            onClick={() => setCurrentThemeId(theme.id)}
                            className={`flex flex-col items-center gap-2 p-2 rounded-2xl transition-all duration-300 ${currentThemeId === theme.id ? 'bg-white/20 scale-105 ring-2 ring-white/50' : 'hover:bg-white/10'}`}
                        >
                            <div className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-xl bg-gradient-to-br ${theme.colors.bg}`}>
                                {theme.icon}
                            </div>
                            <span className={`text-[10px] font-bold ${currentThemeId === theme.id ? 'text-white' : 'text-white/50'}`}>{theme.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Weather Alert Subscription (New) */}
            <div className="glass-card glass-border rounded-[2rem] p-5 mb-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">⚠️</div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 glass-premium rounded-2xl flex items-center justify-center text-2xl shadow-inner">🔔</div>
                        <div>
                            <h4 className="font-black text-sm">기상 특보 푸시 알림</h4>
                            <p className="text-[10px] text-white/40 font-bold">제주 특보 발령 시 즉시 알려드려요</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={subscribeToAlerts}
                    className="w-full mt-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl py-3 text-xs font-black transition-all active:scale-95"
                >
                    알림 구독하기
                </button>
            </div>

            {/* App Recommendation (New) */}
            <div className="glass-card glass-border rounded-[2rem] p-5 mb-6 shadow-xl relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#FEE500] rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-yellow-500/20">💬</div>
                        <div>
                            <h4 className="font-black text-sm">제주바람 추천하기</h4>
                            <p className="text-[10px] text-white/40 font-bold">친구에게 실시간 제주 정보를 알려주세요!</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            shareToKakao({
                                title: '제주가이드 - 날씨, 낚시, 생활 정보',
                                description: '제주 살이와 여행에 필요한 모든 정보를 실시간으로 확인하세요! 🍃',
                                webUrl: 'https://jair-guide.web.app/?tab=home'
                            });
                        }}
                        className="px-4 py-2 bg-[#FEE500] text-[#191919] rounded-xl text-[10px] font-black hover:scale-105 active:scale-95 transition-all"
                    >
                        카톡 공유
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <a
                    href="mailto:b_h_woo@naver.com"
                    className="glass-card glass-border rounded-3xl p-5 flex items-center justify-between shadow-xl hover:bg-white/10 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 glass-premium rounded-2xl flex items-center justify-center text-2xl shadow-inner">👤</div>
                        <div>
                            <h4 className="font-black text-sm">개발자 정보</h4>
                            <p className="text-[10px] text-white/40 font-medium">Bae Hyun-woo</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/30">b_h_woo@naver.com</span>
                        <div className={`text-xs font-black ${currentTheme.colors.accent} group-hover:translate-x-1 transition-transform`}>✉️</div>
                    </div>
                </a>

                <div className="glass-card glass-border rounded-3xl p-5 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 glass-premium rounded-2xl flex items-center justify-center text-2xl shadow-inner">📦</div>
                        <div>
                            <h4 className="font-black text-sm">앱 버전</h4>
                            <p className="text-[10px] text-white/40 font-medium">v1.4.0 (CCTV & HLS Proxy)</p>
                        </div>
                    </div>
                    <div className="text-xs text-emerald-400 font-black tracking-widest">✓ LATEST</div>
                </div>

                <div className="glass-card glass-border rounded-3xl p-5 shadow-xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 glass-premium rounded-2xl flex items-center justify-center text-2xl shadow-inner">🛰️</div>
                        <div>
                            <h4 className="font-black text-sm">데이터 출처</h4>
                            <p className="text-[10px] text-white/40 font-medium">공공 API 및 오픈소스 활용</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[9px] text-white/50">
                        <div className="bg-white/5 rounded-lg p-2">☁️ 기상청 (KMA)</div>
                        <div className="bg-white/5 rounded-lg p-2">💨 에어코리아</div>
                        <div className="bg-white/5 rounded-lg p-2">🌊 국립해양조사원</div>
                        <div className="bg-white/5 rounded-lg p-2">✈️ OpenSky Network</div>
                        <div className="bg-white/5 rounded-lg p-2">📹 제주 재난안전본부</div>
                        <div className="bg-white/5 rounded-lg p-2">🗺️ OpenStreetMap</div>
                    </div>
                </div>

                {/* Buy Me a Coffee */}
                <a
                    href="https://buymeacoffee.com/bhwoo484"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block glass-card glass-border rounded-3xl p-5 shadow-xl hover:bg-white/10 transition-all duration-300 group"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
                                ☕
                            </div>
                            <div>
                                <h4 className="font-black text-sm">제주바람 응원하기</h4>
                                <p className="text-[10px] text-white/40 font-medium">커피 한 잔으로 개발자를 응원해주세요 ❤️</p>
                            </div>
                        </div>
                        <div className="text-yellow-400 group-hover:translate-x-1 transition-transform">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </a>

                <div className="pt-8 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 glass-premium glass-border rounded-2xl flex items-center justify-center text-3xl shadow-2xl opacity-50">🍃</div>
                    <div className="text-[10px] text-white/20 font-black tracking-[0.2em] uppercase">
                        Jeju Air Guide Service
                    </div>
                    <div className="text-[10px] text-white/10 font-medium">
                        &copy; 2025 제주바람. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
}
