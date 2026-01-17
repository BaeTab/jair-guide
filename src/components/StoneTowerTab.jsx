import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { INITIAL_LOCATIONS } from '../constants';

export default function StoneTowerTab({ currentTheme }) {
    const [wishes, setWishes] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState(INITIAL_LOCATIONS[0].id);
    const [newWish, setNewWish] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Get simple device ID from localStorage or generate one
    const [deviceId] = useState(() => {
        let id = localStorage.getItem('airguide_device_id');
        if (!id) {
            id = 'dev_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('airguide_device_id', id);
        }
        return id;
    });

    const [userRegion, setUserRegion] = useState(null);
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'stone_towers'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const wishesData = [];
            querySnapshot.forEach((doc) => {
                wishesData.push({ id: doc.id, ...doc.data() });
            });
            setWishes(wishesData);
        });

        // Determine User's Nearest Region on Mount
        detectUserRegion();

        return () => unsubscribe();
    }, []);

    const detectUserRegion = () => {
        if (!navigator.geolocation) return;

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                let minSub = Infinity;
                let nearest = null;

                INITIAL_LOCATIONS.forEach(loc => {
                    const dist = Math.sqrt(
                        Math.pow(loc.lat - latitude, 2) +
                        Math.pow(loc.lng - longitude, 2)
                    );
                    if (dist < minSub) {
                        minSub = dist;
                        nearest = loc.id;
                    }
                });

                setUserRegion(nearest);
                setIsLocating(false);
                // Also switch view to user's region initially if desired
                // setSelectedRegion(nearest); 
            },
            (err) => {
                console.warn("Geolocation error:", err);
                setIsLocating(false);
            },
            { timeout: 10000 }
        );
    };

    const handleSubmitWish = async (e) => {
        e.preventDefault();
        if (!newWish.trim() || isSubmitting) return;

        // Final check that they are in the correct region
        if (selectedRegion !== userRegion) {
            alert('현재 계신 지역의 돌탑에만 돌을 올릴 수 있수다. 📍');
            return;
        }

        // Simple spam check: limit 1 wish per hour per device (optional, but good for demo)
        const lastWishTime = localStorage.getItem('last_wish_time');
        const now = Date.now();
        if (lastWishTime && now - parseInt(lastWishTime) < 300000) { // 5 min for demo
            alert('조금 이따가 다시 돌을 올려주세요. 정성이 담긴 마음이면 충분합니다. 🙏');
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'stone_towers'), {
                text: newWish,
                regionId: selectedRegion,
                regionName: INITIAL_LOCATIONS.find(l => l.id === selectedRegion)?.name || '제주',
                warmthCount: 0,
                deviceId: deviceId,
                createdAt: serverTimestamp()
            });
            setNewWish('');
            setShowForm(false);
            localStorage.setItem('last_wish_time', now.toString());
        } catch (error) {
            console.error("Error adding wish: ", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddWarmth = async (wishId) => {
        const wishRef = doc(db, 'stone_towers', wishId);
        try {
            await updateDoc(wishRef, {
                warmthCount: increment(1)
            });
        } catch (error) {
            console.error("Error adding warmth: ", error);
        }
    };

    const regionWishes = wishes.filter(w => w.regionId === selectedRegion);
    const totalStones = wishes.length;

    return (
        <div className="flex-1 overflow-y-auto p-6 text-white pb-32">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-2xl font-black mb-1">디지털 소원 돌탑</h2>
                    <p className="text-white/60 text-xs">정성을 다해 돌을 쌓고 소원을 빌어봅서</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Total Stones</span>
                    <div className="text-2xl font-black text-amber-400">{totalStones}</div>
                </div>
            </div>

            {/* Region Selector */}
            <div className="flex gap-2 overflow-x-auto py-4 no-scrollbar">
                {INITIAL_LOCATIONS.map(loc => (
                    <button
                        key={loc.id}
                        onClick={() => setSelectedRegion(loc.id)}
                        className={`flex-none px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${selectedRegion === loc.id
                            ? 'bg-amber-500 border-amber-400 text-white shadow-lg scale-105'
                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                            }`}
                    >
                        {loc.name.split(' ')[0]}
                    </button>
                ))}
            </div>

            {/* Visual Stone Tower */}
            <div className="relative h-64 w-full flex flex-col items-center justify-end mb-8 bg-black/20 rounded-[2.5rem] p-8 border border-white/5 overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] pointer-events-none"></div>

                {/* Background Glow */}
                <div className="absolute bottom-0 w-32 h-32 bg-amber-500/20 blur-[60px] rounded-full"></div>

                {/* Stones stack visually */}
                <div className="relative flex flex-col-reverse items-center">
                    {/* Base stone */}
                    <motion.div
                        className="w-32 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full border border-white/10 shadow-xl z-0"
                    />

                    {/* Animated stones based on count (capped visually) */}
                    {Array.from({ length: Math.min(regionWishes.length, 8) }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ type: 'spring', delay: i * 0.1 }}
                            className="h-8 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full border border-white/10 shadow-lg mb-[-15px]"
                            style={{
                                width: `${120 - (i + 1) * 10}px`,
                                zIndex: i + 1,
                                rotate: (i % 2 === 0 ? 2 : -2) * (i + 1)
                            }}
                        />
                    ))}

                    {/* Top small stone */}
                    {regionWishes.length > 0 && (
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="w-4 h-4 rounded-full bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)] mb-2"
                        />
                    )}
                </div>

                <div className="mt-4 text-center z-10">
                    <h3 className="text-sm font-black text-amber-500">{INITIAL_LOCATIONS.find(l => l.id === selectedRegion)?.name} 돌탑</h3>
                    <p className="text-[10px] text-white/40 font-bold">{regionWishes.length}개의 소원이 쌓여있습니다</p>
                </div>
            </div>

            {/* Location Status Badge */}
            <div className="flex justify-center mb-4">
                {isLocating ? (
                    <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-bold text-white/40 animate-pulse">
                        📍 현재 위치 파악 중...
                    </div>
                ) : userRegion ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full text-[10px] font-bold text-emerald-400">
                        📍 지금 {INITIAL_LOCATIONS.find(l => l.id === userRegion)?.name.split(' ')[0]} 근처에 계시네요!
                    </div>
                ) : (
                    <div className="bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-full text-[10px] font-bold text-red-400">
                        📍 위치 권한을 허용하면 돌을 올릴 수 있수다.
                    </div>
                )}
            </div>

            {/* Post Wish Button Area */}
            {selectedRegion === userRegion ? (
                <>
                    {!showForm ? (
                        <button
                            onClick={() => setShowForm(true)}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-4 flex items-center justify-center gap-3 active:scale-95 transition-all font-black text-sm mb-6 shadow-[0_10px_20px_rgba(245,158,11,0.3)] border border-amber-400/50"
                        >
                            <span className="text-xl">🪨</span>
                            이곳에 내 돌 올리기
                        </button>
                    ) : (
                        <motion.form
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card glass-border rounded-3xl p-6 mb-6 shadow-2xl border-amber-500/30"
                            onSubmit={handleSubmitWish}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-black text-sm text-amber-500">소원 적기</h4>
                                <button type="button" onClick={() => setShowForm(false)} className="text-white/30 hover:text-white">✕</button>
                            </div>
                            <textarea
                                value={newWish}
                                onChange={(e) => setNewWish(e.target.value)}
                                placeholder="정성을 담아 한 줄 소원을 빌어보세요..."
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:bg-white/10 transition-all no-scrollbar"
                                maxLength={100}
                            />
                            <div className="flex justify-between items-center mt-4">
                                <span className="text-[10px] text-white/30 font-bold">{newWish.length}/100</span>
                                <button
                                    type="submit"
                                    disabled={!newWish.trim() || isSubmitting}
                                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-8 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg"
                                >
                                    {isSubmitting ? '쌓는 중...' : '돌 올리기'}
                                </button>
                            </div>
                        </motion.form>
                    )}
                </>
            ) : (
                <div className="glass-card glass-border rounded-2xl p-6 mb-8 text-center bg-white/5 opacity-80">
                    <div className="text-3xl mb-2 opacity-30">📍</div>
                    <p className="text-xs font-bold text-white/40 mb-1">여기는 다른 지역 돌탑입니다</p>
                    <p className="text-[10px] text-white/30 leading-relaxed font-medium">
                        돌을 쌓으려면 실제 돌탑이 있는 지역 근처로<br />
                        이동해야 하우다. 지금은 구경만 가능함서!
                    </p>
                    {userRegion && (
                        <button
                            onClick={() => setSelectedRegion(userRegion)}
                            className="mt-4 text-amber-500 text-[10px] font-black underline underline-offset-4"
                        >
                            내 근처 돌탑으로 바로 가기 ➡️
                        </button>
                    )}
                </div>
            )}

            {/* Recent Wishes in this region */}
            <div className="space-y-3">
                <h4 className="text-sm font-black pl-2 border-l-2 border-amber-500 mb-4">최근 쌓인 소원</h4>
                {regionWishes.length === 0 ? (
                    <div className="p-10 text-center text-white/20 font-bold text-xs italic">
                        아무도 아직 돌을 올리지 않았수다.<br />첫 번째 돌을 올려보세요!
                    </div>
                ) : (
                    <AnimatePresence>
                        {regionWishes.map((wish, idx) => (
                            <motion.div
                                key={wish.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="glass-card glass-border rounded-[1.5rem] p-5 shadow-lg relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-4xl group-hover:scale-110 transition-transform">🗿</div>
                                <div className="flex gap-4 relative">
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-white/90 leading-relaxed mb-3">"{wish.text}"</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] text-white/30 font-bold">
                                                {wish.createdAt?.toDate ? new Date(wish.createdAt.toDate()).toLocaleDateString() : '방금 전'}
                                            </span>
                                            <button
                                                onClick={() => handleAddWarmth(wish.id)}
                                                className="flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full hover:bg-amber-400/20 transition-all active:scale-90"
                                            >
                                                🔥 온기 {wish.warmthCount || 0}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
