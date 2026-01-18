import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from './SEO';
import SupportButton from './SupportButton';
import { shareToKakao } from '../utils/share';

// 제주 오일장 데이터
const JEJU_MARKETS = [
    {
        id: 'daejeong',
        name: '대정오일시장',
        location: '서귀포시 대정읍',
        days: [1, 6], // 1일, 6일, 11일, 16일, 21일, 26일
        description: '제주 서쪽 대표 오일장',
        specialties: ['흑돼지', '감귤', '마늘'],
        lat: 33.2211,
        lng: 126.2514,
        address: '서귀포시 대정읍 하모중앙로 30',
    },
    {
        id: 'hamdeok',
        name: '함덕오일시장',
        location: '제주시 조천읍',
        days: [1, 6],
        description: '함덕해수욕장 근처 오일장',
        specialties: ['해산물', '당근', '양배추'],
        lat: 33.5431,
        lng: 126.6692,
        address: '제주시 조천읍 함덕14길 8',
    },
    {
        id: 'jeju-minsok',
        name: '제주민속오일시장',
        location: '제주시 도두동',
        days: [2, 7],
        description: '제주 최대 규모 오일장 (도두)',
        specialties: ['제주 특산물 전체', '옷', '생활용품'],
        lat: 33.4967,
        lng: 126.4636,
        address: '제주시 오일장서길 26',
    },
    {
        id: 'pyoseon',
        name: '표선오일시장',
        location: '서귀포시 표선면',
        days: [2, 7],
        description: '표선해비치 해변 근처',
        specialties: ['해산물', '감귤', '야채'],
        lat: 33.3255,
        lng: 126.8401,
        address: '서귀포시 표선면 표선중앙로 22',
    },
    {
        id: 'jungmun',
        name: '중문오일시장',
        location: '서귀포시 중문동',
        days: [3, 8],
        description: '중문관광단지 인근',
        specialties: ['감귤', '한라봉', '흑돼지'],
        lat: 33.2539,
        lng: 126.4127,
        address: '서귀포시 중문동 2114',
    },
    {
        id: 'seogwipo',
        name: '서귀포향토오일시장',
        location: '서귀포시 서귀동',
        days: [4, 9],
        description: '서귀포 대표 전통시장',
        specialties: ['감귤', '갈치', '옥돔'],
        lat: 33.2469,
        lng: 126.5614,
        address: '서귀포시 중앙로62번길 18',
    },
    {
        id: 'hallim',
        name: '한림민속오일시장',
        location: '제주시 한림읍',
        days: [4, 9],
        description: '한림항 인근 오일장',
        specialties: ['해산물', '감귤', '고구마'],
        lat: 33.4120,
        lng: 126.2675,
        address: '제주시 한림읍 한림로 300',
    },
    {
        id: 'sehwa',
        name: '세화오일시장',
        location: '제주시 구좌읍',
        days: [5, 10],
        description: '세화해변 인근 소규모 장',
        specialties: ['당근', '무', '해산물'],
        lat: 33.5267,
        lng: 126.8552,
        address: '제주시 구좌읍 세화5길 17',
    },
    {
        id: 'goseong',
        name: '고성오일시장',
        location: '서귀포시 성산읍',
        days: [5, 10],
        description: '성산일출봉 인근',
        specialties: ['해산물', '감귤', '야채'],
        lat: 33.4426,
        lng: 126.9242,
        address: '서귀포시 성산읍 고성동서로 22',
    },
];

// 오늘 날짜 기준으로 장날인지 확인
const isMarketDay = (days) => {
    const today = new Date();
    const dayOfMonth = today.getDate();
    const lastDigit = dayOfMonth % 10;

    // days 배열에 해당 끝자리가 있는지 확인
    return days.some(d => {
        if (d === 10) return lastDigit === 0; // 10일, 20일, 30일
        return lastDigit === d;
    });
};

