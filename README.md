# 🍃 제주바람 (Jeju AirGuide)
**실시간 데이터 기반 제주 맞춤형 기상 및 여행 분석 대시보드**

제주의 실시간 공기질, 날씨, 낚시 지수, 항공편 추적 등 다양한 정보를 한눈에 확인할 수 있는 프리미엄 웹 애플리케이션입니다.

## 🌟 주요 기능
- **📍 실시간 공기질 & 날씨**: 내 위치 또는 주요 거점별 미세먼지(PM10/2.5) 및 기상 데이터 분석.
- **🗺️ 인터랙티브 맵**: 제주 전역의 기상 상태와 해상 안전 지수를 시각화하여 제공.
- **✈️ 실시간 항공기 추적**: 제주 상공을 비행 중인 항공기의 위치와 편명을 실시간으로 모니터링 (OpenSky API).
- **🎣 전문 낚시 정보**: 포인트별 낚시 지수와 함께 제주 특유의 **8물때(Mool-Dae)** 계산 및 조석 예보 제공.
- **🌊 스마트 물때 계산**: API 키 없이도 동작하는 정교한 음력 기반 물때 로직 탑재.
- **🔋 전기차 충전소**: 제주 내 충전소 통계 및 위치 정보 (준비 중).

## 🛠️ 기술 스택
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion (Animations)
- **Backend**: Firebase Cloud Functions (Node.js)
- **Database**: Firestore (Caching)
- **Maps**: Leaflet (OpenStreetMap, Esri Satellite)

## 📡 데이터 API 연동
- KMA (기상청) 기상 데이터
- AirKorea (한국환경공단) 대기질 데이터
- RainViewer (실시간 기상 레이더 - 선택 사항)
- OpenSky Network (글로벌 항공기 추적)
- 국립해양조사원 (해양 예보 지수)

---
Developed by **Antigravity** (Google DeepMind Coding Agent)
