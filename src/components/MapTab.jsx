import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import WindParticles from './WindParticles';
import { COLORS, WEATHER_CODES } from '../constants';
import moment from 'moment-timezone';

// Fix for default marker icon in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function ChangeView({ center }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, 10);
        // Ensure map updates its internal size calculation
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }, [center, map]);
    return null;
}

export default function MapTab({ locations, dataMap, selectedLoc, setSelectedLoc, mainStatus, seaTripData }) {
    const [mapStyle, setMapStyle] = React.useState('voyager'); // voyager, satellite
    const [showFlights, setShowFlights] = React.useState(true);
    const [flights, setFlights] = React.useState([]);
    const [flightTracks, setFlightTracks] = React.useState({}); // { icao24: [[lat, lng], ...] }

    useEffect(() => {
        let timer;
        const fetchFlights = async () => {
            if (!showFlights) return;
            try {
                const res = await axios.get('/api/flights');
                if (res.data?.success) {
                    const newFlights = res.data.data;
                    setFlights(newFlights);

                    // Update tracks
                    setFlightTracks(prev => {
                        const next = { ...prev };
                        newFlights.forEach(f => {
                            const pos = [f.lat, f.lng];
                            if (!next[f.icao24]) {
                                next[f.icao24] = [pos];
                            } else {
                                const lastPos = next[f.icao24][next[f.icao24].length - 1];
                                // Only add if position changed significantly
                                if (lastPos[0] !== pos[0] || lastPos[1] !== pos[1]) {
                                    const newTrack = [...next[f.icao24], pos];
                                    // Keep last 30 points (~10 mins @ 20s interval)
                                    next[f.icao24] = newTrack.slice(-30);
                                }
                            }
                        });
                        // Cleanup old flights that haven't been seen for a while (optional, but keep for now)
                        return next;
                    });
                }
            } catch (e) {
                console.warn("Flight fetch failed", e);
            }
        };

        if (showFlights) {
            fetchFlights();
            timer = setInterval(fetchFlights, 20000); // Poll every 20s
        }
        return () => clearInterval(timer);
    }, [showFlights]);

    const currentData = dataMap[selectedLoc.id];
    const weatherLabel = (currentData && WEATHER_CODES && WEATHER_CODES[currentData.weatherCode])
        ? WEATHER_CODES[currentData.weatherCode].label
        : '';

    const isJeju = (lat, lng) => lat > 33.0 && lat < 34.0 && lng > 126.0 && lng < 127.2;
    const mapCenter = isJeju(selectedLoc.lat, selectedLoc.lng)
        ? [selectedLoc.lat, selectedLoc.lng]
        : [33.4996, 126.5312]; // Default to Jeju City

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-900 border-b border-white/5">
            <div className="px-6 pt-6 pb-4">
                <h2 className="text-2xl font-black text-white mb-1">제주 전역 지도</h2>
                <p className="text-white/60 text-xs">관심 있는 지역의 고르멍 확인해봅서.</p>
            </div>
            <div className="flex-1 w-full relative overflow-hidden">
                <WindParticles
                    windSpd={dataMap[selectedLoc.id]?.windSpeed}
                    windDir={dataMap[selectedLoc.id]?.windDirection}
                />

                {/* Map style toggle */}
                <div className="absolute top-4 right-4 z-[1001] flex flex-col gap-2">
                    <div className="glass-card glass-border rounded-2xl p-1.5 flex shadow-xl bg-slate-900/40">
                        {[
                            { id: 'voyager', icon: '🗺️', label: '표준' },
                            { id: 'satellite', icon: '🛰️', label: '위성' }
                        ].map(style => (
                            <button
                                key={style.id}
                                onClick={() => setMapStyle(style.id)}
                                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${mapStyle === style.id ? 'bg-blue-500 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                            >
                                <span className="text-sm">{style.icon}</span>
                                <span className="text-xs font-black">{style.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Flight Toggle */}
                    <button
                        onClick={() => setShowFlights(!showFlights)}
                        className={`glass-card glass-border p-3 rounded-2xl transition-all flex items-center justify-between shadow-xl ${showFlights ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-900/40 text-white/30'}`}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-xl">✈️</span>
                            <span className="text-[10px] font-black uppercase tracking-tighter">Live Flights</span>
                        </div>
                        {showFlights && flights.length > 0 && (
                            <span className="ml-4 bg-amber-500 text-white text-[9px] px-1.5 rounded-full font-black animate-pulse">
                                {flights.length}
                            </span>
                        )}
                    </button>
                </div>

                <MapContainer
                    center={mapCenter}
                    zoom={10} minZoom={9} maxZoom={13}
                    maxBounds={[[33.0, 126.0], [34.0, 127.2]]}
                    zoomControl={false} attributionControl={false} scrollWheelZoom={true}
                    className="absolute inset-0 z-0 bg-slate-900"
                >
                    <ChangeView center={mapCenter} />

                    {/* Base Tile Layers */}
                    {mapStyle === 'voyager' ? (
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    ) : (
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                    )}

                    {/* Plane Tracks (Breadcrumbs) */}
                    {showFlights && Object.entries(flightTracks).map(([icao24, track]) => {
                        if (track.length < 2) return null;
                        const isLive = flights.some(f => f.icao24 === icao24);
                        if (!isLive) return null; // Only show paths for planes currently on map

                        return (
                            <Polyline
                                key={`track-${icao24}`}
                                positions={track}
                                pathOptions={{
                                    color: '#FBBF24',
                                    weight: 2,
                                    opacity: 0.5,
                                    dashArray: '5, 10',
                                    lineJoin: 'round'
                                }}
                            />
                        );
                    })}

                    {/* Plane Markers */}
                    {showFlights && flights.map(flight => (
                        <Marker
                            key={flight.icao24}
                            position={[flight.lat, flight.lng]}
                            icon={L.divIcon({
                                className: 'plane-marker',
                                html: `<div style="transform: rotate(${flight.heading || 0}deg); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); transition: all 0.5s ease;">
                                         <svg viewBox="0 0 24 24" fill="#FBBF24" xmlns="http://www.w3.org/2000/svg">
                                           <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" stroke="#D97706" stroke-width="0.5" />
                                         </svg>
                                         <div style="position: absolute; top: 100%; left: 50%; transform: translateX(-50%) rotate(-${flight.heading || 0}deg); background: rgba(0,0,0,0.7); color: #FBBF24; padding: 1px 4px; border-radius: 4px; font-size: 8px; font-weight: 800; white-space: nowrap; pointer-events: none; margin-top: 4px; border: 1px solid #FBBF2440; backdrop-blur: 2px;">
                                           ${flight.callsign}
                                         </div>
                                       </div>`,
                                iconSize: [32, 32],
                                iconAnchor: [16, 16]
                            })}
                        />
                    ))}

                    {locations.map(loc => {
                        const info = dataMap[loc.id];
                        if (!info || !info.status) return null;
                        const isSelected = selectedLoc.id === loc.id;
                        const size = isSelected ? 64 : 48;
                        const color = COLORS[info.status.type] || COLORS.good;

                        // Wind Arrow Rotation (VEC: 0 is North, 180 is South)
                        const windDir = info.windDirection || 0;
                        const windSpd = info.windSpeed || 0;

                        return (
                            <Marker
                                key={loc.id}
                                position={[loc.lat, loc.lng]}
                                icon={L.divIcon({
                                    className: 'custom-map-marker',
                                    html: `<div style="position: relative; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); transform: scale(${isSelected ? 1.1 : 1});">
                           <!-- Wind Direction Indicator -->
                           <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%) rotate(${windDir}deg); z-index: 10; transition: transform 0.8s ease-out;">
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                               <path d="M12 19V5M5 12l7-7 7 7" />
                             </svg>
                           </div>
                           <!-- Main Marker -->
                           <div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 4px solid white; position: relative; z-index: 1;">
                             <div style="width: 24px; height: 24px; color: white;">
                               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path></svg>
                             </div>
                           </div>
                           <!-- Badge for Wind Speed -->
                           <div style="position: absolute; bottom: -8px; right: -8px; background: white; border-radius: 8px; padding: 2px 6px; font-size: 10px; font-weight: 900; color: ${color}; box-shadow: 0 4px 8px rgba(0,0,0,0.2); z-index: 12; border: 1px solid ${color}20;">
                             ${windSpd}m/s
                           </div>
                         </div>`,
                                    iconSize: [size, size],
                                    iconAnchor: [size / 2, size / 2]
                                })}
                                eventHandlers={{ click: () => setSelectedLoc(loc) }}
                            />
                        );
                    })}

                    {/* Sea Trip Markers */}
                    {seaTripData?.regions?.map(region => {
                        const today = region.forecast && region.forecast[0];
                        if (!today) return null;

                        const color = today.index === '좋음' ? COLORS.good :
                            today.index === '보통' ? COLORS.moderate :
                                today.index === '나쁨' ? COLORS.unhealthy : COLORS.hazardous;

                        const size = 48;

                        return (
                            <Marker
                                key={region.code}
                                position={[region.lat, region.lng]}
                                icon={L.divIcon({
                                    className: 'sea-trip-marker',
                                    html: `<div style="position: relative; width: ${size}px; height: ${size}px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                                             <div style="background-color: ${color}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; shadow-xl border: 3px solid white;">
                                               <div style="width: 20px; height: 20px; color: white;">
                                                 <svg viewBox="0 0 24 24" fill="currentColor">
                                                   <path d="M1.635 15.424c-.664 2.658 1.343 5.376 4.07 5.513l.366.019c.67.018 1.332.1 1.956.242l.533.122a2.051 2.051 0 0 1 1.547 2.007v.46a.5.5 0 0 0 1 0v-.46a2.053 2.053 0 0 1 1.544-2.006l.519-.119c.642-.147 1.32-.232 2.007-.25l.343-.01c2.75-.072 4.823-2.73 4.238-5.412l-.938-4.22A1.5 1 0 0 0 17.356 10H6.644a1.5 1.5 0 0 0-1.464 1.171l-.545 2.454V12.5a1.5 1.5 0 0 0-3 0v2.924zM12 2a1 1 0 0 1 .993.883L13 3v7h-2V3a1 1 0 0 1 1-1z"/>
                                                   <path d="M3 13.5a.5.5 0 0 1 .5-.5h17a.5.5 0 0 1 0 1h-17a.5.5 0 0 1-.5-.5z" opacity="0.5"/>
                                                 </svg>
                                               </div>
                                             </div>
                                             <div style="position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%); background: white; padding: 2px 6px; border-radius: 8px; font-size: 8px; font-weight: 800; color: ${color}; white-space: nowrap; shadow-md border: 1px solid ${color}30;">
                                               ${region.name}
                                             </div>
                                             <div style="position: absolute; top: -5px; right: -5px; background: ${color}; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 900; color: white; border: 2px solid white;">
                                                ${today.score}
                                             </div>
                                           </div>`,
                                    iconSize: [size, size],
                                    iconAnchor: [size / 2, size / 2]
                                })}
                            />
                        );
                    })}
                </MapContainer>
            </div>
            {/* Bottom Card for Selected Location in Map */}
            <div className="p-6 pb-32">
                <div className="glass-card glass-border rounded-[2rem] p-6 shadow-2xl flex items-center justify-between transition-all hover:bg-white/10 active:scale-95">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-black text-white">{selectedLoc.name}</h3>
                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/40 font-bold uppercase tracking-wider">Focus</span>
                        </div>
                        <p className="text-white/60 text-xs">{currentData?.temp}°C · {weatherLabel} · 풍속 {currentData?.windSpeed}m/s</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className={`text-2xl font-black p-3 rounded-2xl glass-premium glass-border`} style={{ color: mainStatus.color }}>
                            {mainStatus.text}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
