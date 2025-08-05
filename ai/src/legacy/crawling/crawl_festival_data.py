import os
import time
import json
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# 파일 경로
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "..", "..", "data", "raw", "visitkorea_festival.csv")
SAVE_PATH = os.path.join(BASE_DIR, "..", "..", "data", "raw", "vk_festival_data.json")

# 셀레니움 설정
options = Options()
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
driver = webdriver.Chrome(options=options)
wait = WebDriverWait(driver, 10)

# 기존 저장 데이터 로드 (중복 확인용)
if os.path.exists(SAVE_PATH):
    with open(SAVE_PATH, "r", encoding="utf-8") as f:
        festival_data = json.load(f)
        existing_links = {item.get("link") for item in festival_data if item.get("link")}
else:
    festival_data = []
    existing_links = set()

# CSV에서 링크 가져오기
df = pd.read_csv(CSV_PATH)
links = df["상세링크"].dropna().unique().tolist()


# 보조 함수
def safe_find(css, by=By.CSS_SELECTOR, many=False):
    try:
        return driver.find_elements(by, css) if many else driver.find_element(by, css)
    except:
        return [] if many else None


def extract_text(elem):
    return elem.text.strip() if elem else ""


def extract_background_url(style_str):
    import re

    match = re.search(r"background:\s*url\((.*?)\)", style_str)
    return match.group(1) if match else ""


# 본격 크롤링
for idx, link in enumerate(links, 1):
    if link in existing_links:
        print(f"[{idx}/{len(links)}] ⚠️ 중복 링크 건너뜀: {link}")
        continue

    print(f"[{idx}/{len(links)}] 수집 중: {link}")
    driver.get(link)
    time.sleep(0.5)

    item = {"link": link}

    # 제목, 소제목, 설명
    item["name"] = extract_text(safe_find("#festival_head"))
    item["description_short"] = extract_text(safe_find("span.sub_title"))
    desc_elem = safe_find("div.slide_content.fst")
    item["description"] = desc_elem.text.replace("더보기", "").strip() if desc_elem else ""

    # 이미지 URL
    image_divs = safe_find("div.swiper-slide a.imgClick", many=True)
    item["images"] = [
        extract_background_url(div.get_attribute("style"))
        for div in image_divs
        if extract_background_url(div.get_attribute("style"))
    ]

    # 정보 아이콘 추출
    info_items = safe_find("div.img_info_box ul > li", many=True)
    for li in info_items:
        icon_div = li.find_element(By.CLASS_NAME, "info_ico")
        icon_type = icon_div.get_attribute("class")
        content = extract_text(li.find_element(By.CLASS_NAME, "info_content"))

        if "data" in icon_type:
            item["period"] = content
        elif "location" in icon_type:
            item["address"] = content
        elif "price" in icon_type:
            item["price"] = content
        elif "partner" in icon_type:
            item["organizer"] = content
        elif "tell" in icon_type:
            item["info_center"] = content
        elif "instar" in icon_type:
            a_tag = li.find_element(By.TAG_NAME, "a")
            item["sns"] = a_tag.get_attribute("href") if a_tag else ""

    # 홈페이지
    homepage = safe_find("a.homepage_link_btn")
    item["homepage"] = homepage.get_attribute("href") if homepage else ""

    festival_data.append(item)
    existing_links.add(link)

    # 매회 저장
    with open(SAVE_PATH, "w", encoding="utf-8") as f:
        json.dump(festival_data, f, indent=2, ensure_ascii=False)

driver.quit()
print(f"\n✅ 크롤링 완료 — 총 {len(festival_data)}건 저장됨")
