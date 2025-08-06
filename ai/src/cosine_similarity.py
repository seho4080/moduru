import psycopg2
import api.gms_api as gms_api

conn = psycopg2.connect(host="localhost", dbname="postgres", user="postgres", password="ssafy")


def recommend(query):
    guessed_category = gms_api.guess_category(query)
    query_embedding = gms_api.text_embedding(query)

    cur = conn.cursor()
    cur.execute("SET search_path TO moduru")

    cur.execute(
        """
        SELECT
            p.id,
            p.place_name,
            COALESCE(r.description, s.description, f.description) AS description
        FROM moduru.places p
        LEFT JOIN moduru.restaurants r ON p.id = r.place_id AND p.category_id = 1
        LEFT JOIN moduru.spots s       ON p.id = s.place_id AND p.category_id = 2
        LEFT JOIN moduru.festivals f   ON p.id = f.place_id AND p.category_id = 3
        ORDER BY p.embedding <#> %s::vector
        LIMIT 10
        """,
        (query_embedding,),
    )

    results = cur.fetchall()
    print(results)


if __name__ == "__main__":
    query = "서울 야경이 잘 보이는 식당 추천해줘"
    recommend(query)
