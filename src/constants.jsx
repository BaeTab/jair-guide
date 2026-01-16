import React from 'react';
import { motion } from 'framer-motion';

export const INITIAL_LOCATIONS = [
    { id: 'seogwipo', name: "서귀포 (남쪽)", lat: 33.2541, lng: 126.5601 },
    { id: 'jeju', name: "제주시 (북쪽)", lat: 33.4996, lng: 126.5312 },
    { id: 'hallim', name: "한림 (서쪽)", lat: 33.4147, lng: 126.2629 },
    { id: 'seongsan', name: "성산 (동쪽)", lat: 33.4580, lng: 126.9363 },
    { id: 'pyoseon', name: "표선 (남동)", lat: 33.3283, lng: 126.8306 },
    { id: 'aewol', name: "애월 (북서)", lat: 33.465, lng: 126.3195 },
    { id: 'gujwa', name: "구좌 (북동)", lat: 33.5276, lng: 126.8530 },
    { id: 'highland', name: "1100고지 (산간)", lat: 33.3578, lng: 126.4624 }
];

export const COLORS = {
    good: "#60A5FA",    // Blue-400
    moderate: "#34D399", // Emerald-400
    unhealthy: "#FB923C", // Orange-400
    hazardous: "#F87171"  // Red-400
};

export const FACES = {
    good: (
        <motion.svg
            key="face-good"
            viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            initial="initial" animate="animate"
        >
            <motion.circle cx="12" cy="12" r="10" />
            <motion.path
                key="mouth-good"
                d="M8 14s1.5 2 4 2 4-2 4-2"
                initial={{ d: "M8 14s1.5 2 4 2 4-2 4-2" }}
                animate={{ d: ["M8 14s1.5 2 4 2 4-2 4-2", "M8 15s1.5 3 4 3 4-3 4-3", "M8 14s1.5 2 4 2 4-2 4-2"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.circle
                cx="9" cy="9" r="0.5" fill="currentColor"
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, times: [0, 0.1, 0.2], delay: 1 }}
            />
            <motion.circle
                cx="15" cy="9" r="0.5" fill="currentColor"
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, times: [0, 0.1, 0.2], delay: 1 }}
            />
        </motion.svg>
    ),
    moderate: (
        <motion.svg
            key="face-moderate"
            viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            initial="initial" animate="animate"
        >
            <motion.circle cx="12" cy="12" r="10" />
            <motion.line
                x1="8" y1="15" x2="16" y2="15"
                animate={{ x1: [8, 9, 8], x2: [16, 15, 16] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.circle
                cx="9" cy="9" r="0.5" fill="currentColor"
                initial={{ scaleY: 1 }}
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{ duration: 4, repeat: Infinity, times: [0, 0.1, 0.2] }}
            />
            <motion.circle
                cx="15" cy="9" r="0.5" fill="currentColor"
                initial={{ scaleY: 1 }}
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{ duration: 4, repeat: Infinity, times: [0, 0.1, 0.2] }}
            />
        </motion.svg>
    ),
    unhealthy: (
        <motion.svg
            key="face-unhealthy"
            viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            initial="initial" animate="animate"
        >
            <motion.circle cx="12" cy="12" r="10" />
            <motion.path
                key="mouth-unhealthy"
                d="M16 16s-1.5-2-4-2-4 2-4 2"
                animate={{ y: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.g animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 4, repeat: Infinity }}>
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
            </motion.g>
        </motion.svg>
    ),
    hazardous: (
        <motion.svg
            key="face-hazardous"
            viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            initial="initial" animate="animate"
        >
            <motion.circle
                cx="12" cy="12" r="10"
                animate={{ stroke: ["currentColor", "rgba(255,255,255,0.2)", "currentColor"] }}
                transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.path d="M16 16s-1.5-2-4-2-4 2-4 2" />
            <motion.path
                d="M9 8l4 4"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
            />
            <motion.path
                d="M13 8l-4 4"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: 0.25 }}
            />
        </motion.svg>
    )
};

export const MESSAGES = {
    good: { text: "날씨 잘도 좋수다! 🍊", sub: "상쾌한 제주 바람 맞으며 걸읍서.", icon: FACES.good },
    moderate: { text: "무사한 날이우다 🙂", sub: "활동하기엔 거념없수다.", icon: FACES.moderate },
    unhealthy: { text: "먼지가 하영 잇수다 😷", sub: "마스크 챙겨서 댕깁서.", icon: FACES.unhealthy },
    hazardous: { text: "오늘은 나가지 맙서! 🛑", sub: "집안에 있는 게 제일 좋쿠다.", icon: FACES.hazardous }
};

export const WEATHER_CODES = {
    0: { label: '맑음', icon: '☀️' },
    1: { label: '대체로 맑음', icon: '🌤️' },
    2: { label: '구름 조금', icon: '⛅' },
    3: { label: '흐림', icon: '☁️' },
    45: { label: '안개', icon: '🌫️' },
    48: { label: '짙은 안개', icon: '🌫️' },
    51: { label: '가벼운 이슬비', icon: '🌦️' },
    53: { label: '이슬비', icon: '🌦️' },
    55: { label: '강한 이슬비', icon: '🌧️' },
    61: { label: '비', icon: '🌧️' },
    63: { label: '비', icon: '🌧️' },
    65: { label: '폭우', icon: '⛈️' },
    71: { label: '눈', icon: '❄️' },
    73: { label: '눈', icon: '❄️' },
    75: { label: '폭설', icon: '❄️' },
    95: { label: '뇌우', icon: '⚡' },
};
export const THEMES = {
    ocean: {
        id: 'ocean',
        name: '제주 바다',
        icon: '🌊',
        colors: {
            bg: 'from-blue-900 to-cyan-900', // Deep ocean blue
            accent: 'text-cyan-300',
            button: 'bg-cyan-600',
            text: 'text-slate-100', // Crisper white
            radarStroke: '#22D3EE', // Cyan-400
            radarFill: 'rgba(34, 211, 238, 0.4)'
        }
    },
    canola: {
        id: 'canola',
        name: '유채꽃',
        icon: '🌼',
        colors: {
            bg: 'from-yellow-600 to-orange-700', // Much darker gold/orange
            accent: 'text-yellow-300',
            button: 'bg-orange-600',
            text: 'text-yellow-100',
            radarStroke: '#FBBF24',
            radarFill: 'rgba(251, 191, 36, 0.4)'
        }
    },
    camellia: {
        id: 'camellia',
        name: '동백꽃',
        icon: '🌺',
        colors: {
            bg: 'from-red-700 to-pink-800', // Deep red/pink
            accent: 'text-red-300',
            button: 'bg-rose-600',
            text: 'text-rose-100',
            radarStroke: '#F87171',
            radarFill: 'rgba(248, 113, 113, 0.4)'
        }
    },
    stone: {
        id: 'stone',
        name: '현무암',
        icon: '🗿',
        colors: {
            bg: 'from-gray-700 to-gray-900',
            accent: 'text-gray-400',
            button: 'bg-gray-600',
            text: 'text-gray-200',
            radarStroke: '#9CA3AF',
            radarFill: 'rgba(156, 163, 175, 0.4)'
        }
    }
};
export const JEJU_DIALECTS = [
    { word: '하영', mean: '많이' },
    { word: '호꼼', mean: '조금' },
    { word: '무사', mean: '왜' },
    { word: '거념맙서', mean: '걱정마세요' },
    { word: '잘도 좋수다', mean: '매우 좋습니다' }
];
