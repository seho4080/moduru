# exec

- 본 폴더는 **포팅 매뉴얼 제출용**입니다. (폴더명 규정: `exec`)
- 소스코드는 포함하지 않았으며, 실행/배포/시연에 필요한 문서 및 DB 덤프를 제공합니다.

## 구성
```
exec/
├── 01_build_deploy.md
├── 02_external_services.md
├── 03_db_dump/
│   ├── README.md
│   └── mydb_20250817.sql            # 자리표시자(빈 파일) — 최신본으로 교체 제출
├── 04_scenarios.md
├── env/
│   └── .env.example
└── erd/
    └── ERD.png                     # ERD 이미지 첨부 위치(자리표시자)
```

프로젝트 구조

## 사용 순서
1. `01_build_deploy.md`를 따라 환경 준비 및 배포
2. `02_external_services.md`를 보고 외부 서비스 키 발급/설정
3. `03_db_dump/`에 최신 DB 덤프 파일 교체 (이 문서의 예시 파일명 권장)
4. `04_scenarios.md` 흐름대로 시연


--- 
# ***BACK*** 

#  여행 일정 계획 서비스 - Backend 아키텍처 개요

##  사용 기술 스택
- **언어 및 프레임워크**
  - Java 17
  - Spring Boot 3.1.6
  - Spring Web / Spring MVC
  - Spring Data JPA + QueryDSL
  - Spring Security + JWT
  - Spring WebSocket (STOMP + SockJS)

- **데이터베이스 및 스토리지**
  - PostgreSQL (메인 DB)
  - Redis (Pub/Sub, Cache, 분산락)
  - Elasticsearch (장소 검색 인덱싱)
  - Docker Compose (DB, Redis, Elasticsearch 환경 통합 관리)

- **기타**
  - Lombok (보일러플레이트 최소화)
  - Swagger (Springdoc OpenAPI3) - API 문서화
  - GlobalExceptionHandler - 일관된 예외 처리
  - Gradle 기반 빌드

---

##  주요 도메인 & 기능

### 1. 여행 일정 관리 (Schedule)
- **Draft 저장 (Redis 기반)**
  - 사용자가 일정 수정 시 RDB 대신 Redis에 임시 저장
  - `draftVersion` 으로 충돌 관리 → 여러 사용자가 동시에 수정 가능
- **Commit 반영 (RDB 저장)**
  - 일정 확정 시 PostgreSQL에 저장
  - 불일치(draftVersion mismatch) 시 409(CONFLICT) 반환 및 최신 일정 동기화
- **AI 추천 일정 연동**
  - FastAPI 기반 AI 서버 호출 → 추천 일정(Route + Place) 수신
  - 응답을 DTO(`AiScheduleResult`)로 변환 후 Redis/WebSocket을 통해 브로드캐스트

---

### 2. 여행 경로 관리 (Route)
- **AI 경로 추천**
  - AI 서버에 요청 (출발지, 후보지, 선호도 등 전달)
  - 응답받은 경로(Route + 이동수단 + 소요시간) → Redis 저장
- **실시간 경로 진행 상태**
  - `AiRoutePublisher` → RedisPublisher → 특정 채널 발행
  - `AiRouteSubscriber` → Redis 구독 후 WebSocket 브로드캐스트
- **교통수단/이동시간 처리**
  - `AiRouteResult` DTO 내 `transport`, `nextTravelTime` 관리
  - 프론트에서 UI 렌더링 시 활용

---

### 3. 장소 관리 (Place)
- **장소 검색**
  - Elasticsearch에 인덱싱된 관광지/명소 데이터 기반
  - 키워드 + 카테고리 + 위치 기반 필터링
- **원하는 장소 등록/삭제**
  - `WantPlace` 엔티티로 RDB 관리
  - Redis Pub/Sub을 통해 다른 참여자 화면에도 반영
- **투표 기능**
  - 특정 장소에 대해 투표/취소 이벤트 발생
  - Redis Pub/Sub 채널 예시:  
    - `place:vote:add:{roomId}`  
    - `place:vote:remove:{roomId}`

---

### 4. 사용자 & 방 관리 (User / Room)
- **회원 인증**
  - Spring Security + JWT 기반
  - 로그인 성공 시 Access Token 발급
  - WebSocket 인증은 쿠키 기반 JWT로 전달
- **여행 방(Room)**
  - 참여자(User)와 관계 매핑
  - 여행 기간, 생성자, 상태(예정/진행/종료)
- **Room 상태 계산**
  - `RoomStatusCalculator` → 현재 날짜 vs 여행 시작일/종료일 비교
  - 상태값: `PRE`(예정/진행), `DONE`(종료)

---

