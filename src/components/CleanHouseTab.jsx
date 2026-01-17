import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet Icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Clean House Icon (Green)
const cleanHouseIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to recenter map
function RecenterAutomatically({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) map.setView([lat, lng], 16);
    }, [lat, lng, map]);
    return null;
}

// Component to handle map events (Zoom & Move)
function MapEvents({ setBounds, setZoom }) {
    const map = useMapEvents({
        moveend: () => {
            setBounds(map.getBounds());
            setZoom(map.getZoom());
        },
        zoomend: () => {
            setZoom(map.getZoom());
            setBounds(map.getBounds());
        }
    });

    // Initialize bounds on load
    useEffect(() => {
        if (map) {
            setBounds(map.getBounds());
            setZoom(map.getZoom());
        }
    }, [map]);

    return null;
}

export default function CleanHouseTab() {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myLocation, setMyLocation] = useState(null);
    const [selectedSpot, setSelectedSpot] = useState(null);
    const [bounds, setBounds] = useState(null);
    const [zoom, setZoom] = useState(13); // Initial Zoom

    // Viewport Culling & Zoom Level Filtering
    const visibleLocations = useMemo(() => {
        // Performance: Only render markers when zoomed in (Level 15+)
        if (zoom < 15 || !bounds) return [];

        return locations.filter(loc => {
            if (!loc['위도 좌표'] || !loc['경도 좌표']) return false;
            const lat = parseFloat(loc['위도 좌표']);
            const lng = parseFloat(loc['경도 좌표']);
            // Check if marker is within current map view
            return bounds.contains([lat, lng]);
        });
    }, [locations, bounds, zoom]);

    useEffect(() => {
        fetchCleanHouses();
        getMyLocation();
    }, []);

    const getMyLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setMyLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => console.log(error)
            );
        }
    };

    const fetchCleanHouses = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/clean-house', {
                params: { page: 1, perPage: 2500 } // Get enough data
            });

            if (res.data && res.data.data) {
                setLocations(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch clean houses:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full relative flex-1 bg-gray-900">
            {loading && (
                <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white">
                    <div className="animate-spin text-5xl mb-4">♻️</div>
                    <p className="font-bold animate-pulse">클린하우스 찾는 중...</p>
                </div>
            )}

            <MapContainer
                center={myLocation ? [myLocation.lat, myLocation.lng] : [33.4996, 126.5312]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                />

                <MapEvents setBounds={setBounds} setZoom={setZoom} />

                {myLocation && (
                    <>
                        <Circle center={[myLocation.lat, myLocation.lng]} radius={30} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.4 }} />
                        <Marker position={[myLocation.lat, myLocation.lng]} icon={new L.Icon({
                            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                        })} />
                        <RecenterAutomatically lat={myLocation.lat} lng={myLocation.lng} />
                    </>
                )}

                {/* Render Filtered Markers */}
                {visibleLocations.map((loc, idx) => (
                    <Marker
                        key={idx}
                        position={[parseFloat(loc['위도 좌표']), parseFloat(loc['경도 좌표'])]}
                        icon={cleanHouseIcon}
                        eventHandlers={{
                            click: () => setSelectedSpot(loc),
                        }}
                    />
                ))}
            </MapContainer>

            {/* Zoom Alert Overlay */}
            {!loading && zoom < 15 && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[450] pointer-events-none w-full px-10">
                    <div className="bg-black/70 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl text-center border border-white/10 flex flex-col items-center gap-2 animate-pulse">
                        <span className="text-3xl">🔍</span>
                        <div>
                            <p className="font-bold text-lg">지도를 확대해주세요</p>
                            <p className="text-white/70 text-sm">클린하우스 위치가 표시됩니다</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Helper Button - My Location */}
            <button
                onClick={() => {
                    getMyLocation();
                    // Reset zoom when clicking my location
                    const map = document.querySelector('.leaflet-container')?._leaflet_map;
                    if (map) map.setZoom(16);
                }}
                className="absolute top-4 right-4 z-[500] bg-white text-black p-3 rounded-full shadow-lg active:scale-95 transition-transform"
            >
                🎯
            </button>

            {/* Detail Card Overlay */}
            {selectedSpot && (
                <div className="absolute bottom-24 left-4 right-4 z-[1000]">
                    <div className="bg-slate-800 text-white p-6 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative border border-slate-600/50 backdrop-blur-sm">
                        <button
                            className="absolute top-4 right-4 text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                            onClick={() => setSelectedSpot(null)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="flex items-start gap-4 mb-6 pr-8">
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-700 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0">
                                ♻️
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="text-white font-bold text-xl leading-snug mb-1 break-keep">{selectedSpot['단지 명'] || '클린하우스'}</h3>
                                <p className="text-slate-400 text-sm font-medium truncate">{selectedSpot['도로명 주소'] || selectedSpot['읍면동 명']}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3 text-white">
                            <div className="bg-slate-700/50 p-2 text-center rounded-xl border border-white/5 flex flex-col justify-center min-h-[70px]">
                                <span className="block text-[11px] text-slate-400 mb-1 font-bold">일반쓰레기</span>
                                <span className="font-bold text-lg">{selectedSpot['종량제 수거함 수']}</span>
                            </div>
                            <div className="bg-slate-700/50 p-2 text-center rounded-xl border border-white/5 flex flex-col justify-center min-h-[70px]">
                                <span className="block text-[11px] text-slate-400 mb-1 font-bold">재활용</span>
                                <span className="font-bold text-lg text-yellow-400">{selectedSpot['재활용 수거함 수']}</span>
                            </div>
                            <div className="bg-slate-700/50 p-2 text-center rounded-xl border border-white/5 flex flex-col justify-center min-h-[70px]">
                                <span className="block text-[11px] text-slate-400 mb-1 font-bold">음식물</span>
                                <span className="font-bold text-lg text-orange-400">{selectedSpot['음식물 수거함 수']}</span>
                            </div>
                            <div className="bg-slate-700/50 p-2 text-center rounded-xl border border-white/5 flex flex-col justify-center min-h-[70px]">
                                <span className="block text-[11px] text-slate-400 mb-1 font-bold">CCTV</span>
                                <span className={`font-bold text-lg ${selectedSpot['CCTV 설치 수'] > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                    {selectedSpot['CCTV 설치 수'] > 0 ? 'O' : 'X'}
                                </span>
                            </div>
                        </div>

                        {selectedSpot['폐기 건전지 수거함 수'] > 0 && (
                            <div className="mt-4 px-4 py-3 bg-emerald-500/10 rounded-xl text-emerald-400 text-sm font-bold text-center border border-emerald-500/20 flex items-center justify-center gap-2">
                                🔋 폐건전지 수거 가능
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none z-[400] flex flex-col items-center gap-2">
                <div className="flex justify-center">
                    <div className="bg-black/80 backdrop-blur-md text-white px-5 py-2 rounded-full text-sm font-bold border border-white/10 shadow-lg flex items-center gap-2">
                        <span>♻️ 내주변 클린하우스 찾기</span>
                    </div>
                </div>
                <div className="bg-red-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[11px] font-bold shadow-lg flex items-center gap-1">
                    <span className="text-sm">⚠️</span> 현재 제주시 데이터만 제공됩니다 (서귀포 미지원)
                </div>
            </div>
        </div>
    );
}
