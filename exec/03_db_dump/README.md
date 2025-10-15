# DB 덤프 (최신본)

- 파일명 예시: `mydb_20250817.sql`
- 생성 예시:
```
pg_dump -h <DB_HOST> -U <DB_USER> -d <DB_NAME> -F p -f mydb_20250817.sql
```
- 복원 예시:
```
psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME> -f mydb_20250817.sql
-- 또는
pg_restore -h <DB_HOST> -U <DB_USER> -d <DB_NAME> mydb_20250817.dump
```
- **주의**: 운영 비밀값/개인정보가 포함되지 않도록 마스킹하거나 과제 제출 정책을 따르세요.