// 다음 장날 계산
const getNextMarketDay = (days) => {
    const today = new Date();
    const dayOfMonth = today.getDate();

    for (let i = 0; i <= 10; i++) {
        const checkDate = dayOfMonth + i;
        const lastDigit = checkDate % 10;

        const isMatch = days.some(d => {
            if (d === 10) return lastDigit === 0;
            return lastDigit === d;
        });

        if (isMatch) {
            if (i === 0) return '오늘!';
            if (i === 1) return '내일';
            return `${i}일 후`;
        }
    }
    return '-';
};

// 장날 패턴 문자열
const getMarketDayPattern = (days) => {
    if (days.includes(10)) {
        return days.filter(d => d !== 10).map(d => d).concat([10]).join('일, ') + '일';
    }
    return days.join('일, ') + '일';
};

export default function MarketTab() {
    const [selectedMarket, setSelectedMarket] = useState(null);
    const [filterToday, setFilterToday] = useState(false);

    // 오늘 열리는 장 필터링
    const displayMarkets = useMemo(() => {
        if (filterToday) {
            return JEJU_MARKETS.filter(m => isMarketDay(m.days));
        }
        return JEJU_MARKETS;
    }, [filterToday]);

    // 오늘 장날인 시장 수
    const todayMarketsCount = useMemo(() => {
        return JEJU_MARKETS.filter(m => isMarketDay(m.days)).length;
    }, []);

    const today = new Date();
    const todayStr = `${today.getMonth() + 1}월 ${today.getDate()}일`;

    // 오늘 장날 요약 생성
    const todayMarketNames = JEJU_MARKETS.filter(m => isMarketDay(m.days)).map(m => m.name);

    const handleShareToday = () => {
        if (todayMarketsCount > 0) {
            shareToKakao({
                title: `[제주바람] 오늘(${todayStr}) 오일장 정보`,
                description: `오늘 열리는 장: ${todayMarketNames.join(', ')}`,
                webUrl: 'https://jair-guide.web.app/?tab=market',
                profileText: '🛒 제주 오일장',
                items: todayMarketNames.slice(0, 4).map(name => ({
                    item: '📍',
                    itemOp: name
                }))
            });
        } else {
            shareToKakao({
                title: `[제주바람] 제주 오일장 달력`,
                description: '제주도 전역 9개 오일장 일정을 확인하세요!',
                webUrl: 'https://jair-guide.web.app/?tab=market'
            });
        }
    };

    const handleShareMarket = (market, e) => {
        e.stopPropagation();
        const isOpen = isMarketDay(market.days);
        shareToKakao({
            title: `[제주바람] ${market.name}`,
            description: `${market.description} - ${isOpen ? '오늘 장날!' : getNextMarketDay(market.days)}`,
            webUrl: 'https://jair-guide.web.app/?tab=market',
            profileText: `🛒 ${market.name}`,
            items: [
                { item: '📅 장날', itemOp: getMarketDayPattern(market.days) },
                { item: '📍 위치', itemOp: market.location },
                { item: '🏷️ 대표품목', itemOp: market.specialties.slice(0, 2).join(', ') },
            ]
        });
    };

    return (
        <div className="flex-1 overflow-y-auto pt-6 px-4 pb-24 text-white z-10 scroll-smooth">
            <SEO
                title="제주 오일장 달력 - 장날 일정"
                description="제주도 전역 오일장 일정을 확인하세요. 대정, 함덕, 제주민속, 표선, 중문, 서귀포, 한림, 세화, 고성 오일장 장날 정보."
                keywords="제주오일장, 제주장날, 제주전통시장, 제주민속오일시장, 서귀포오일장"
                url="market"
            />

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <span className="text-4xl">🛒</span> 제주 오일장
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShareToday}
                            className="bg-[#FEE500] text-[#3C1E1E] px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 hover:brightness-105 active:scale-95 transition-all shadow-lg"
                        >
                            <span className="text-base">💬</span> 공유
                        </button>
                        <SupportButton />
                    </div>
                </div>
                <p className="text-white/60 text-sm mt-1">제주 전역 9개 오일장 일정</p>
            </div>

            {/* Today Summary */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-orange-500/30 to-amber-500/30 rounded-3xl p-5 mb-6 border border-white/10"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white/60 text-xs mb-1">오늘 ({todayStr})</p>
                        <p className="text-2xl font-black">
                            {todayMarketsCount > 0 ? (
                                <span className="text-amber-400">{todayMarketsCount}개 장 열림! 🎉</span>
                            ) : (
                                <span className="text-white/50">오늘은 쉬는 날</span>
                            )}
                        </p>
                    </div>
                    <div className="text-5xl">📅</div>
                </div>
            </motion.div>

            {/* Filter Toggle */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setFilterToday(false)}
                    className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${!filterToday
                        ? 'bg-white text-slate-900'
                        : 'bg-white/10 text-white/60'
                        }`}
                >
                    전체 보기
                </button>
                <button
                    onClick={() => setFilterToday(true)}
                    className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${filterToday
                        ? 'bg-amber-500 text-white'
                        : 'bg-white/10 text-white/60'
                        }`}
                >
                    🔥 오늘 장날만
                </button>
            </div>

            {/* Market List */}
            <div className="space-y-3">
                {displayMarkets.map((market, idx) => {
                    const isOpen = isMarketDay(market.days);
                    const nextDay = getNextMarketDay(market.days);

                    return (
                        <motion.div
                            key={market.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setSelectedMarket(selectedMarket === market.id ? null : market.id)}
                            className={`rounded-2xl p-4 cursor-pointer transition-all border ${isOpen
                                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30'
                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isOpen ? 'bg-amber-500/30' : 'bg-white/10'
                                        }`}>
                                        {isOpen ? '🛍️' : '🏪'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-white">{market.name}</h3>
                                            {isOpen && (
                                                <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                                                    OPEN
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-white/50 text-xs">{market.location}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${isOpen ? 'text-amber-400' : 'text-white/60'}`}>
                                        {nextDay}
                                    </p>
                                    <div className="flex items-center justify-end gap-1 mt-1">
                                        <p className="text-white/40 text-[10px] mr-1">
                                            {getMarketDayPattern(market.days)}
                                        </p>
                                        <button
                                            onClick={(e) => handleShareMarket(market, e)}
                                            className="text-[#FEE500] hover:scale-110 transition-transform p-1"
                                            title="카카오톡 공유"
                                        >
                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.558 1.707 4.8 4.315 6.055-.188.702-.68 2.541-.777 2.928-.123.477.178.47.37.34.15-.102 2.386-1.622 3.347-2.27.575.087 1.15.132 1.745.132 4.97 0 9-3.184 9-7.115S16.97 3 12 3z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            <AnimatePresence>
                                {selectedMarket === market.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-4 mt-4 border-t border-white/10">
                                            <p className="text-white/70 text-sm mb-3">{market.description}</p>

                                            <div className="mb-3">
                                                <p className="text-white/40 text-xs mb-1">🏷️ 대표 품목</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {market.specialties.map(spec => (
                                                        <span
                                                            key={spec}
                                                            className="px-2 py-1 bg-white/10 rounded-lg text-xs text-white/80"
                                                        >
                                                            {spec}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-white/50">
                                                <span>📍</span>
                                                <span>{market.address}</span>
                                            </div>

                                            <a
                                                href={`https://map.kakao.com/link/search/${encodeURIComponent(market.name)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="mt-3 block w-full py-2 bg-amber-500/20 text-amber-400 rounded-xl text-center text-sm font-bold hover:bg-amber-500/30 transition-all"
                                            >
                                                🗺️ 지도에서 보기
                                            </a>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* No Results */}
            {displayMarkets.length === 0 && (
                <div className="text-center py-12 text-white/40">
                    <p className="text-4xl mb-3">😴</p>
                    <p>오늘은 열리는 장이 없어요</p>
                </div>
            )}

            {/* Legend */}
            <div className="mt-8 p-4 bg-white/5 rounded-2xl">
                <p className="text-white/40 text-xs font-bold mb-3">📌 장날 규칙</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
                    <div>• 1, 6일: 대정, 함덕</div>
                    <div>• 2, 7일: 제주민속, 표선</div>
                    <div>• 3, 8일: 중문</div>
                    <div>• 4, 9일: 서귀포, 한림</div>
                    <div>• 5, 10일: 세화, 고성</div>
                </div>
            </div>
        </div>
    );
}
