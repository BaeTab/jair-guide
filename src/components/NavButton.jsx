import React from 'react';
import { motion } from 'framer-motion';

export default function NavButton({ active, onClick, icon, label, themeColor }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col items-center py-3 px-2 rounded-3xl transition-all duration-500 relative ${active ? 'bg-white/10' : ''}`}
        >
            {active && (
                <motion.div
                    layoutId="nav-glow"
                    className={`absolute inset-0 rounded-3xl blur-md ${themeColor ? themeColor.replace('bg-', 'bg-opacity-20 bg-') : 'bg-white/5'}`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
            )}
            <div className={`text-2xl mb-1 transition-transform duration-300 ${active ? 'scale-110 -translate-y-1' : ''}`} style={{ color: active ? 'white' : 'rgba(255,255,255,0.6)' }}>
                {icon}
                {/* 'NEW' Badge for Marketing */}
                {!active && label === '낚시' && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white/20 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse"></div>
                )}
            </div>
            <span className={`text-[10px] font-medium transition-opacity duration-300 ${active ? 'opacity-100 font-bold' : 'opacity-50'}`}>
                {label}
            </span>
        </button>
    );
}