### 5. 실시간 협업 (WebSocket + Redis)
- **아키텍처 흐름**
  1. 사용자가 일정 수정 → 서버에서 Redis Publisher에 이벤트 발행
  2. Redis Subscriber가 해당 채널 수신
  3. WebSocket Controller를 통해 연결된 클라이언트에 브로드캐스트
- **채널 구조 (예시)**
  - `schedule:edit:{roomId}`
  - `schedule:commit:{roomId}`
  - `route:status:{roomId}`
  - `place:want:add:{roomId}`
  - `place:want:remove:{roomId}`
- **분산 락 처리**
  - `RedisRoomLockService` 사용
  - `ai:schedule:lock:{roomId}`  
  - `ai:route:lock:{roomId}:{day}`
  - 일정/경로 AI 호출 시 동시 요청 방지

---

##  전체 데이터 흐름

1. **사용자 요청**
   - REST API (일정 조회/저장/검색 등)
   - WebSocket (실시간 반영 이벤트)

2. **일정 수정**
   - Redis에 Draft 저장
   - Redis Pub/Sub 이벤트 발생
   - 다른 클라이언트에서 WebSocket으로 즉시 반영

3. **일정 확정**
   - Draft → PostgreSQL Commit
   - 버전 검증 실패 시 최신 일정 반환

4. **검색 기능**
   - Elasticsearch에서 장소 데이터 조회
   - RDB와 조합해 상세정보 제공

5. **AI 추천**
   - Spring → FastAPI(AI 서버) 요청
   - AI 서버 → 추천 결과(JSON) 반환
   - Redis + WebSocket을 통해 참여자에게 공유

---

## 예시 클래스 구조

- `AiSchedulePublisherImpl` : AI 일정 상태 → Redis 브로드캐스트
- `AiRoutePublisherImpl` : AI 경로 상태 → Redis 브로드캐스트
- `RedisRoomLockService` : 분산락 처리
- `GlobalExceptionHandler` : 일관된 예외 응답 처리
- `ScheduleService` : 일정 비즈니스 로직
- `WantPlaceRepository` : 장소 선호도/투표 관리
- `UserServiceImpl` : 사용자/여행방 조회 및 상태 반환

---

## 요약
이 서비스는 **Redis Pub/Sub + WebSocket**을 통해 실시간 협업을 제공하고,  
**RDB(PostgreSQL)**와 **Elasticsearch**를 조합해 장소 검색 및 데이터 저장을 최적화하며,  
**FastAPI 서버**와의 연동으로 **추천 일정·경로**를 생성하는 **하이브리드 아키텍처**이다.

# ***FRONT***
1. 지도 연동 & 실시간 협업
- 카카오 맵 JavaScript 키 연결하여 지도 표시 및 초기 로딩 최적화
- 실시간 협업 시각화 : 핀, 경로, 일정 변경 사항이 지동에 즉시 반영됨

2. WebSocket(STOMP)기반 실시간 동기화
- 백엔드와 프론트 연결
- 공유 데이터 채널 : 일정 추천, 경로 추천, 일정 편집, 여행 희망 장소, 장소 투표 데이터
- 데이터 흐름
    - 1. 사용자 행동 발생 → Publisher 컴포넌트가 이벤트 감지
    - 2. Publisher → Redis에 메시지 발행
    - 3. Redis → Subscriber로 전달
    - 4. Subscriber → 데이터 가공
    - 5. Subscriber → WebSocket(STOMP) 통해 모든 사용자 화면으로 전달


3. Redux 상태 관리
- 여행 방 정보: tripRoomSlice, tripMemberSlice
- 친구 목록: friendSlice
- 지도 관련 데이터: mapSlice, pinSlice, etaSlice
- AI 추천: aiScheduleSlice, aiRouteSlice
- 일정 관리: itinerarySlice, scheduleDraftSlice
- 장소/투표: wishPlaceSlice, likedPlaceSlice, sharedPlaceSlice, placeVoteSlice
- 사용자/공통 UI: userSlice, uiSlice

4. UI/UX
- css, Tailwind CSS : 반응형 레이아웃 및 일관된 디자인 적용
- 컴포넌트 구조(FSD) :
    - features/도메인 단위로 ui/, model/, lib/ 분리
    - 재사용 가능한 카드, 패널, 모달 컴포넌트 활용

5. 프로젝트 환경 & 기술 스택
- React 18, Redux Toolkit, Vite
- Axios: API 호출 관리

6. 라우팅 구조 
- react-router-dom 활용
- 로그인 여부/권한에 따른 접근 제어 (예: 여행방 페이지 접근 시 로그인 필요)
- 동적 파라미터 라우팅 (예: /rooms/:roomId)

