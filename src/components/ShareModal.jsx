import html2canvas from 'html2canvas';
import { trackShare } from '../analytics';

export default function ShareModal({ isOpen, onClose, data, mainStatus, weather, themeColors }) {
    const cardRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 3, // High resolution
                backgroundColor: null,
                useCORS: true
            });
            canvas.toBlob((blob) => {
                if (!blob) {
                    console.error("Blob creation failed");
                    return;
                }
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `JejuAir_Card_${Date.now()}.png`; // Safer filename
                link.href = url;
                document.body.appendChild(link); // Required for Firefox
                link.click();
                document.body.removeChild(link); // Clean up
                URL.revokeObjectURL(url); // Free memory

                // Analytics: Track share/download action
                trackShare('image_download', data.locationName);

                onClose();
            }, 'image/png');
        } catch (e) {
            console.error("Failed to generate card", e);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[5000] overflow-y-auto bg-black/80 backdrop-blur-md">
            <div className="min-h-full flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-6 w-full max-w-sm my-8">
                    {/* Card and Canvas Area */}
                    <div className="relative w-full h-auto min-h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl ring-8 ring-white/10" ref={cardRef}>
                        {/* Card Background */}
                        <div className={`absolute inset-0 transition-colors duration-1000 ${themeColors?.bg ? `bg-gradient-to-br ${themeColors.bg}` : ''}`} style={{ backgroundColor: themeColors?.bg ? undefined : mainStatus.color }}>
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/40"></div>
                            {/* Decorative Circles */}
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>
                            <div className="absolute top-1/2 -left-20 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
                        </div>

                        <div className="relative h-full flex flex-col items-center px-8 py-12 text-white text-center">
                            <div className="flex items-center gap-2 opacity-80 mb-12">
                                <span className="text-2xl">🍃</span>
                                <span className="text-xl font-black tracking-tight">제주바람</span>
                            </div>

                            <h2 className="text-4xl font-black mb-2 drop-shadow-lg">{data.locationName}</h2>
                            <p className="text-lg font-bold opacity-90 mb-12">Jeju Island Air Quality</p>

                            {/* Center Focus Status */}
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="w-40 h-40 mb-8 drop-shadow-2xl">
                                    {mainStatus.icon}
                                </div>
                                <h3 className="text-5xl font-black mb-2 tracking-tight drop-shadow-lg">{mainStatus.text}</h3>
                                <p className="text-xl font-bold opacity-90">{mainStatus.sub}</p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 w-full mb-12">
                                <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                                    <p className="text-[10px] font-bold opacity-70 mb-1 uppercase">Temperature</p>
                                    <p className="text-xl font-black">{data.temp}°C</p>
                                </div>
                                <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                                    <p className="text-[10px] font-bold opacity-70 mb-1 uppercase">Weather</p>
                                    <p className="text-xl font-black">{weather.label}</p>
                                </div>
                                <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                                    <p className="text-[10px] font-bold opacity-70 mb-1 uppercase">Dust (PM10)</p>
                                    <p className="text-xl font-black">{data.pm10} <span className="text-xs opacity-50">µg</span></p>
                                </div>
                                <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                                    <p className="text-[10px] font-bold opacity-70 mb-1 uppercase">Humidity</p>
                                    <p className="text-xl font-black">{data.humidity}%</p>
                                </div>
                            </div>

                            <div className="opacity-40 text-[10px] font-bold tracking-widest uppercase">
                                Captured at {new Date().toLocaleString('ko-KR')}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 w-full px-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black transition-all"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={isGenerating}
                            className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-900/40 transition-all flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <span className="animate-spin text-xl">⏳</span>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                                    </svg>
                                    이미지 저장
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
