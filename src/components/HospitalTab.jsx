import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function HospitalTab() {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [regionFilter, setRegionFilter] = useState('all'); // all, jeju, seogwipo

    useEffect(() => {
        fetchAllHospitals();
    }, []);

    const fetchAllHospitals = async () => {
        try {
            setLoading(true);

            // Fetch Total Count first
            const initialRes = await axios.get('/api/hospital', {
                params: { number: 1, limit: 1 }
            });

            if (initialRes.data && initialRes.data.totCnt) {
                const totalCount = initialRes.data.totCnt;
                const limit = 100;
                const totalPages = Math.ceil(totalCount / limit);

                const promises = [];
                for (let i = 1; i <= totalPages; i++) {
                    promises.push(
                        axios.get('/api/hospital', {
                            params: { number: i, limit: limit }
                        })
                    );
                }

                const responses = await Promise.all(promises);
                const allData = responses.flatMap(res => res.data.data || []);

                // Remove duplicates and keep only relevant hospitals
                const uniqueData = Array.from(new Set(allData.map(a => a.companyName)))
                    .map(name => allData.find(a => a.companyName === name));

                setHospitals(uniqueData);
            }
        } catch (error) {
            console.error("Failed to fetch hospital data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredHospitals = hospitals.filter(p => {
        // Only show '영업/정상'
        if (p.openStatus !== '영업/정상') return false;

        const address = p.addressDoro || p.addressJibun || '';
        const matchesRegion = regionFilter === 'all' ||
            (regionFilter === 'jeju' && address.includes('제주시')) ||
            (regionFilter === 'seogwipo' && address.includes('서귀포시'));

        const matchesSearch =
            (p.companyName && p.companyName.includes(searchTerm)) ||
            (p.medicalSubject && p.medicalSubject.includes(searchTerm)) ||
            address.includes(searchTerm);

        return matchesRegion && matchesSearch;
    });

    return (
        <div className="w-full h-full relative flex flex-col bg-gray-900 overflow-hidden">
            {/* Header */}
            <div className="p-6 pb-2 safe-area-top z-10 w-full max-w-md mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-black text-white leading-none">제주 병원 찾기</h1>
                        <p className="text-white/40 text-[10px] font-bold mt-1">
                            🏥 진료 중인 병원 정보 확인 (영업 중인 곳만 표시)
                        </p>
                    </div>
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-xl border border-white/10">
                        🏥
                    </div>
                </div>

                {/* Region Filter Tabs */}
                <div className="flex gap-2 mb-3">
                    <button
                        onClick={() => setRegionFilter('all')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${regionFilter === 'all' ? 'bg-white text-black border-white' : 'bg-transparent text-white/50 border-white/10'}`}
                    >
                        전체 지역
                    </button>
                    <button
                        onClick={() => setRegionFilter('jeju')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${regionFilter === 'jeju' ? 'bg-blue-500 text-white border-blue-500' : 'bg-transparent text-white/50 border-white/10'}`}
                    >
                        제주시
                    </button>
                    <button
                        onClick={() => setRegionFilter('seogwipo')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${regionFilter === 'seogwipo' ? 'bg-orange-500 text-white border-orange-500' : 'bg-transparent text-white/50 border-white/10'}`}
                    >
                        서귀포시
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-2">
                    <input
                        type="text"
                        placeholder="병원명, 진료과(내과,치과 등) 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-white text-sm placeholder-white/30 focus:outline-none focus:bg-white/20 transition-all font-bold"
                    />
                    <span className="absolute left-3.5 top-3.5 text-white/30">🔍</span>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-3 text-white/30 hover:text-white"
                        >✕</button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 pb-24 safe-area-bottom w-full max-w-md mx-auto scrollbar-hide">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3">
                        <div className="animate-spin text-3xl">🏥</div>
                        <p className="text-white/30 text-xs font-bold animate-pulse">병원 정보 불러오는 중...</p>
                    </div>
                ) : filteredHospitals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-2 text-white/30">
                        <span className="text-3xl">📭</span>
                        <p className="text-xs font-bold">검색 결과가 없습니다</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        <AnimatePresence>
                            {filteredHospitals.map((hospital, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2, delay: idx * 0.03 > 0.5 ? 0.5 : idx * 0.03 }}
                                    className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-white font-bold text-lg">{hospital.companyName}</h3>
                                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                            {hospital.openStatus}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-white/60 text-xs font-medium">
                                            <span>📍</span>
                                            <span>{hospital.addressDoro || hospital.addressJibun}</span>
                                        </div>
                                    </div>

                                    {hospital.medicalSubject && (
                                        <div className="mt-2 text-xs text-white/80 bg-white/5 p-2 rounded-xl border border-white/5 line-clamp-2">
                                            <span className="text-white/40 font-bold mr-1">진료과목:</span>
                                            {hospital.medicalSubject}
                                        </div>
                                    )}

                                    {/* Additional Info */}
                                    <div className="mt-1 pt-2 border-t border-white/5 flex gap-2">
                                        <span className="text-[10px] text-white/30 px-1.5 py-0.5 bg-white/5 rounded">
                                            {hospital.bizSmallType}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Disclaimer for missing map */}
            <div className="absolute bottom-20 left-0 right-0 pointer-events-none flex justify-center z-20">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/5">
                    <p className="text-[10px] text-white/40">※ 위치 좌표 데이터 부재로 지도 기능은 제공되지 않습니다.</p>
                </div>
            </div>
        </div>
    );
}
