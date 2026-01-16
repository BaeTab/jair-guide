import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function WindParticles({ windSpd = 5, windDir = 45 }) {
    const [lines, setLines] = useState([]);

    useEffect(() => {
        const newLines = Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            length: 40 + Math.random() * 60,
            opacity: 0.1 + Math.random() * 0.3,
            delay: Math.random() * 5,
            duration: Math.max(1, 10 / (windSpd || 1)) // Faster wind = shorter duration
        }));
        setLines(newLines);
    }, [windSpd]);

    return (
        <div className="absolute inset-0 pointer-events-none z-[1000] overflow-hidden">
            {lines.map(line => (
                <motion.div
                    key={line.id}
                    className="absolute bg-white/30"
                    style={{
                        left: line.left,
                        top: line.top,
                        width: '1.5px',
                        height: `${line.length}px`,
                        opacity: line.opacity,
                        rotate: windDir,
                        transformOrigin: 'top center',
                    }}
                    animate={{
                        y: [0, 200],
                        opacity: [0, line.opacity, 0]
                    }}
                    transition={{
                        duration: line.duration,
                        repeat: Infinity,
                        delay: line.delay,
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    );
}
