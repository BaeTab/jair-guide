import React from 'react';
import { motion } from 'framer-motion';

export default function DataCard({ label, value, subValue, unit, loading, statusText, statusColor }) {
    return (
        <div className="glass-card glass-border rounded-3xl p-5 flex flex-col items-center justify-center shadow-2xl transition-all hover:bg-white/20 h-full min-h-[130px] w-full">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">{label}</span>
            {loading || value === undefined ? (
                <div className="h-8 w-12 bg-white/20 animate-pulse rounded my-1"></div>
            ) : (
                <motion.div
                    className="flex flex-col items-center"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={value}
                >
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold drop-shadow-md">{value}</span>
                        <span className="text-[10px] text-white/50">{unit}</span>
                    </div>
                    {statusText && (
                        <div className={`text-xs font-black px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm mb-1 ${statusColor}`}>
                            {statusText}
                        </div>
                    )}
                    {subValue && !statusText && <span className="text-xs text-white/90 font-medium -mt-1">{subValue}</span>}
                </motion.div>
            )}
        </div>
    );
}
