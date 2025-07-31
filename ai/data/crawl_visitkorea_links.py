import os
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVE_FILE = "visitkorea_restaurant_link.json"
SAVE_PATH = os.path.join(BASE_DIR, "raw", SAVE_FILE)
BASE_URL = "https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid="  # link 저장 시 사용될 URL

# TAGS = ["#레포츠", "#문화시설", "#관광지", "#이색체험"]
TAGS = ["#음식"]

options = Options()
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")

driver = webdriver.Chrome(options=options)
wait = WebDriverWait(driver, 10)
driver.get("https://korean.visitkorea.or.kr/list/travelinfo.do?service=ms")
next_button = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "a.btn_next.ico")))

# 기존 데이터 불러오기
if os.path.exists(SAVE_PATH):
    with open(SAVE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
else:
    data = []

existing_ids = {item["link"].split("=")[-1] for item in data}

# ✅ 모든 태그 버튼을 누름
print("🔘 필터 태그 클릭 중...")
buttons = driver.find_elements(By.CSS_SELECTOR, "button.btn > span")
for tag in TAGS:
    for btn in buttons:
        if btn.text.strip() == tag:
            btn.click()
            print(f"✔ {tag} 클릭 완료")
            time.sleep(2)
            break
    else:
        print(f"❌ {tag} 버튼을 찾지 못했습니다.")

# ✅ 본격적으로 페이지 수집 시작
page_num = 1
while True:
    try:
        items = driver.find_elements(By.CSS_SELECTOR, "div.tit > a")
        new_entries = []

        for item in items:
            onclick = item.get_attribute("onclick")
            if "goDetail" in onclick:
                cotid = onclick.split("'")[1]
                if cotid in existing_ids:
                    print(f"⚠️ 중복 항목 발견: {cotid}")
                    continue
                name = item.text.strip()
                link = BASE_URL + cotid
                new_entries.append({"name": name, "link": link})
                existing_ids.add(cotid)

        if new_entries:
            data.extend(new_entries)
            with open(SAVE_PATH, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

        print(f"✅ {page_num}페이지 완료")
        page_num += 1

        # 다음 버튼 클릭
        next_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a.btn_next.ico")))
        if "disabled" in next_button.get_attribute("class"):
            break
        driver.execute_script("arguments[0].click();", next_button)
        time.sleep(2)
    except:
        print("❌ 다음 버튼 없음 또는 오류 발생. 종료합니다.")
        break

print(f"\n✅ 크롤링 완료 — 총 {len(data)}건 수집됨")
driver.quit()
