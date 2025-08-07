import psycopg2
import pandas as pd
from sklearn.cluster import KMeans

conn = psycopg2.connect(host="localhost", dbname="postgres", user="postgres", password="ssafy")


def cosine_similarity(region_id, query_embedding):
    cur = conn.cursor()
    cur.execute("SET search_path TO moduru")

    cur.execute(
        """SELECT
            p.id,
            p.place_name,
            p.address_name,
            COALESCE(r.business_hours, s.business_hours) AS business_hours,
            COALESCE(r.description, s.description, f.description) AS description
        FROM moduru.places p
        LEFT JOIN moduru.restaurants r ON p.id = r.place_id AND p.category_id = 1
        LEFT JOIN moduru.spots s       ON p.id = s.place_id AND p.category_id = 2
        LEFT JOIN moduru.festivals f   ON p.id = f.place_id AND p.category_id = 3
        WHERE p.region_code = %s
        ORDER BY p.embedding <#> %s::vector
        LIMIT 50
        """,
        (region_id, query_embedding),
    )

    results = cur.fetchall()
    return results


def k_means_clustering(place_list, n_clusters):
    embeddings = [place[3] for place in place_list]  # Assuming the embedding is at index 3
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    labels = kmeans.fit_predict(embeddings)

    return labels
