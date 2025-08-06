-- 카테고리 테이블
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR NOT NULL
);

-- 카테고리 데이터 삽입
INSERT INTO
    categories (id, category_name)
VALUES (1, 'restaurant'),
    (2, 'spot'),
    (3, 'festival'),
    (4, 'common');

-- 장소 테이블
CREATE TABLE places (
    id SERIAL PRIMARY KEY,
    category_id INT NOT NULL REFERENCES categories (id),
    kakao_id INT,
    place_name VARCHAR(50),
    place_url VARCHAR(500),
    address_name VARCHAR(150),
    road_address_name VARCHAR(150) NOT NULL,
    lng FLOAT NOT NULL,
    lat FLOAT NOT NULL,
    embedding VECTOR -- VECTOR 타입은 pgvector 확장 필요
);

-- 장소 태그 테이블
CREATE TABLE place_metadata_tags (
    id SERIAL PRIMARY KEY,
    place_id INT NOT NULL REFERENCES places (id),
    content VARCHAR(30) NOT NULL
);

-- 장소 이미지 테이블
CREATE TABLE place_metadata_images (
    id BIGSERIAL PRIMARY KEY,
    place_id INT NOT NULL REFERENCES places (id),
    img_url VARCHAR(500) NOT NULL
);

-- 음식점 테이블
CREATE TABLE restaurants (
    id SERIAL PRIMARY KEY,
    place_id INT NOT NULL REFERENCES places (id),
    description TEXT,
    description_short TEXT,
    tel VARCHAR(50),
    homepage VARCHAR(255),
    business_hours VARCHAR(255),
    rest_date VARCHAR(100),
    parking VARCHAR(100)
);

-- 음식점 메뉴 테이블
CREATE TABLE restaurant_menus (
    id SERIAL PRIMARY KEY,
    restaurant_id INT NOT NULL REFERENCES restaurants (id),
    menu VARCHAR(30) NOT NULL
);

-- 명소 테이블
CREATE TABLE spots (
    id SERIAL PRIMARY KEY,
    place_id INT NOT NULL REFERENCES places (id),
    description TEXT,
    description_short TEXT,
    info_center VARCHAR(50),
    homepage VARCHAR(255),
    business_hours VARCHAR(255),
    rest_date VARCHAR(100),
    parking VARCHAR(100),
    price VARCHAR(100)
);

-- 축제 테이블
CREATE TABLE festivals (
    id SERIAL PRIMARY KEY,
    place_id INT NOT NULL REFERENCES places (id),
    description TEXT,
    description_short TEXT,
    homepage VARCHAR(255),
    info_center VARCHAR(100),
    period VARCHAR(100),
    price VARCHAR(100),
    organizer VARCHAR(50),
    sns VARCHAR(100)
);