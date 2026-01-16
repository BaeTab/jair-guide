import React from 'react';
import { motion } from 'framer-motion';

export default function RadarChart({ data }) {
    // data: { clean, comfort, visibility, safety, active } (all 0-100)
    const stats = data || { clean: 50, comfort: 50, visibility: 50, safety: 50, active: 50 };

    // Convert 5 scores to polygon points
    const points = [
        stats.clean,
        stats.comfort,
        stats.visibility,
        stats.safety,
        stats.active
    ];

    const center = 140; // Adjusted center for larger viewBox
    const radius = 80;
    const labels = ["청정", "쾌적", "가시성", "자외선", "활동성"];

    const getPoint = (value, index) => {
        const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
        const r = (value / 100) * radius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x},${y}`;
    };

    const polyPoints = points.map((p, i) => getPoint(p, i)).join(" ");
    const fullPolyPoints = points.map((_, i) => getPoint(100, i)).join(" ");

    return (
        <div className="w-full aspect-square relative flex items-center justify-center">
            <svg viewBox="0 0 280 280" className="w-full h-full drop-shadow-2xl">
                {/* Background Grid (Pentagons) */}
                {[20, 40, 60, 80, 100].map(s => (
                    <polygon
                        key={s}
                        points={points.map((_, i) => {
                            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                            const r = (s / 100) * radius;
                            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
                        }).join(" ")}
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="1"
                    />
                ))}

                {/* Axis Lines */}
                {points.map((_, i) => {
                    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                    const x = center + radius * Math.cos(angle);
                    const y = center + radius * Math.sin(angle);
                    return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
                })}

                {/* Data Polygon */}
                <motion.polygon
                    initial={{ points: fullPolyPoints, opacity: 0 }}
                    animate={{ points: polyPoints, opacity: 0.8 }}
                    transition={{ duration: 1.5, type: "spring" }}
                    fill="rgba(52, 211, 153, 0.4)" // Emerald-400 with opacity
                    stroke="#34D399"
                    strokeWidth="2"
                />

                {/* Labels */}
                {labels.map((label, i) => {
                    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                    const x = center + (radius + 30) * Math.cos(angle);
                    const y = center + (radius + 30) * Math.sin(angle);
                    return (
                        <text
                            key={i}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="rgba(255,255,255,0.9)"
                            fontSize="13"
                            fontWeight="bold"
                            style={{ textShadow: "0px 1px 3px rgba(0,0,0,0.5)" }}
                        >
                            {label}
                        </text>
                    );
                })}
            </svg>
            {/* Center Score */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-2xl font-black text-emerald-300 drop-shadow-lg opacity-90">
                    {Math.round(points.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0) / 5)}
                </div>
            </div>
        </div>
    );
}
