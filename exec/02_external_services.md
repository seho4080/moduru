항상 세부 정보 표시
# Write the current canvas content to a Markdown file
content = """# 프로젝트 외부 서비스 정리

## 1) Kakao Developers
- **용도**: 장소 검색(Local), 지도(JS SDK)
- **키 종류**: REST API 키, JavaScript 키
- **콘솔 경로**: https://developers.kakao.com
- **필수 설정**
  - 앱 생성 → 플랫폼에 웹 도메인 등록 (예: https://moduru.co.kr)
  - 로컬/개발/운영 도메인 각각 등록
- **환경변수**
  - `KAKAO_API_KEY` (REST)
  - `VITE_KAKAO_JS_KEY` (JS)

---

## 2) 메일 발송 (Gmail SMTP 또는 대체 서비스)
- **용도**: 인증번호/알림 메일
- **환경변수**
  - `MAIL_HOST=smtp.gmail.com`
  - `MAIL_PORT=587`
  - `MAIL_USERNAME`, `MAIL_PASSWORD` (앱 비밀번호)
  - `MAIL_FROM`
- **주의**
  - 학교/기관 방화벽, 차단 정책 고려
  - Gmail 정책 변경 시 SendGrid 등 대체 권장

---

## 3) Google Places / Maps Platform
- **용도**: 장소 자동완성(Autocomplete), 장소 상세(Place Details), 사진(Place Photos), 텍스트/주변 검색(Text/Nearby Search), 지도(JS)
- **키 전략(권장)**: **프론트용 Browser 키**와 **백엔드용 Server 키**를 분리
  - Browser 키: *HTTP referrer* 제한(도메인 화이트리스트)
  - Server 키: *IP 주소* 제한(백엔드 서버 고정 IP) 또는 프록시 통해 호출
- **콘솔 경로**: Google Cloud Console → Maps Platform(자격 증명/결제/사용량)
- **필수 설정 순서**
  1. API 사용 설정(필요한 것만 켜기)
     - **Places API** (Details/Photos/Search/Autocomplete)
     - **Maps JavaScript API** (브라우저 지도/Autocomplete 위젯)
     - 선택: **Geocoding API**(좌표↔주소), **Directions API**(경로), **Geolocation API** 등
  2. API 키 2개 생성(브라우저/서버) → **Key restriction** 적용
     - Browser 키: *Application restrictions = HTTP referrers* → `https://moduru.co.kr/*`, `http://localhost:5173/*` 등
     - Server 키: *Application restrictions = IP addresses* → 백엔드 서버 퍼블릭 IP
     - API restrictions: 필요한 API만 선택(Places, Maps JS 등)
- **환경변수(예시)**
  - 프론트(Vite): `VITE_GOOGLE_MAPS_API_KEY`
  - 백엔드: `GOOGLE_PLACES_API_KEY`
  - (선택) `GOOGLE_MAPS_TIMEOUT_MS`, `GOOGLE_MAPS_LANGUAGE=ko`, `GOOGLE_MAPS_REGION=KR`
- **호출 예시(백엔드)**
  - Autocomplete(JSON):
    - `GET https://maps.googleapis.com/maps/api/place/autocomplete/json?input=카페&language=ko&region=KR&key=$GOOGLE_PLACES_API_KEY`
  - Place Details(JSON):
    - `GET https://maps.googleapis.com/maps/api/place/details/json?place_id={PLACE_ID}&language=ko&key=$GOOGLE_PLACES_API_KEY`
  - Place Photo(redirect):
    - `GET https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference={PHOTO_REF}&key=$GOOGLE_PLACES_API_KEY`
- **프론트(JS SDK) 사용**
  - Maps JS 로더로 키 주입 → Autocomplete 위젯(또는 Places Library) 사용
  - 도메인/서브도메인별 referrer 등록 필수
- **주의 사항**
  - **요금/쿼터**: Maps Platform은 결제 계정 필수. 사용량/비용은 콘솔에서 모니터링(알림 설정 권장)
  - **데이터 정책**: Places 응답 데이터의 **저장/캐시**에 제한이 있음(필드별 보관 가능 여부 상이) → 상업적 이용/보관 시 **Terms 확인**
  - **현지화**: `language=ko`, `region=KR` 파라미터로 한국어/한국 기준 결과 우선화
  - **리트라이/쿨다운**: QPS 초과/429 대비 지수 백오프

---

## 4) WebRTC (STUN/TURN – Google STUN)
- **용도**: ICE 후보 수집(클라이언트의 공인 IP/포트 탐지). **STUN은 릴레이가 아님** → P2P가 실패하면 **TURN** 필요.
- **권장 구성**: Google STUN은 개발/보조용으로 활용.
- **Google 공개 STUN 목록**
  - `stun:stun.l.google.com:19302`
  - `stun:stun1.l.google.com:19302`
  - `stun:stun2.l.google.com:19302`
  - `stun:stun3.l.google.com:19302`
  - `stun:stun4.l.google.com:19302`
- **환경변수(예시)**
  - 프론트(Vite): `VITE_WEBRTC_STUNS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302`
  - 백엔드/토큰서버(선택): `WEBRTC_STUNS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302`
- **클라이언트 구성 예시(JS)**
```js
"stun:stun.l.google.com:19302"