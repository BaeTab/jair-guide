# Role
너는 시각적 디자인 감각이 뛰어난 시니어 풀스택 리액트 개발자야. 
제주도 서귀포 지역의 실시간 미세먼지 농도를 직관적으로 보여주는 PWA(Progressive Web App)를 만들려고 해.

# Tech Stack
- Framework: React (Vite)
- Styling: Tailwind CSS, Framer Motion (애니메이션)
- Data Source: Open-Meteo Air Quality API (인증키 불필요)
- Target: Firebase Hosting 배포용

# Design Concept (매우 중요)
- '신호등' 컨셉: 미세먼지 농도에 따라 배경색이 전체적으로 부드럽게 변해야 함 (좋음: 푸른색, 보통: 초록색, 나쁨: 주황색, 매우나쁨: 빨간색).
- UI 스타일: Glassmorphism(유리 효과)을 적용한 미니멀한 카드 디자인.
- 폰트: 가독성이 좋은 샌드세리프체 사용.
- 애니메이션: 수치가 변할 때 숫자가 올라가는 효과나 배경색이 페이드 인/아웃되는 효과 추가.

# Core Functions
1. Location: 서귀포시 좌표(위도: 33.25, 경도: 126.56)를 기본값으로 설정.
2. Data Fetching: Open-Meteo API를 사용해 실시간 PM10, PM2.5 지수를 가져옴.
3. Visual Feedback: 수치에 따라 배경색과 상태 메시지(예: "제주의 하늘이 맑아요!", "오늘은 마스크를 챙기세요")를 변경.
4. PWA: 'vite-plugin-pwa'를 사용하여 오프라인에서도 작동하고 스마트폰 홈 화면에 설치 가능하도록 설정.

# Output Requirement
1. `App.jsx` 전체 코드.
2. 미세먼지 수치에 따른 배경색 로직 함수 포함.
3. `manifest` 파일과 서비스 워커 설정이 포함된 PWA 설정 가이드.
4. Tailwind CSS를 활용한 세련된 레이아웃 코드.

"지금 바로 서귀포시를 위한 최고의 미세먼지 웹 앱 코드를 작성해줘."