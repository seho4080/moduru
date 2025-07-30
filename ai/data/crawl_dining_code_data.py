import os
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# 크롬 드라이버 옵션 설정
options = Options()
# options.add_argument("--headless")  # 필요시 해제
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
driver = webdriver.Chrome(service=Service(), options=options)

# 저장된 링크 불러오기
file_path = os.path.join(BASE_DIR, "raw", "diningcode_restaurant_links.json")
with open(file_path, encoding="utf-8") as f:
    restaurant_links = json.load(f)

results = []

for i, item in enumerate(restaurant_links[:10]):
    url = item["url"]
    name = item["name"]

    try:
        driver.get(url)
        time.sleep(2)  # 페이지 로딩 대기 (필요 시 조정)

        # s-list basic-info 영역 가져오기
        info_div = driver.find_element(By.CSS_SELECTOR, "div.s-list.basic-info")
        info_text = info_div.text.strip()

        results.append({"name": name, "url": url, "basic_info": info_text})

        print(f"[{i + 1}/{len(restaurant_links)}] 수집 완료: {name}")

    except Exception as e:
        print(f"[{i + 1}/{len(restaurant_links)}] 오류 발생: {name} - {e}")
        continue

# 결과 저장
save_path = os.path.join(BASE_DIR, "raw", "diningcode_restaurant_data.json")
with open(save_path, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

driver.quit()
