import json
import os
import time
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_FILE = os.path.join(BASE_DIR, "raw", "vk_spot_links.json")
SAVE_PATH = os.path.join(BASE_DIR, "raw", "vk_spot_data.json")

# ───────────────────────────────────────────────
# 1. 크롬 드라이버 설정
options = Options()
# options.add_argument("--headless")  # 필요 시 해제
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
driver = webdriver.Chrome(service=Service(), options=options)


# ───────────────────────────────────────────────
# 2. 유틸 함수
def get_text_or_none(tag):
    return tag.get_text(strip=True) if tag else None


def extract_images(soup):
    images = []
    for img in soup.select("div.photo_gallery div.swiper-slide img"):
        src = img.get("src") or img.get("data-src")
        if src and src.startswith("http"):
            images.append(src)
    return images


def extract_description(soup):
    desc = soup.select_one("div.wrap_contView > div.area_txtView.top p")
    return get_text_or_none(desc)


def extract_description_short(soup):
    tag = soup.select_one("div#topCp h3 em")
    return get_text_or_none(tag)


def extract_tags(soup):
    tags = []
    for span in soup.select("div.tag_cont span"):
        text = span.get_text(strip=True)
        if text.startswith("#"):
            text = text[1:]
        if text:
            tags.append(text)
    return tags


def extract_detail_info_for_spot(soup):
    info = {
        "info_center": None,
        "homepage": None,
        "address": None,
        "business_hours": None,
        "rest_date": None,
        "parking": None,
        "price": None,
    }

    parking_text = None
    parking_fee = None

    for li in soup.select("div#detailinfoview ul li"):
        strong = li.find("strong")
        spans = li.find_all("span")
        if not strong or not spans:
            continue

        label = strong.text.strip()
        values = [span.get_text(strip=True) for span in spans if span.text.strip()]

        if "문의" in label:
            info["info_center"] = values[-1]
        elif "홈페이지" in label:
            homepage = li.find("a")
            if homepage:
                info["homepage"] = homepage["href"]
        elif "주소" in label:
            info["address"] = values[0]
        elif "이용시간" in label or "관람시간" in label:
            info["business_hours"] = "\n".join(values)
        elif "휴일" in label:
            info["rest_date"] = values[0]
        elif label == "주차":
            parking_text = values[0]
        elif "주차 요금" in label:
            parking_fee = values[0]
        elif "입장료" in label or "이용요금" in label:
            info["price"] = "\n".join(values)

    if parking_text and parking_fee:
        info["parking"] = f"{parking_text}\n{parking_fee}"
    elif parking_text:
        info["parking"] = parking_text
    elif parking_fee:
        info["parking"] = parking_fee

    return info


def crawl_spot(entry):
    url = entry["link"]
    name = entry.get("name", None)

    try:
        driver.get(url)
        time.sleep(0.5)  # JS 렌더링 대기
        soup = BeautifulSoup(driver.page_source, "html.parser")

        images = extract_images(soup)
        description = extract_description(soup)
        description_short = extract_description_short(soup)
        tags = extract_tags(soup)
        detail_info = extract_detail_info_for_spot(soup)

        return {
            "name": name,
            "link": url,
            "description": description,
            "description_short": description_short,
            "description_vector": None,
            "info_center": detail_info["info_center"],
            "homepage": detail_info["homepage"],
            "address": detail_info["address"],
            "business_hours": detail_info["business_hours"],
            "rest_date": detail_info["rest_date"],
            "parking": detail_info["parking"],
            "price": detail_info["price"],
            "images": images,
            "tags": tags,
        }

    except Exception as e:
        print(f"크롤링 실패: {url} - {e}")
        return None


# ───────────────────────────────────────────────
# 3. 기존 결과 불러오기 (중복 검사용)
if os.path.exists(SAVE_PATH):
    with open(SAVE_PATH, "r", encoding="utf-8") as f:
        existing_data = json.load(f)
else:
    existing_data = []

existing_links = set(item["link"] for item in existing_data if "link" in item)

# ───────────────────────────────────────────────
# 4. 링크 파일 읽기
with open(JSON_FILE, "r", encoding="utf-8") as f:
    links = json.load(f)

# ───────────────────────────────────────────────
# 5. 크롤링 시작
for i, entry in enumerate(links):
    if entry["link"] in existing_links:
        print(f"[{i + 1}/{len(links)}] 이미 수집됨: {entry['link']}")
        continue

    print(f"[{i + 1}/{len(links)}] 수집 중: {entry['link']}")
    result = crawl_spot(entry)

    if result:
        existing_data.append(result)
        existing_links.add(entry["link"])
        with open(SAVE_PATH, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=2)
        print(f"저장 완료: {entry['link']}")
    else:
        print(f"수집 실패: {entry['link']}")

driver.quit()
