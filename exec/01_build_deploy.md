# 포팅 매뉴얼 (Build & Deploy Guide)

> 제출 규정: 폴더명을 반드시 **`exec`** 로 제출합니다. 소스코드는 별도 업로드 불필요.

## 0) 개요
- 프로젝트명: **Moduru (여행 동행/일정 서비스)**  
- 백엔드: Spring Boot (Java 17), Gradle, STOMP(WebSocket)
- 프론트엔드: React (Vite)
- 인프라: Docker / Docker Compose / Nginx
- 데이터베이스: PostgreSQL 16 (+ pgvector)
- 캐시/세션: Redis 7
- 검색: Elasticsearch 8.x (선택)
- AI/추천: FastAPI (Python 3.10) — Kakao Local API 활용
- 음성통화: LiveKit (SFU) — WebRTC

※ 괄호 안 버전은 실제 배포에 사용한 예시입니다. **귀 기관 환경에 맞게 버전 대체 가능**하며, 아래 “필수 버전/설정” 표를 우선합니다.

---

## 1) 사용 제품 및 버전/설정 (IDE 포함)

| 구분 | 제품(예시) | 필수/권장 버전 | 핵심 설정 |
|---|---|---|---|
| JDK | Temurin/OpenJDK | **17** (필수) | JAVA_HOME 설정 |
| IDE | IntelliJ IDEA / VSCode | 2024.x 이상 (권장) | Lombok 플러그인 사용 |
| 프론트 | Node.js (npm/pnpm) | LTS **20.x** | Vite 빌드 |
| 웹서버 | **Nginx** | 1.25+ | `/` 정적, `/api`와 `/ws-stomp` 프록시 |
| WAS | Spring Boot 내장 Tomcat | 3.x 계열 | `server.port=8080` |
| DB | **PostgreSQL 16**, pgvector | 16.x | 확장 `CREATE EXTENSION vector;` |
| 캐시 | **Redis** | 7.2+ | 세션/레이트리밋 캐시 |
| 검색 | Elasticsearch | 8.x (선택) | 보안/계정 설정 필요 시 `.env` 참조 |
| AI | FastAPI | 0.11x | `KAKAO_API_KEY` 필요 |
| RTC | LiveKit (Cloud/On‑prem) | 최신 | `LIVEKIT_URL`, `LIVEKIT_KEY/SECRET` |

---

## 2) 빌드 시 사용되는 환경변수 (예시 값은 변경 요망)

### 공통 `.env` 예시 (루트 또는 compose와 동일 경로)
```
# ===== Backend (Spring) =====
SPRING_PROFILES_ACTIVE=prod
DB_HOST=postgres
DB_PORT=5432
DB_NAME=mydb
DB_USER=postgres
DB_PASSWORD=ssafy
REDIS_HOST=redis
REDIS_PORT=6379
ES_HOST=elasticsearch
ES_PORT=9200
ES_USERNAME=elastic
ES_PASSWORD=changeme
JWT_SECRET=replace_with_strong_secret
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_gmail_account@gmail.com
MAIL_PASSWORD=app_password
MAIL_FROM=Moduru <your_gmail_account@gmail.com>

# ===== Frontend (Vite) =====
VITE_API_BASE=https://moduru.co.kr/api
VITE_WS_BASE=wss://moduru.co.kr/ws-stomp
VITE_KAKAO_JS_KEY=Kakao_Javascript_Key

# ===== AI Server (FastAPI) =====
AI_PORT=8000
KAKAO_API_KEY=Kakao_REST_API_Key
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=mydb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=ssafy

# ===== LiveKit =====
LIVEKIT_URL=wss://your-livekit-host
LIVEKIT_API_KEY=xxxx
LIVEKIT_API_SECRET=yyyy
```

> 실제 제출 시 민감정보는 빈 값/더미 값으로 제공하고, 운영 값은 별도 전달하세요.

---

## 3) 소스 클론 후 빌드/배포 절차

### A. 의존 SW 설치 (로컬/서버)
- Docker 26+, Docker Compose v2 이상
- (선택) JDK 17, Node 20 — 도커로 빌드하는 경우 생략 가능

### B. GitLab 소스 클론
```
git clone <your-repo-url> project
cd project
```

### C. Docker Compose 배포 (권장)
1. `.env` 파일을 루트에 준비 (`exec/env/.env.example` 참고).  
2. `docker-compose.yml`(레퍼런스는 아래)과 동일 경로에서 실행:
```
docker compose up -d --build
```
3. 정상 기동 확인
   - Front: https://<HOST>/
   - API: https://<HOST>/api/actuator/health
   - STOMP: wss://<HOST>/ws-stomp
   - AI: https://<HOST>/ai/docs (경로 운영에 맞게)

#### Nginx 리버스 프록시 참고 설정
```
server {
  listen 443 ssl;
  server_name moduru.co.kr;

  # 정적 (프런트 빌드 결과)
  location / { try_files $uri /index.html; }

  # 백엔드 API
  location /api/ {
    proxy_pass http://backend:8080/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 600s;
  }

  # STOMP(WebSocket)
  location /ws-stomp/ {
    proxy_pass http://backend:8080/ws-stomp/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }

  # AI 서버 (선택)
  location /ai/ { proxy_pass http://ai-server:8000/; }
}
```

> **쿠키/인증 주의**: 프런트 axios는 `withCredentials: true` 사용. HTTPS 운영 시 쿠키는 `SameSite=None; Secure` 필요.

### D. 개별 빌드 (도커 미사용 시)

**백엔드**
```
cd back
./gradlew clean build -x test
# 결과: back/build/libs/*.jar
java -jar build/libs/app.jar --spring.profiles.active=prod
```

**프론트엔드**
```
cd front/moduru
npm ci
echo "VITE_API_BASE=https://<HOST>/api" > .env.production
npm run build
# 결과 dist/ → Nginx root에 배포
```

---

## 4) 배포 시 특이사항
- DB 확장: `CREATE EXTENSION IF NOT EXISTS vector;` 후 서비스 시작
- 최초 기동 순서: **DB → Redis → (선택)ES → Backend → Front → AI**
- 환경파일 경로: 컨테이너 기준 `/app/.env` 또는 스프링 `application-prod.yml`(외부화 권장)
- 장애 포인트
  - 401/쿠키: 프런트/백엔드 도메인, HTTPS, SameSite 불일치 확인
  - STOMP 502: Nginx Upgrade/Connection 헤더 누락 여부 확인
  - AI 401: `KAKAO_API_KEY` 과금/레퍼러 제한 확인
- 로그 확인: `docker compose logs -f <service>`

---

## 5) DB 접속 정보 및 프로퍼티 정의 파일 목록
- 접속 예시: `postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>`
- 확장: `vector`
- 주요 프로퍼티 파일(소스 경로 기준, 제출은 **경로만 기술**)
  - `back/src/main/resources/application.yml`
  - `back/src/main/resources/application-prod.yml`
  - `front/moduru/.env*` (빌드 시 사용)
  - `ai-server/.env`

ERD는 `exec/erd/ERD.png` 위치에 첨부해주세요. (본 패키지는 자리표시자만 제공)
