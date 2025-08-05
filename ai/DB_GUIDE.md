# DB 세팅 가이드

가이드에 앞서 `Ubuntu(WSL)` 환경에서 작업했음을 명시. <br>
필자와 환경이 다른 경우, 코드 수정을 필요로 하거나, 가이드 따라 진행에 어려움이 있을 수 있음. <br><br>
DB, SCHEMA 명은 아래와 같음.

```text
DB = ‘postgres’
SCHEMA = ‘moduru’
```

## PostgreSQL과 pgvector 설치

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo apt install postgresql-server-dev-all

# pgvector 컴파일 및 설치
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

## Postgre 세팅

```bash
sudo -u postgres psql

\password postgres
> {your_password}

# 만약 이미 설치되어 있다면 DROP후 다시 생성
# DROP EXTENSION vector;

CREATE SCHEMA {your_schema};
CREATE EXTENSION vector SCHEMA {your_schema};
```

## INSERT 데이터

```text
1. 구글 드라이브 > 데이터 > 최종RAW(?) > 4. 벡터 임베딩 포함 > 파일 3개 다운

2. 다운한 파일을 ai/data/ 경로에 저장.

3. ai/src/db/init_about_place_table.sql의 모든 SQL문 실행

4. ai/src/db/insert_*.py 전부 실행
```
