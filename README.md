# 🍃 제주바람 (Jeju AirGuide)

<p align="center">
  <img src="public/icons/icon-192x192.png" alt="제주바람 로고" width="120" />
</p>

<p align="center">
  <strong>실시간 데이터 기반 제주 맞춤형 기상 및 여행 분석 대시보드</strong>
</p>

<p align="center">
  <a href="https://jair-guide.web.app">🌐 라이브 데모</a> •
  <a href="#-주요-기능">기능 소개</a> •
  <a href="#-기술-스택">기술 스택</a> •
  <a href="#-시작하기">시작하기</a>
</p>

---

## 📱 소개

**제주바람**은 제주도 여행자와 거주자를 위한 올인원 정보 플랫폼입니다. 실시간 공기질, 날씨, CCTV 영상, 낚시 물때, 항공편 정보 등을 한 곳에서 확인할 수 있습니다.

> 💡 PWA(Progressive Web App)로 제작되어 모바일에서 앱처럼 설치하여 사용할 수 있습니다.

---

## 🌟 주요 기능

### 🏠 홈 대시보드
- **실시간 날씨 정보**: 현재 위치 기반 온도, 체감온도, 습도, 풍속
- **공기질 모니터링**: PM10, PM2.5 미세먼지 수치 및 등급 표시
- **공항 날씨**: 제주국제공항 실시간 기상 데이터
- **해상 여행 지수**: 바다 여행 적합도 분석

### 🗺️ 인터랙티브 공기질 맵
- 제주 전역 대기질 측정소 마커 시각화
- 위성 지도 / 일반 지도 전환
- 실시간 항공기 추적 (OpenSky Network)
- 기상 레이더 오버레이

### 📹 실시간 CCTV (25개+)
- **한라산**: 백록담, 왕관릉, 윗세오름, 어승생악, 1100도로, 관음사, 절물자연휴양림
- **해수욕장**: 함덕, 협재, 중문, 이호테우, 월정리, 김녕, 삼양, 탑동해안도로
- **주요명소**: 성산일출봉, 제주국제공항, 섭지코지, 천지연폭포, 쇠소깍
- **항구/도로**: 모슬포항, 추자도 예초항, 평화로
- HLS 프록시를 통한 모바일 지원

### � 낚시 정보
- **8물때 계산**: 제주 전통 물때(1물~8물) 자동 계산
- **조석 예보**: 고조/저조 시간 및 조위
- **낚시 지수**: 날씨, 물때, 조류 등 종합 분석
- **포인트별 정보**: 주요 낚시 포인트 추천

### ✈️ 실시간 항공기 추적
- 제주 상공 비행 중인 항공기 위치 표시
- 편명, 고도, 속도 정보
- 실시간 업데이트

### ⚙️ 설정 & 테마
- 다크/라이트 모드 전환
- 다양한 그라데이션 테마
- PWA 설치 지원

---

## 🛠️ 기술 스택

### Frontend
| 기술 | 용도 |
|------|------|
| **React 18** | UI 프레임워크 |
| **Vite** | 빌드 도구 |
| **Framer Motion** | 애니메이션 |
| **Leaflet** | 인터랙티브 맵 |
| **HLS.js** | CCTV 스트리밍 재생 |

### Backend
| 기술 | 용도 |
|------|------|
| **Firebase Cloud Functions** | 서버리스 API |
| **Firebase Hosting** | 정적 호스팅 |
| **Node.js** | 백엔드 런타임 |

### 외부 API
| API | 용도 |
|-----|------|
| **기상청 (KMA)** | 날씨, 예보 데이터 |
| **한국환경공단 (AirKorea)** | 대기질 데이터 |
| **국립해양조사원** | 조석 예보, 해양 지수 |
| **OpenSky Network** | 항공기 추적 |
| **제주도 재난안전본부** | CCTV 스트림 |

---

## 📂 프로젝트 구조

```
airguide/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── HomeTab.jsx      # 홈 대시보드
│   │   ├── MapTab.jsx       # 공기질 지도
│   │   ├── CctvTab.jsx      # CCTV 뷰어
│   │   ├── FishingTab.jsx   # 낚시 정보
│   │   └── SettingsTab.jsx  # 설정
│   ├── App.jsx              # 메인 앱
│   └── main.jsx             # 엔트리 포인트
├── functions/               # Firebase Cloud Functions
│   └── index.js             # API 프록시 함수들
├── public/                  # 정적 파일
└── vite.config.js           # Vite 설정
```

---

## 🚀 시작하기

### 사전 요구사항
- Node.js 18+
- npm 또는 yarn
- Firebase CLI

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-username/airguide.git
cd airguide

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 환경 변수 설정

`.env` 파일을 생성하고 필요한 API 키를 설정합니다:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

### 배포

```bash
# 프론트엔드 빌드 및 배포
npm run deploy

# Cloud Functions 배포
cd functions && npm run deploy
```

---

## 📡 Cloud Functions

| 함수명 | 용도 |
|--------|------|
| `getKmaWeather` | 기상청 날씨 데이터 |
| `getAirKoreaQuality` | 대기질 데이터 |
| `getJejuAirportWeather` | 공항 기상 데이터 |
| `getSeaTripIndex` | 바다여행 지수 |
| `getSeaFishingIndex` | 낚시 지수 |
| `getJejuTide` | 조석 예보 |
| `getJejuFlights` | 실시간 항공기 |
| `hlsProxy` | CCTV HLS 프록시 |

---

## 📱 PWA 지원

제주바람은 PWA로 제작되어 다음과 같이 설치할 수 있습니다:

### Android / Chrome
1. 사이트 접속 후 "홈 화면에 추가" 팝업 클릭
2. 또는 브라우저 메뉴 → "앱 설치"

### iOS / Safari
1. 사이트 접속
2. 공유 버튼 탭
3. "홈 화면에 추가" 선택

---

## 🔮 로드맵

- [x] 실시간 날씨 & 공기질
- [x] 인터랙티브 지도
- [x] 낚시 물때 계산
- [x] 실시간 CCTV (25개+)
- [x] 모바일 HLS 프록시
- [ ] CCTV 지도 뷰
- [ ] 선박/페리 운항 정보
- [ ] 일출/일몰 시간 & 추천 스팟
- [ ] 실시간 도로 교통 정보
- [ ] 즐겨찾기 & 푸시 알림
- [ ] 해수욕장 혼잡도

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

## 🙏 크레딧

- 기상 데이터: [기상청](https://www.weather.go.kr/)
- 대기질 데이터: [에어코리아](https://www.airkorea.or.kr/)
- 해양 데이터: [국립해양조사원](https://www.khoa.go.kr/)
- 항공기 데이터: [OpenSky Network](https://opensky-network.org/)
- CCTV: [제주특별자치도 재난안전본부](https://www.jeju.go.kr/)

---

<p align="center">
  Made with ❤️ for Jeju Island
</p>