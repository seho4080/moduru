# 여행지 추천 AI 만들기
> **목표:**  
사용자의 여행 조건을 자연어로 입력받고,  
✅ 정적 여행지 API 기반 데이터 +  
✅ 실시간 웹 검색 결과를 바탕으로  
✅ 무료 LLM으로 3~5개의 여행지를 추천하는 Python 기반 AI 시스템 구축.

&nbsp;

## ✅ 전체 개발 단계 (요약)
1. **여행지 데이터 수집** – 공공 API에서 정제  
2. **사용자 입력 처리** – 자연어 입력 받기  
3. **웹 검색 데이터 수집** – 실시간 크롤링 or 검색 API 활용  
4. **LLM 프롬프트 구성 및 호출**– HuggingFace 무료 모델 활용  
5. **결과 정제 및 출력** – JSON 또는 텍스트로 가공

&nbsp;

## 📦 1단계: 여행지 데이터 수집 (정적 후보군 구축)
### 🔍 사용할 공공 API

| API 이름 | 설명 | 링크 |
|----------|------|------|
| TourAPI 4.0 (한국관광공사) | 전국 여행지, 카테고리, 주소, 위치 정보 제공 | https://api.visitkorea.or.kr |
| Kakao Local API | 장소명, 주소, 좌표 검색 | https://developers.kakao.com |
| Naver Map API | 장소, POI 정보 검색 | https://developers.naver.com |

&nbsp;

✅ 데이터 필드 예시
```json
{
  "title": "서울숲",
  "address": "서울 성동구...",
  "latitude": 37.544,
  "longitude": 127.037,
  "category": "공원",
  "tags": ["자연", "산책", "힐링"]
}
```

&nbsp;

✅ 저장 방식  
CSV 또는 SQLite  
Python에서 검색 가능하게 전처리 (예: 지역 + 테마 필터링)

---

## 🗣️ 2단계: 사용자 입력 받기
```python
user_input = input("여행 조건을 입력하세요: ")
# 예: "서울에서 2박 3일 힐링 여행지 추천해줘"
```

---

## 🌐 3단계: 웹 검색 기반 보강

### 옵션 1 – 간단한 크롤링 (무료)
```python
def search_web(query):
    from bs4 import BeautifulSoup
    import requests
    headers = {"User-Agent": "Mozilla/5.0"}
    url = f"https://www.google.com/search?q={query}"
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.text, "html.parser")
    return soup.get_text()
```

### 옵션 2 – SerpAPI (구글/Bing API)
```bash
GET https://serpapi.com/search.json?q=제주+힐링+여행지&api_key=...
```

---

## 🧠 4단계: LLM 프롬프트 구성 및 호출

### HuggingFace 무료 모델 사용 (예: Mistral, Zephyr 등)
```python
from transformers import pipeline
pipe = pipeline("text-generation", model="mistralai/Mistral-7B-Instruct")

def make_prompt(user_input, places, web_snippets):
    return f"""
사용자 질문: {user_input}

정적 장소:
{places}

웹 검색 요약:
{web_snippets}

→ 위 내용을 바탕으로 여행지 3~5곳을 추천해줘. 장소명과 추천 이유 포함.
"""

prompt = make_prompt(user_input, static_places, search_snippets)
result = pipe(prompt, max_new_tokens=512)
```

---

## 📤 5단계: 결과 정제 및 출력

### 결과 파싱 예시 (간단하게 텍스트 분리)
```python
text = result[0]["generated_text"]
for line in text.split("\n"):
    if line.strip():
        print(line)
```

### JSON 형태 예시
```json
[
  { "name": "서울숲", "reason": "자연 속에서 조용히 산책 가능" },
  { "name": "북촌한옥마을", "reason": "전통 건축과 고요함을 느낄 수 있음" }
]
```
