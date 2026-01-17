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

// Wifi Icon (Blue)
const wifiIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
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

// Component to handle map events
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

    useEffect(() => {
        if (map) {
            setBounds(map.getBounds());
            setZoom(map.getZoom());
        }
    }, [map]);
    return null;
}

export default function WifiTab() {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myLocation, setMyLocation] = useState(null);
    const [selectedSpot, setSelectedSpot] = useState(null);
    const [bounds, setBounds] = useState(null);
    const [zoom, setZoom] = useState(13);

    // Viewport Culling
    const visibleLocations = useMemo(() => {
        if (zoom < 13 || !bounds) return []; // Allow wider zoom than CleanHouse

        return locations.filter(loc => {
            if (!loc.latitude || !loc.longitude) return false;
            const lat = parseFloat(loc.latitude);
            const lng = parseFloat(loc.longitude);
            return bounds.contains([lat, lng]);
        });
    }, [locations, bounds, zoom]);

    useEffect(() => {
        fetchWifiData();
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

    const fetchWifiData = async () => {
        try {
            setLoading(true);

            // 1. Fetch first page immediately to show something
            const limit = 100;
            const res1 = await axios.get('/api/wifi', { params: { number: 1, limit } });

            if (res1.data && res1.data.data) {
                let allData = res1.data.data;

                // Deduplicate and Set initial data
                const uniqueWifiMap = new Map();
                allData.forEach(item => {
                    if (item.macAddress && item.latitude && item.longitude) {
                        uniqueWifiMap.set(item.macAddress, item);
                    }
                });
                setLocations(Array.from(uniqueWifiMap.values()));

                // 2. Fetch more pages in background (Limit to 10 pages total for performance)
                // If the user needs more, we can add a 'Load More' button or optimize later.
                const maxPages = 20; // 2000 items is enough for a good coverage
                const promises = [];
                for (let i = 2; i <= maxPages; i++) {
                    promises.push(axios.get('/api/wifi', { params: { number: i, limit } }));
                }

                // Process background fetching
                Promise.allSettled(promises).then(results => {
                    const moreData = results
                        .filter(r => r.status === 'fulfilled')
                        .flatMap(r => r.value.data.data || []);

                    if (moreData.length > 0) {
                        setLocations(prev => {
                            const newMap = new Map();
                            // Keep existing icons
                            prev.forEach(p => newMap.set(p.macAddress, p));
                            // Add new icons
                            moreData.forEach(item => {
                                if (item.macAddress && item.latitude && item.longitude) {
                                    newMap.set(item.macAddress, item);
                                }
                            });
                            return Array.from(newMap.values());
                        });
                    }
                });
            }
        } catch (error) {
            console.error("Failed to fetch wifi data:", error);
            // Show alert or retry logic
        } finally {
            setLoading(false);
        }
    };

    const getCategoryIcon = (cat) => {
        if (!cat) return '📶';
        if (cat.includes('버스')) return '🚌';
        if (cat.includes('관광')) return '🌴';
        if (cat.includes('공원')) return '🌳';
        if (cat.includes('시장')) return '🏪';
        if (cat.includes('전기차')) return '⚡';
        return '📶';
    };

    return (
        <div className="w-full h-full relative flex-1 bg-gray-900">
            {loading && (
                <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white">
                    <div className="animate-spin text-5xl mb-4">📶</div>
                    <p className="font-bold animate-pulse">무료 와이파이 정보 로딩중...</p>
                </div>
            )}

            <MapContainer
                center={myLocation ? [myLocation.lat, myLocation.lng] : [33.4996, 126.5312]}
                zoom={14}
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
                            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                        })} />
                        <RecenterAutomatically lat={myLocation.lat} lng={myLocation.lng} />
                    </>
                )}

                {visibleLocations.map((loc, idx) => (
                    <Marker
                        key={idx}
                        position={[parseFloat(loc.latitude), parseFloat(loc.longitude)]}
                        icon={wifiIcon}
                        eventHandlers={{
                            click: () => setSelectedSpot(loc),
                        }}
                    />
                ))}
            </MapContainer>

            {/* Zoom Alert */}
            {!loading && zoom < 13 && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[450] pointer-events-none w-full px-10">
                    <div className="bg-black/70 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl text-center border border-white/10 flex flex-col items-center gap-2 animate-pulse">
                        <span className="text-3xl">🔍</span>
                        <div>
                            <p className="font-bold text-lg">지도를 확대해주세요</p>
                            <p className="text-white/70 text-sm">와이파이 위치가 표시됩니다</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Helper Button - My Location */}
            <button
                onClick={() => {
                    getMyLocation();
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
                    <div className="bg-blue-900 text-white p-6 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative border border-blue-500/30 backdrop-blur-sm">
                        <button
                            className="absolute top-4 right-4 text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                            onClick={() => setSelectedSpot(null)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="flex items-center gap-4 mb-4 pr-8">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0 border border-white/20">
                                {getCategoryIcon(selectedSpot.category)}
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="text-white font-bold text-xl leading-snug mb-1 truncate">{selectedSpot.apGroupName}</h3>
                                <div className="text-blue-300 text-xs font-bold px-2 py-0.5 bg-blue-500/20 rounded inline-block border border-blue-500/30">
                                    {selectedSpot.category || '공공와이파이'}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex items-start gap-3">
                                <span className="text-lg">📍</span>
                                <div>
                                    <span className="block text-[10px] text-white/50 font-bold mb-0.5">주소</span>
                                    <span className="text-sm font-medium leading-snug block">
                                        {selectedSpot.addressDong} {selectedSpot.addressDetail}
                                    </span>
                                </div>
                            </div>
                            {selectedSpot.installLocationDetail && (
                                <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex items-start gap-3">
                                    <span className="text-lg">🏗️</span>
                                    <div>
                                        <span className="block text-[10px] text-white/50 font-bold mb-0.5">상세설치위치</span>
                                        <span className="text-sm font-medium leading-snug block">{selectedSpot.installLocationDetail}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none z-[400] flex justify-center">
                <div className="bg-blue-600/90 backdrop-blur-md text-white px-5 py-2 rounded-full text-sm font-bold border border-white/10 shadow-lg flex items-center gap-2">
                    <span>📶 제주 무료 와이파이 찾기</span>
                </div>
            </div>
        </div>
    );
}
