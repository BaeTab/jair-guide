import React from 'react';
import { THEMES } from '../constants';

export default function SettingsTab({ currentThemeId, setCurrentThemeId, currentTheme }) {
    return (
        <div className="p-6 text-white pb-32">
            <h2 className="text-2xl font-black mb-1">더보기</h2>
            <p className="text-white/60 text-xs mb-8">앱 설정 및 제주바람 정보</p>

            {/* Theme Switcher */}
            <div className="glass-card glass-border rounded-3xl p-6 mb-6 shadow-xl">
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

            <div className="space-y-4">
                <div className="glass-card glass-border rounded-3xl p-6 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 glass-premium rounded-2xl flex items-center justify-center text-2xl shadow-inner">👤</div>
                        <div>
                            <h4 className="font-black text-sm">개발자 정보</h4>
                            <p className="text-[10px] text-white/40 font-medium">Bae Hyun-woo</p>
                        </div>
                    </div>
                    <div className={`text-xs font-black ${currentTheme.colors.accent}`}>Contact</div>
                </div>

                <div className="glass-card glass-border rounded-3xl p-6 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 glass-premium rounded-2xl flex items-center justify-center text-2xl shadow-inner">📦</div>
                        <div>
                            <h4 className="font-black text-sm">업데이트 확인</h4>
                            <p className="text-[10px] text-white/40 font-medium">v1.3.0 (Theme Edition)</p>
                        </div>
                    </div>
                    <div className="text-xs text-white/20 font-black tracking-widest">LATEST</div>
                </div>

                <div className="glass-card glass-border rounded-3xl p-6 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 glass-premium rounded-2xl flex items-center justify-center text-2xl shadow-inner">🛰️</div>
                        <div>
                            <h4 className="font-black text-sm">데이터 출처</h4>
                            <p className="text-[10px] text-white/40 font-medium whitespace-pre-wrap">Open-Meteo & OpenStreetMap</p>
                        </div>
                    </div>
                </div>

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