# ***인프라***

## 1) 개요
- 배포 대상: AWS EC2 (Ubuntu)
- 런타임: Docker Compose
- 역할 요약: Nginx(리버스 프록시/SSL) → Front(정적) / Backend(API 및 웹소켓) / Node(Webhook) / LiveKit(SFU)
- 상태 저장: Redis
- 데이터베이스: PostgreSQL (도커 볼륨), elastic search

## 2) 구성요소
- Nginx: 80, 443 종단. 정적 파일 서빙과 리버스 프록시 담당
- Front: React/Vite 빌드 산출물. Nginx로 배포
- Backend: Spring Boot 기반 API와 STOMP/SockJS 웹소켓
- Node(Webhook): LiveKit Webhook 수신 및 처리
- LiveKit: SFU 미디어 라우팅 및 세션·시그널링 관리, STUN 연동
- Redis: 세션, 큐, 실시간 상태
- PostgreSQL: 서비스 데이터 저장.

## 3) 네트워크와 포트
- 외부 공개: 80, 443(Nginx), 7881(TCP, LiveKit), 7882(UDP, LiveKit), 30000–30010(UDP, LiveKit 미디어)
- 내부 전용: 8080(Backend), 4000(Node Webhook), 6379(Redis), 5432(PostgreSQL)
- DNS: 서비스 도메인을 EC2 공인 IP에 매핑

## 4) 라우팅 규칙
- 루트 경로: 프런트 정적 페이지
- /api/: Backend API
- /ws-stomp/: Backend 웹소켓(STOMP/SockJS)
- /livekit/: Node(Webhook) 엔드포인트

## 5) 환경 변수와 시크릿 (항목 이름만)
- 공통: DOMAIN, PUBLIC_IP
- Backend: SPRING_PROFILES_ACTIVE, SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME, SPRING_DATASOURCE_PASSWORD, REDIS_HOST, REDIS_PORT, JWT_SECRET
- DB: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- LiveKit: LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_PUBLIC_IP, LIVEKIT_STUN_URIS, LIVEKIT_TURN_URIS, LIVEKIT_TURN_USERNAME, LIVEKIT_TURN_PASSWORD
- Webhook: WEBHOOK_SECRET, WEBHOOK_URL

## 6) 배포 절차(요약)
1. 도메인 DNS를 EC2 공인 IP로 설정
2. SSL 인증서 발급 및 적용
3. Docker 이미지 준비 후 Compose로 기동
4. 프런트 빌드 산출물을 Nginx 정적 경로에 배치
5. 헬스체크 및 외부 접근 테스트

## 7) 운영과 업데이트
- 버전 태깅 전략 수립(고정 태그 사용 권장, 롤백 용이성 확보)
- 컨테이너 재기동 중심 반영. 완전 무중단이 필요하면 다중 인스턴스 또는 L4 고려
- 로그 모니터링: Nginx, Backend, Node, LiveKit, Redis
- 헬스체크: Backend 상태 엔드포인트, LiveKit 콘솔·Webhook 이벤트

## 8) 데이터베이스 운용
- 운영: EC2 로컬 PostgreSQL 사용, 외부 노출 차단
- 백업과 복원: 표준 pg_dump
- 개발 초기화 스크립트 사용 희망시 볼륨 초기화가 필요할 수 있음

## 9) LiveKit 메모
- 역할: SFU와 시그널링·세션 관리
- 필수 개방 포트: 7881(TCP), 7882(UDP), 30000–30010(UDP)
- STUN: TURN 서버가 없으니 네트워크 연결에 유의
- Webhook: 운영 환경에서는 서명 또는 토큰 검증 적용, 끊겼을 때 이벤트

## 10) 보안 체크리스트
- 환경 변수와 시크릿은 저장소에 커밋하지 않기. 접근 권한 최소화
- SSL 인증서 자동 갱신 설정
- 보안 그룹: DB, Redis 등 내부 포트는 외부 차단
- CORS와 쿠키 설정 점검(SameSite=None, Secure 등)
- Spring security config 메일 발송부분 확인
- Webhook 서명 검증 및 재시도 정책

## 11) 트러블슈팅 힌트
- 401 인증 문제: 쿠키 도메인 및 보안 옵션, 프록시 헤더, HTTPS 강제 여부 점검
- 404 경로 문제: Nginx 라우팅 규칙과 Backend 컨트롤러 매핑 확인
- 웹소켓 끊김/유실: 프런트 재연결 로직, 메시지 큐잉, 백엔드 스레드풀·타임아웃 조정, 프록시 업그레이드 헤더
- 미디어 연결 불안정: TURN 도입 해야함... 방화벽 및 NAT 설정 재검토 해야함...
