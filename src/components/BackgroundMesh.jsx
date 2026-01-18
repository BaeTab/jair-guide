import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BackgroundMesh = ({ themeId, mainStatus }) => {
    // Determine base colors based on theme and weather status
    const meshColors = useMemo(() => {
        // Default colors (Ocean/Clear)
        let colors = ['rgba(59, 130, 246, 0.5)', 'rgba(6, 182, 212, 0.4)', 'rgba(99, 102, 241, 0.3)'];

        const tid = String(themeId || '').trim();

        if (tid.includes('canola')) {
            colors = ['rgba(245, 158, 11, 0.4)', 'rgba(252, 211, 77, 0.3)', 'rgba(249, 115, 22, 0.2)'];
        } else if (tid.includes('camellia')) {
            colors = ['rgba(239, 68, 68, 0.4)', 'rgba(236, 72, 153, 0.3)', 'rgba(219, 39, 119, 0.2)'];
        } else if (tid.includes('stone')) {
            colors = ['rgba(75, 85, 99, 0.4)', 'rgba(31, 41, 55, 0.3)', 'rgba(107, 114, 128, 0.2)'];
        }

        return colors;
    }, [themeId, mainStatus]);

    return (
        <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
            <AnimatePresence mode="wait">
                <motion.div
                    key={themeId + (mainStatus?.type || '')}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                >
                    {/* Mesh Blob 1 */}
                    <motion.div
                        animate={{
                            x: [0, 50, -30, 0],
                            y: [0, -80, 40, 0],
                            scale: [1, 1.1, 0.9, 1],
                        }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute -top-[20%] -left-[20%] w-full h-full rounded-full blur-[120px]"
                        style={{ backgroundColor: meshColors[0] }}
                    />

                    {/* Mesh Blob 2 */}
                    <motion.div
                        animate={{
                            x: [0, -60, 40, 0],
                            y: [0, 50, -70, 0],
                            scale: [0.9, 1.2, 1, 0.9],
                        }}
                        transition={{
                            duration: 25,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute -bottom-[20%] -right-[20%] w-full h-full rounded-full blur-[120px]"
                        style={{ backgroundColor: meshColors[1] }}
                    />

                    {/* Mesh Blob 3 */}
                    <motion.div
                        animate={{
                            x: [0, 40, -40, 0],
                            y: [0, -30, 60, 0],
                            scale: [1.1, 0.8, 1.2, 1.1],
                        }}
                        transition={{
                            duration: 30,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute top-1/4 right-0 w-[80%] h-[80%] rounded-full blur-[100px]"
                        style={{ backgroundColor: meshColors[2] }}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Subtle Film Grain overlay */}
            <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

            {/* Vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 pointer-events-none"></div>
        </div>
    );
};

export default BackgroundMesh;
