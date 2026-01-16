import React from 'react';

// 은은한 후원 버튼 컴포넌트
export default function SupportButton({ className = '' }) {
    return (
        <a
            href="https://buymeacoffee.com/bhwoo484"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-yellow-500/20 border border-white/10 hover:border-yellow-500/30 transition-all duration-300 group ${className}`}
        >
            <span className="text-sm group-hover:scale-110 transition-transform">☕</span>
            <span className="text-[10px] font-medium text-white/40 group-hover:text-yellow-300 transition-colors">응원하기</span>
        </a>
    );
}
