# TODO: langchain_test.py 추후에 gms_api.py에 통합시키기.
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_community.utilities import SQLDatabase
from langchain_experimental.sql import SQLDatabaseChain
from langchain.prompts import PromptTemplate

load_dotenv()
GMS_API_KEY = os.getenv("GMS_API_KEY")
GMS_API_BASE = "https://gms.ssafy.io/gmsapi/api.openai.com/v1"

db_uri = "postgresql+psycopg2://postgres:ssafy@localhost:5432/postgres"
db = SQLDatabase.from_uri(
    db_uri,
    include_tables=[
        "places",
        "place_metadata_tags",
        "restaurants",
        "restaurant_menus",
        "spots",
        "festivals",
    ],
    sample_rows_in_table_info=2,
    # NOTE: sample 데이터로 embedding이 들어가면서 토큰이 크게 늘어나 따로 처리.
    custom_table_info={"places": "CREATE TABLE places (id INT, place_name TEXT, address_name TEXT, category_id INT)"},
)

prompt = PromptTemplate(
    input_variables=["input", "table_info", "dialect"],
    template="""IMPORTANT: You must return ONLY a SQL query. NO markdown. NO explanations.

Tables: {table_info}
Question: {input}

Write a {dialect} query (NO ``` symbols):""",
)

# OpenAI LLM 구성 (API 키와 endpoint 명시적으로 전달)
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, openai_api_key=GMS_API_KEY, openai_api_base=GMS_API_BASE)

# SQLDatabaseChain 생성
db_chain = SQLDatabaseChain.from_llm(llm=llm, db=db, prompt=prompt, verbose=True)

# 질문 실행
result = db_chain.invoke("서울 야경이 잘 보이는 식당 추천해줘")
print(result)
