import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options

# 크롬 설정
options = Options()
# options.add_argument("--headless")  # 필요하면 주석 해제
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
driver = webdriver.Chrome(service=Service(), options=options)

regions = [
    "서울",
    "강원",
    "경기",
    "경남",
    "경북",
    "광주",
    "대구",
    "대전",
    "부산",
    "세종",
    "울산",
    "인천",
    "전남",
    "전북",
    "제주",
    "충남",
    "충북",
]


def scroll_to_bottom(driver, pause_time=2):
    prev_height = driver.execute_script("return document.body.scrollHeight")
    while True:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(pause_time)
        new_height = driver.execute_script("return document.body.scrollHeight")
        if new_height == prev_height:
            break
        prev_height = new_height


def extract_links(driver):
    cards = driver.find_elements(By.CSS_SELECTOR, "li.Slide__Card__Item")
    data = []
    for card in cards:
        try:
            a_tag = card.find_element(By.CSS_SELECTOR, 'a[href^="/profile.php?rid="]')
            name_tag = card.find_element(By.CSS_SELECTOR, "p.Card__Rest__Name")
            url = a_tag.get_attribute("href")
            name = name_tag.text.strip()
            data.append({"name": name, "url": url})
        except Exception:
            continue
    return data


# 1단계: 링크 수집
all_links = []

for region in regions:
    url = f"https://www.diningcode.com/{region}"
    driver.get(url)
    scroll_to_bottom(driver)
    links = extract_links(driver)
    print(f"[{region}] 수집된 링크 수: {len(links)}")
    all_links.extend(links)

# 임시 저장
with open("diningcode_restaurant_links.json", "w", encoding="utf-8") as f:
    json.dump(all_links, f, ensure_ascii=False, indent=2)

driver.quit()
