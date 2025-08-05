import json
import os
import time
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "..", "..", "data", "raw", "vk_spot_data.json")

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
        time.sleep(0.5)
        soup = BeautifulSoup(driver.page_source, "html.parser")

        images = extract_images(soup)
        description = extract_description(soup)
        description_short = extract_description_short(soup)
        tags = extract_tags(soup)
        detail_info = extract_detail_info_for_spot(soup)

        # 기존 entry에 덮어쓰기
        entry.update(
            {
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
        )
        return entry

    except Exception as e:
        print(f"크롤링 실패: {url} - {e}")
        return None


# ───────────────────────────────────────────────
# 3. 기존 데이터 불러오기
with open(DATA_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

# ───────────────────────────────────────────────
# 4. address가 없는 항목만 다시 수집
updated = 0
for idx, entry in enumerate(data):
    if entry.get("address") is not None:
        continue

    print(f"[{idx + 1}/{len(data)}] 📍 Re-crawling: {entry.get('name')}")
    result = crawl_spot(entry)

    if result:
        data[idx] = result
        updated += 1
        with open(DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ Updated: {entry.get('name')}")
    else:
        print(f"❌ Failed: {entry.get('name')}")

print(f"\n🔁 Done — {updated} spots updated with address info.")
driver.quit()
