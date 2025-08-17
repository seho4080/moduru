import json
import os
import time
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, "..", "..", "data", "raw", "vk_restaurant_links.json")
SAVE_PATH = os.path.join(BASE_DIR, "..", "..", "data", "raw", "vk_restaurant_data.json")

# ───────────────────────────────────────────────
# 1. 크롬 드라이버 설정
options = Options()
# options.add_argument("--headless")
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


def extract_detail_info(soup):
    info = {
        "tel": None,
        "homepage": None,
        "address": None,
        "business_hours": None,
        "rest_date": None,
        "parking": None,
        "menus": [],
    }

    for li in soup.select("div#detailinfoview ul li"):
        strong = li.find("strong")
        spans = li.find_all("span")
        if not strong or not spans:
            continue

        label = strong.text.strip()
        values = [span.get_text(strip=True) for span in spans if span.text.strip()]

        if "문의" in label:
            info["tel"] = values[-1]
        elif "홈페이지" in label:
            homepage = li.find("a")
            if homepage:
                info["homepage"] = homepage["href"]
        elif "주소" in label:
            info["address"] = values[0]
        elif "영업시간" in label:
            info["business_hours"] = "\n".join(values)
        elif "휴일" in label:
            info["rest_date"] = values[0]
        elif "주차" in label:
            info["parking"] = values[0]
        elif "대표메뉴" in label or "취급메뉴" in label:
            for val in values:
                info["menus"] += [m.strip() for m in val.split("/") if m.strip()]

    info["menus"] = list(set(info["menus"]))  # 중복 제거
    return info


def crawl_restaurant(entry):
    url = entry["link"]
    name = entry.get("name", None)

    try:
        driver.get(url)
        time.sleep(0.5)
        soup = BeautifulSoup(driver.page_source, "html.parser")

        images = extract_images(soup)
        description = extract_description(soup)
        description_short = extract_description_short(soup)
        tags = extract_tags(soup)
        detail_info = extract_detail_info(soup)

        return {
            "name": name,
            "link": url,
            "description": description,
            "description_short": description_short,
            "description_vector": None,
            "tel": detail_info["tel"],
            "homepage": detail_info["homepage"],
            "address": detail_info["address"],
            "business_hours": detail_info["business_hours"],
            "rest_date": detail_info["rest_date"],
            "parking": detail_info["parking"],
            "menus": detail_info["menus"],
            "images": images,
            "tags": tags,
        }

    except Exception as e:
        print(f"크롤링 실패: {url} - {e}")
        return None


# ───────────────────────────────────────────────
# 3. 기존 데이터 불러오기
if os.path.exists(SAVE_PATH):
    with open(SAVE_PATH, "r", encoding="utf-8") as f:
        existing_data = json.load(f)
else:
    existing_data = []

existing_links = set(item["link"] for item in existing_data if "link" in item)

# ───────────────────────────────────────────────
# 4. 링크 목록 읽기
with open(JSON_PATH, "r", encoding="utf-8") as f:
    links = json.load(f)

# ───────────────────────────────────────────────
# 5. 크롤링 진행
for i, entry in enumerate(links):
    link = entry["link"]
    if link in existing_links:
        print(f"[{i + 1}/{len(links)}] 이미 수집됨: {entry['name']}")
        continue

    print(f"[{i + 1}/{len(links)}] 수집 중: {entry['name']}")
    result = crawl_restaurant(entry)

    if result:
        existing_data.append(result)
        existing_links.add(link)
        with open(SAVE_PATH, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=2)
        print(f"저장 완료: {entry['name']}")
    else:
        print(f"수집 실패: {entry['name']}")

driver.quit()
