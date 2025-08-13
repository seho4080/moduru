-- POSTGRES SCHEMA
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID NOT NULL UNIQUE,
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  provider VARCHAR(100) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  profile_img TEXT,
  gender VARCHAR(10),
  birth DATE,
  created_at TIMESTAMP NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS regions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id BIGINT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  CONSTRAINT fk_regions_parent FOREIGN KEY (parent_id) REFERENCES regions(id)
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  category_name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS places (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT,
  region_id BIGINT,
  kakao_id BIGINT,
  place_name TEXT,
  place_url TEXT,
  address_name TEXT NOT NULL,
  road_address_name TEXT,
  lng DOUBLE PRECISION NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  embedding VECTOR,
  CONSTRAINT fk_places_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_places_region FOREIGN KEY (region_id) REFERENCES regions(id)
);

CREATE TABLE IF NOT EXISTS place_images (
  id BIGSERIAL PRIMARY KEY,
  place_id BIGINT NOT NULL,
  img_url TEXT NOT NULL,
  CONSTRAINT fk_place_images_place FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS place_metadata_tags (
  id BIGSERIAL PRIMARY KEY,
  place_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  CONSTRAINT fk_place_metadata_tags_place FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS restaurants (
  id BIGSERIAL PRIMARY KEY,
  place_id BIGINT NOT NULL UNIQUE,
  description TEXT,
  description_short TEXT,
  tel TEXT,
  homepage TEXT,
  business_hours TEXT,
  rest_date TEXT,
  parking TEXT,
  CONSTRAINT fk_restaurants_place FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS restaurant_menus (
  id BIGSERIAL PRIMARY KEY,
  restaurant_id BIGINT NOT NULL,
  menu TEXT NOT NULL,
  CONSTRAINT fk_restaurant_menus_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS spots (
  id BIGSERIAL PRIMARY KEY,
  place_id BIGINT NOT NULL UNIQUE,
  description TEXT,
  description_short TEXT,
  info_center TEXT,
  homepage TEXT,
  business_hours TEXT,
  rest_date TEXT,
  parking TEXT,
  price TEXT,
  CONSTRAINT fk_spots_place FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS festivals (
  id BIGSERIAL PRIMARY KEY,
  place_id BIGINT NOT NULL UNIQUE,
  description TEXT,
  description_short TEXT,
  homepage TEXT,
  info_center TEXT,
  period TEXT,
  price TEXT,
  organizer TEXT,
  sns TEXT,
  CONSTRAINT fk_festivals_place FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS travel_rooms (
  id BIGSERIAL PRIMARY KEY,
  region_id BIGINT,
  title VARCHAR(255),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_travel_rooms_region FOREIGN KEY (region_id) REFERENCES regions(id)
);

CREATE TABLE IF NOT EXISTS invite_tokens (
  id BIGSERIAL PRIMARY KEY,
  room_id BIGINT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  val TIMESTAMP NOT NULL,
  CONSTRAINT fk_invite_tokens_room FOREIGN KEY (room_id) REFERENCES travel_rooms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS want_places (
  id BIGSERIAL PRIMARY KEY,
  room_id BIGINT NOT NULL,
  type VARCHAR(50) NOT NULL,
  ref_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_want_places_room FOREIGN KEY (room_id) REFERENCES travel_rooms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS schedules (
  id BIGSERIAL PRIMARY KEY,
  room_id BIGINT UNIQUE,
  created_at TIMESTAMP NOT NULL,
  committed_at TIMESTAMP NULL,
  CONSTRAINT fk_schedules_room FOREIGN KEY (room_id) REFERENCES travel_rooms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS schedule_events (
  id BIGSERIAL PRIMARY KEY,
  schedule_id BIGINT NOT NULL,
  want_id BIGINT NOT NULL,
  day INT NOT NULL,
  date DATE NOT NULL,
  next_travel_time INT,
  start_time TIME,
  end_time TIME,
  event_order INT NOT NULL,
  memo TEXT,
  transport VARCHAR(20),
  CONSTRAINT fk_schedule_events_schedule FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
  CONSTRAINT fk_schedule_events_want FOREIGN KEY (want_id) REFERENCES want_places(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS review_tags (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL,
  content VARCHAR(255),
  CONSTRAINT fk_review_tags_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  place_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_place FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS place_review_tags (
  review_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  PRIMARY KEY (review_id, tag_id),
  CONSTRAINT fk_prt_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  CONSTRAINT fk_prt_tag FOREIGN KEY (tag_id) REFERENCES review_tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS place_tag_counts (
  place_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  tag_count INT NOT NULL,
  PRIMARY KEY (place_id, tag_id),
  CONSTRAINT fk_ptc_place FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
  CONSTRAINT fk_ptc_tag FOREIGN KEY (tag_id) REFERENCES review_tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS custom_places (
  id BIGSERIAL PRIMARY KEY,
  room_id BIGINT NOT NULL,
  name VARCHAR(100),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address VARCHAR(100) NOT NULL,
  CONSTRAINT fk_custom_places_room FOREIGN KEY (room_id) REFERENCES travel_rooms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vote_places (
  want_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  vote BOOLEAN NOT NULL,
  PRIMARY KEY (want_id, user_id),
  CONSTRAINT fk_vote_places_want FOREIGN KEY (want_id) REFERENCES want_places(id) ON DELETE CASCADE,
  CONSTRAINT fk_vote_places_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS my_places (
  user_id BIGINT NOT NULL,
  place_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  PRIMARY KEY (user_id, place_id),
  CONSTRAINT fk_my_places_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_my_places_place FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS friends (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  friend_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT uq_friends UNIQUE (user_id, friend_id),
  CONSTRAINT fk_friends_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_friends_friend FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_token (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  refresh_token VARCHAR(512) NOT NULL UNIQUE,
  issued_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_user_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE travel_members (
    room_id  BIGINT NOT NULL,
    user_id  BIGINT NOT NULL,
    role     VARCHAR(16) NOT NULL CHECK (role IN ('OWNER','INVITED')),
    PRIMARY KEY (room_id, user_id),
    CONSTRAINT fk_travel_members_room
        FOREIGN KEY (room_id) REFERENCES travel_rooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_travel_members_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- POSTGRES SEED
INSERT INTO users (uuid, email, password, provider, nickname, profile_img, gender, birth, created_at, phone, role) VALUES
('97e2b112-b3b8-48e1-bc1e-bd4a2291eac0', 'user0@example.com', '{bcrypt}$2a$10$xPl0eMOl9.ZNQqMDHZ0hYeFtNT9KbbCGpbBy89Bmy00furA2WA78m', 'local', 'user0', NULL, 'M', '1990-01-15', '2025-08-12 12:00:00', '010-0000-0000', 'ROLE_USER'),
('0a2b86be-3e3b-477c-b4d0-04b8a68382e0', 'user1@example.com', '{bcrypt}$2a$10$cJFpa1AdfwFrQyCBPo8duuUDw2MR8doKRPNLY1XtngvCZI10bQMC2', 'local', 'user1', NULL, 'F', '1991-02-15', '2025-08-13 12:00:00', '010-0000-0001', 'ROLE_USER'),
('f3123f3a-023e-4dd1-a3cd-a8822979ff96', 'user2@example.com', '{bcrypt}$2a$10$XYYV7RWWqCLmd12/8W2h2.Rmn/6.bNfEcZuO2C1OTzPRiuyTQMZn6', 'local', 'user2', NULL, 'O', '1992-03-15', '2025-08-14 12:00:00', '010-0000-0002', 'ROLE_USER'),
('0e5502ae-aedd-43ab-bfbb-cb979c508135', 'user3@example.com', '{bcrypt}$2a$10$xPl0eMOl9.ZNQqMDHZ0hYeFtNT9KbbCGpbBy89Bmy00furA2WA78m', 'local', 'user3', NULL, 'M', '1993-04-15', '2025-08-15 12:00:00', '010-0000-0003', 'ROLE_USER'),
('f3de9890-55cd-40d5-a609-aae40b5fad19', 'user4@example.com', '{bcrypt}$2a$10$s70OZSVPt/E/KN8Wbc32z.ZDu92dq86q.iihaXSbO1Sn2.xBAz7OW', 'local', 'user4', NULL, 'F', '1994-05-15', '2025-08-16 12:00:00', '010-0000-0004', 'ROLE_USER'),
('8c1450d8-be92-44f7-b120-261670a971b7', 'user5@example.com', '{bcrypt}$2a$10$C58OR2Ll0QGpNfx1QVnQbuch9bwX.mvV26hWVj1vhkH2FqYh/m8Xy', 'local', 'user5', NULL, 'O', '1995-06-15', '2025-08-17 12:00:00', '010-0000-0005', 'ROLE_USER'),
('17703821-1cba-4997-83ea-39837ea928da', 'user6@example.com', '{bcrypt}$2a$10$UBKEcD82XQ9BBIaZe6CyYOyEqiQBwk12rRePFwE1WrNQDstXLbr8G', 'local', 'user6', NULL, 'M', '1996-07-15', '2025-08-18 12:00:00', '010-0000-0006', 'ROLE_USER'),
('4a4b8549-16e8-4ce7-97ed-675c0112348c', 'user7@example.com', '{bcrypt}$2a$10$K2sla1itLrKrx01nwTXT3uii8I4aiPQG8gIcNENGIB9EjPajkzY9y', 'local', 'user7', NULL, 'F', '1997-08-15', '2025-08-19 12:00:00', '010-0000-0007', 'ROLE_USER'),
('38ea52ff-cf4b-4442-bef5-c189019011be', 'user8@example.com', '{bcrypt}$2a$10$ORs9nbk7VeZuYP974KBu6uabhOE5GjxEek4rMadMFdTyS1A8z8BIS', 'local', 'user8', NULL, 'O', '1998-09-15', '2025-08-20 12:00:00', '010-0000-0008', 'ROLE_USER'),
('4e6d38c8-b41f-478a-a285-e0cc591153a2', 'user9@example.com', '{bcrypt}$2a$10$wUMgN9haZVnDgfz.Hilxles1woQikPE8Qh8S.Prh4TVqGn3aOlsL6', 'local', 'user9', NULL, 'M', '1999-01-15', '2025-08-21 12:00:00', '010-0000-0009', 'ROLE_USER');

INSERT INTO regions (id, name, parent_id, lat, lng) VALUES 
(0, '서울특별시', NULL, 37.5665, 126.978),
(1, '부산광역시', NULL, 35.1796, 129.0756),
(2, '대구광역시', NULL, 35.8714, 128.6014),
(3, '인천광역시', NULL, 37.4563, 126.7052),
(4, '광주광역시', NULL, 35.1595, 126.8526),
(5, '대전광역시', NULL, 36.3504, 127.3845),
(6, '울산광역시', NULL, 35.5384, 129.3114),
(7, '세종특별자치시', NULL, 36.48, 127.289),
(8, '경기도', NULL, 37.2751, 127.0093),
(9, '강원특별자치도', NULL, 37.8854, 127.7298),
(10, '충청북도', NULL, 36.6357, 127.4917),
(11, '충청남도', NULL, 36.5184, 126.8),
(12, '전북특별자치도', NULL, 35.7175, 127.153),
(13, '전라남도', NULL, 34.8679, 126.991),
(14, '경상북도', NULL, 36.4919, 128.8889),
(15, '경상남도', NULL, 35.4606, 128.2132),
(16, '제주특별자치도', NULL, 33.489, 126.4983),
(17, '수원시', 8, 37.2636, 127.0286),
(18, '성남시', 8, 37.42, 127.1265),
(19, '고양시', 8, 37.6584, 126.832),
(20, '용인시', 8, 37.2411, 127.1775),
(21, '부천시', 8, 37.5034, 126.766),
(22, '안산시', 8, 37.3219, 126.8309),
(23, '안양시', 8, 37.3943, 126.9568),
(24, '남양주시', 8, 37.635, 127.2165),
(25, '화성시', 8, 37.199, 126.8312),
(26, '평택시', 8, 36.9947, 127.0885),
(27, '의정부시', 8, 37.7381, 127.0337),
(28, '시흥시', 8, 37.38, 126.802),
(29, '파주시', 8, 37.7599, 126.7802),
(30, '광명시', 8, 37.4782, 126.8644),
(31, '김포시', 8, 37.6153, 126.715),
(32, '광주시', 8, 37.4292, 127.255),
(33, '군포시', 8, 37.3614, 126.935),
(34, '이천시', 8, 37.2726, 127.4359),
(35, '양주시', 8, 37.7851, 127.0459),
(36, '오산시', 8, 37.1498, 127.0772),
(37, '구리시', 8, 37.5943, 127.129),
(38, '안성시', 8, 37.005, 127.2797),
(39, '의왕시', 8, 37.3445, 126.9683),
(40, '하남시', 8, 37.5393, 127.2143),
(41, '포천시', 8, 37.8943, 127.2006),
(42, '여주시', 8, 37.2981, 127.6371),
(43, '동두천시', 8, 37.9036, 127.0605),
(44, '과천시', 8, 37.4292, 126.9873),
(45, '가평군', 8, 37.8315, 127.5093),
(46, '연천군', 8, 38.096, 127.075),
(47, '양평군', 8, 37.4919, 127.4875),
(48, '춘천시', 9, 37.8813, 127.7298),
(49, '원주시', 9, 37.3422, 127.9202),
(50, '강릉시', 9, 37.7519, 128.8761),
(51, '동해시', 9, 37.5246, 129.1143),
(52, '태백시', 9, 37.1641, 128.9856),
(53, '속초시', 9, 38.2070, 128.5912),
(54, '삼척시', 9, 37.4499, 129.1658),
(55, '홍천군', 9, 37.6918, 127.8888),
(56, '횡성군', 9, 37.4916, 127.9856),
(57, '영월군', 9, 37.1835, 128.4615),
(58, '평창군', 9, 37.3704, 128.3900),
(59, '정선군', 9, 37.3808, 128.6608),
(60, '철원군', 9, 38.1460, 127.3135),
(61, '화천군', 9, 38.1064, 127.7080),
(62, '양구군', 9, 38.1096, 127.9893),
(63, '인제군', 9, 38.0697, 128.1702),
(64, '고성군', 9, 38.3803, 128.4676),
(65, '양양군', 9, 38.0755, 128.6194),
(66, '청주시', 10, 36.6424, 127.4890),
(67, '충주시', 10, 36.9910, 127.9251),
(68, '제천시', 10, 37.1326, 128.1906),
(69, '보은군', 10, 36.4895, 127.7298),
(70, '옥천군', 10, 36.3064, 127.5718),
(71, '영동군', 10, 36.1744, 127.7830),
(72, '증평군', 10, 36.7852, 127.5810),
(73, '진천군', 10, 36.8554, 127.4353),
(74, '괴산군', 10, 36.8153, 127.7862),
(75, '음성군', 10, 36.9403, 127.6908),
(76, '단양군', 10, 36.9854, 128.3656),
(77, '천안시', 11, 36.8151, 127.1139),
(78, '공주시', 11, 36.4467, 127.1190),
(79, '보령시', 11, 36.3339, 126.6129),
(80, '아산시', 11, 36.7898, 127.0012),
(81, '서산시', 11, 36.7845, 126.4502),
(82, '논산시', 11, 36.1870, 127.0980),
(83, '계룡시', 11, 36.2744, 127.2486),
(84, '당진시', 11, 36.8893, 126.6454),
(85, '금산군', 11, 36.1081, 127.4884),
(86, '부여군', 11, 36.2752, 126.9095),
(87, '서천군', 11, 36.0800, 126.6913),
(88, '청양군', 11, 36.4540, 126.8028),
(89, '홍성군', 11, 36.6012, 126.6608),
(90, '예산군', 11, 36.6827, 126.8501),
(91, '태안군', 11, 36.7450, 126.2987),
(92, '전주시', 12, 35.8242, 127.1480),
(93, '군산시', 12, 35.9677, 126.7366),
(94, '익산시', 12, 35.9483, 126.9577),
(95, '정읍시', 12, 35.5699, 126.8514),
(96, '남원시', 12, 35.4165, 127.3906),
(97, '김제시', 12, 35.8030, 126.8807),
(98, '완주군', 12, 35.9040, 127.1620),
(99, '진안군', 12, 35.7916, 127.4242),
(100, '무주군', 12, 36.0050, 127.6608),
(101, '장수군', 12, 35.6494, 127.5215),
(102, '임실군', 12, 35.6173, 127.2891),
(103, '순창군', 12, 35.3740, 127.1383),
(104, '고창군', 12, 35.4350, 126.7018),
(105, '부안군', 12, 35.7286, 126.7360),
(106, '목포시', 13, 34.8118, 126.3923),
(107, '여수시', 13, 34.7604, 127.6622),
(108, '순천시', 13, 34.9481, 127.4891),
(109, '나주시', 13, 35.0283, 126.7175),
(110, '광양시', 13, 34.9406, 127.6959),
(111, '담양군', 13, 35.3211, 126.9881),
(112, '곡성군', 13, 35.2810, 127.2977),
(113, '구례군', 13, 35.2094, 127.4646),
(114, '고흥군', 13, 34.6167, 127.2846),
(115, '보성군', 13, 34.7644, 127.0801),
(116, '화순군', 13, 35.0648, 126.9859),
(117, '장흥군', 13, 34.6816, 126.9071),
(118, '강진군', 13, 34.6390, 126.7673),
(119, '해남군', 13, 34.5720, 126.5980),
(120, '영암군', 13, 34.8006, 126.7021),
(121, '무안군', 13, 34.9875, 126.4811),
(122, '함평군', 13, 35.0657, 126.5160),
(123, '영광군', 13, 35.2771, 126.5119),
(124, '장성군', 13, 35.3010, 126.7845),
(125, '완도군', 13, 34.3110, 126.7550),
(126, '진도군', 13, 34.4844, 126.2635),
(127, '신안군', 13, 34.8260, 126.1086),
(128, '포항시', 14, 36.0190, 129.3435),
(129, '경주시', 14, 35.8562, 129.2247),
(130, '김천시', 14, 36.1216, 128.1198),
(131, '안동시', 14, 36.5684, 128.7294),
(132, '구미시', 14, 36.1195, 128.3446),
(133, '영주시', 14, 36.8057, 128.6240),
(134, '영천시', 14, 35.9733, 128.9389),
(135, '상주시', 14, 36.4152, 128.1591),
(136, '문경시', 14, 36.5946, 128.1996),
(137, '경산시', 14, 35.8265, 128.7370),
(138, '의성군', 14, 36.3526, 128.6972),
(139, '청송군', 14, 36.4336, 129.0570),
(140, '영양군', 14, 36.6808, 129.1124),
(141, '영덕군', 14, 36.4150, 129.3657),
(142, '청도군', 14, 35.6474, 128.7334),
(143, '고령군', 14, 35.7290, 128.2620),
(144, '성주군', 14, 35.9191, 128.2826),
(145, '칠곡군', 14, 35.9957, 128.4010),
(146, '예천군', 14, 36.6576, 128.4529),
(147, '봉화군', 14, 36.8882, 128.7375),
(148, '울진군', 14, 36.9931, 129.4004),
(149, '울릉군', 14, 37.4846, 130.9063),
(150, '창원시', 15, 35.2283, 128.6811),
(151, '진주시', 15, 35.1796, 128.1076),
(152, '통영시', 15, 34.8544, 128.4330),
(153, '사천시', 15, 35.0038, 128.0641),
(154, '김해시', 15, 35.2285, 128.8890),
(155, '밀양시', 15, 35.4934, 128.7480),
(156, '거제시', 15, 34.8806, 128.6219),
(157, '양산시', 15, 35.3385, 129.0340),
(158, '의령군', 15, 35.3191, 128.2618),
(159, '함안군', 15, 35.2724, 128.4065),
(160, '창녕군', 15, 35.5410, 128.4950),
(161, '고성군', 15, 34.9720, 128.3220),
(162, '남해군', 15, 34.8370, 127.8926),
(163, '하동군', 15, 35.0674, 127.7514),
(164, '산청군', 15, 35.4140, 127.8730),
(165, '함양군', 15, 35.5204, 127.7255),
(166, '거창군', 15, 35.6710, 127.9096),
(167, '합천군', 15, 35.5667, 128.1667);


INSERT INTO categories (id, category_name) VALUES
  (1, 'restaurant'),
  (2, 'spot'),
  (3, 'festival'),
  (4, 'common');


INSERT INTO travel_rooms (region_id, title, start_date, end_date, created_at) VALUES
(1, 'Room 1', '2025-08-01', '2025-08-11', '2025-08-12 12:00:00'),
(2, 'Room 2', '2025-08-02', '2025-08-12', '2025-08-13 12:00:00'),
(3, 'Room 3', '2025-08-03', '2025-08-13', '2025-08-14 12:00:00'),
(4, 'Room 4', '2025-08-04', '2025-08-14', '2025-08-15 12:00:00'),
(5, 'Room 5', '2025-08-05', '2025-08-15', '2025-08-16 12:00:00'),
(6, 'Room 6', '2025-08-06', '2025-08-16', '2025-08-17 12:00:00'),
(7, 'Room 7', '2025-08-07', '2025-08-17', '2025-08-18 12:00:00'),
(8, 'Room 8', '2025-08-08', '2025-08-18', '2025-08-19 12:00:00'),
(9, 'Room 9', '2025-08-09', '2025-08-19', '2025-08-20 12:00:00'),
(10, 'Room 10', '2025-08-01', '2025-08-11', '2025-08-21 12:00:00');

INSERT INTO invite_tokens (room_id, token, val) VALUES
(1, '7bcef828-37fe-4b22-a00b-ac9501899b9f', '2025-08-13 12:00:00'),
(2, '189984c8-3f79-46ca-9af7-1eaa10d7e842', '2025-08-14 12:00:00'),
(3, 'fedd6ac2-a741-4552-8d06-235e0107c73a', '2025-08-15 12:00:00'),
(4, '2b6ddc19-54a1-4b92-be37-7aa392031b4b', '2025-08-16 12:00:00'),
(5, 'faac8533-80c2-441e-91db-28e77c781853', '2025-08-17 12:00:00'),
(6, '70b2bcfd-f097-4f9d-b513-9bc04e7ace3f', '2025-08-18 12:00:00'),
(7, '002eb414-1830-44f7-b1b3-ae31b9133f8a', '2025-08-19 12:00:00'),
(8, 'f311a261-8bb3-4028-8a24-0bb233d867cb', '2025-08-20 12:00:00'),
(9, '71108d0f-5f0f-4712-a189-a9b32dec4b31', '2025-08-21 12:00:00'),
(10, '10961fb7-9b0c-4707-a458-cda8ce485b40', '2025-08-22 12:00:00');

INSERT INTO want_places (room_id, type, ref_id, created_at) VALUES
(1, 'Place', 1, '2025-08-12 12:00:00'),
(2, 'Custom', 2, '2025-08-13 12:00:00'),
(3, 'Place', 3, '2025-08-14 12:00:00'),
(4, 'Custom', 4, '2025-08-15 12:00:00'),
(5, 'Place', 5, '2025-08-16 12:00:00'),
(6, 'Custom', 6, '2025-08-17 12:00:00'),
(7, 'Place', 7, '2025-08-18 12:00:00'),
(8, 'Custom', 8, '2025-08-19 12:00:00'),
(9, 'Place', 9, '2025-08-20 12:00:00'),
(10, 'Custom', 10, '2025-08-21 12:00:00');

INSERT INTO schedules (room_id, created_at, committed_at) VALUES
(1, '2025-08-12 12:00:00', '2025-08-14 12:00:00'),
(2, '2025-08-13 12:00:00', NULL),
(3, '2025-08-14 12:00:00', '2025-08-16 12:00:00'),
(4, '2025-08-15 12:00:00', NULL),
(5, '2025-08-16 12:00:00', '2025-08-18 12:00:00'),
(6, '2025-08-17 12:00:00', NULL),
(7, '2025-08-18 12:00:00', '2025-08-20 12:00:00'),
(8, '2025-08-19 12:00:00', NULL),
(9, '2025-08-20 12:00:00', '2025-08-22 12:00:00'),
(10, '2025-08-21 12:00:00', NULL);

INSERT INTO schedule_events (schedule_id, want_id, day, date, next_travel_time, start_time, end_time, event_order, memo, transport) VALUES
(1, 1, 1, '2025-08-10', 0, '09:00', '10:30', 1, 'memo 1', 'driver'),
(2, 2, 2, '2025-08-11', 15, '09:01', '10:31', 2, 'memo 2', 'transit'),
(3, 3, 3, '2025-08-12', 30, '09:02', '10:32', 3, 'memo 3', 'walking'),
(4, 4, 4, '2025-08-13', 45, '09:03', '10:33', 4, 'memo 4', 'driver'),
(5, 5, 5, '2025-08-14', 0, '09:04', '10:34', 5, 'memo 5', 'transit'),
(6, 6, 1, '2025-08-15', 15, '09:05', '10:35', 6, 'memo 6', 'walking'),
(7, 7, 2, '2025-08-16', 30, '09:00', '10:30', 7, 'memo 7', 'driver'),
(8, 8, 3, '2025-08-17', 45, '09:01', '10:31', 8, 'memo 8', 'transit'),
(9, 9, 4, '2025-08-18', 0, '09:02', '10:32', 9, 'memo 9', 'walking'),
(10, 10, 5, '2025-08-19', 15, '09:03', '10:33', 10, 'memo 10', 'driver');

INSERT INTO review_tags (category_id, content) VALUES
(4, '친절해요'),
(4, '사진이 잘 나와요'),
(4, '반려동물과 가기 좋아요'),
(4, '아이와 가기 좋아요'),
(4, '오래 머무르기 좋아요'),
(4, '뷰가 좋아요'),
(4, '컨셉이 독특해요'),
(4, '인테리어가 멋져요'),
(4, '가성비가 좋아요'),
(4, '특별한 날 가기 좋아요'),
(4, '관리가 잘 되어있어요'),
(4, '가격이 합리적이에요'),
(4, '편의시설이 잘 되어있어요'),
(4, '감각적이에요'),
(4, '맞춤 제작을 잘해요'),
(4, '포장이 정성스러워요'),
(4, '원데이 클래스가 알차요'),
(4, '배달 시스템이 편리해요'),
(4, '파티하기 좋아요'),
(4, '안전하게 관리해요'),
(4, '샤워실이 잘 되어있어요'),
(4, '셔틀버스가 잘 되어있어요'),
(4, '숙박하기 좋아요'),
(4, '야외에서 놀기 좋아요'),
(4, '코스가 길어요'),
(4, '부대시설이 잘 되어있어요'),
(4, '좌석 간격이 넓어요'),
(1, '매장이 청결해요'),
(1, '화장실이 깨끗해요'),
(1, '주차하기 편해요'),
(1, '환기가 잘 돼요'),
(1, '좌석이 편해요'),
(1, '아늑해요'),
(1, '차분한 분위기예요'),
(1, '음악이 좋아요'),
(1, '야외공간이 멋져요'),
(1, '대화하기 좋아요'),
(1, '매장이 넓어요'),
(1, '단체모임 하기 좋아요'),
(1, '음식이 빨리 나와요'),
(1, '샐러드바가 잘 되어있어요'),
(1, '직접 잘 구워줘요'),
(1, '포장이 깔끔해요'),
(1, '룸이 잘 되어있어요'),
(1, '음료가 맛있어요'),
(1, '잡내가 적어요'),
(1, '코스요리가 알차요'),
(1, '반찬이 잘 나와요'),
(1, '건강한 맛이에요'),
(1, '기본 안주가 좋아요'),
(1, '집중하기 좋아요'),
(1, '음식이 맛있어요'),
(1, '재료가 신선해요'),
(1, '양이 많아요'),
(1, '특별한 메뉴가 있어요'),
(1, '현지 맛에 가까워요'),
(1, '메뉴 구성이 알차요'),
(1, '비싼 만큼 가치있어요'),
(1, '고기 질이 좋아요'),
(1, '술이 다양해요'),
(1, '커피가 맛있어요'),
(1, '디저트가 맛있어요'),
(1, '향신료가 강하지 않아요'),
(1, '혼밥하기 좋아요'),
(1, '혼술하기 좋아요'),
(1, '라이브공연이 훌륭해요'),
(2, '경치가 아름다워요'),
(2, '자연 경관이 좋아요'),
(2, '역사적인 가치가 있어요'),
(2, '사진 명소예요'),
(2, '접근성이 좋아요'),
(2, '사람이 적어 한적해요'),
(2, '설명이 잘 되어있어요'),
(2, '체험하기 좋아요'),
(2, '계절마다 매력이 달라요'),
(2, '산책하기 좋아요'),
(2, '입장료가 저렴해요'),
(2, '가족과 가기 좋아요'),
(2, '자연을 느끼기 좋아요'),
(2, '특별한 전시가 있어요'),
(2, '야경이 멋져요'),
(2, '교통이 편리해요'),
(2, '역사/문화 체험이 가능해요'),
(2, '현지 분위기를 느낄 수 있어요'),
(2, '안전하게 관람할 수 있어요'),
(2, '붐비지 않아요'),
(2, '트렌디해요'),
(2, '피크닉하기 좋아요'),
(2, '신기한 식물이 많아요'),
(2, '근처에 갈 곳이 많아요'),
(2, '산책로가 잘 되어있어요'),
(2, '동물 관리가 잘 되어있어요'),
(2, '유익해요'),
(2, '대기시간이 짧아요'),
(2, '규모가 커요'),
(3, '분위기가 활기차요'),
(3, '분위기가 열정적이에요'),
(3, '공연이 재미있어요'),
(3, '먹거리가 다양해요'),
(3, '볼거리가 많아요'),
(3, '체험 부스가 풍부해요'),
(3, '지역 특색이 느껴져요'),
(3, '프로그램 구성이 알차요'),
(3, '가족 단위로 즐기기 좋아요'),
(3, '아이들이 좋아해요'),
(3, '야간에도 즐길 수 있어요'),
(3, '이벤트가 풍성해요'),
(3, '굿즈가 다양해요'),
(3, '사람들이 많이 모여요'),
(3, '안전 관리가 잘 되어있어요'),
(3, '교통편이 잘 되어있어요'),
(3, '지역 주민과 소통하기 좋아요'),
(3, '계절마다 색다른 매력이 있어요'),
(3, '축제 장소가 넓어요'),
(3, '현지 문화를 깊이 체험할 수 있어요');

INSERT INTO reviews (user_id, place_id, created_at) VALUES
(1, 1, '2025-08-12 12:00:00'),
(2, 2, '2025-08-13 12:00:00'),
(3, 3, '2025-08-14 12:00:00'),
(4, 4, '2025-08-15 12:00:00'),
(5, 5, '2025-08-16 12:00:00'),
(6, 6, '2025-08-17 12:00:00'),
(7, 7, '2025-08-18 12:00:00'),
(8, 8, '2025-08-19 12:00:00'),
(9, 9, '2025-08-20 12:00:00'),
(10, 10, '2025-08-21 12:00:00');

INSERT INTO place_review_tags (review_id, tag_id) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5),
(6, 6),
(7, 7),
(8, 8),
(9, 9),
(10, 10);

INSERT INTO place_tag_counts (place_id, tag_id, tag_count) VALUES
(1, 1, 19),
(2, 2, 2),
(3, 3, 7),
(4, 4, 10),
(5, 5, 7),
(6, 6, 4),
(7, 7, 14),
(8, 8, 13),
(9, 9, 2),
(10, 10, 20);

INSERT INTO custom_places (room_id, name, lat, lng, address) VALUES
(1, 'Custom 1', 37.1000, 127.1000, 'Custom Addr 1'),
(2, 'Custom 2', 37.1100, 127.1100, 'Custom Addr 2'),
(3, 'Custom 3', 37.1200, 127.1200, 'Custom Addr 3'),
(4, 'Custom 4', 37.1300, 127.1300, 'Custom Addr 4'),
(5, 'Custom 5', 37.1400, 127.1400, 'Custom Addr 5'),
(6, 'Custom 6', 37.1500, 127.1500, 'Custom Addr 6'),
(7, 'Custom 7', 37.1600, 127.1600, 'Custom Addr 7'),
(8, 'Custom 8', 37.1700, 127.1700, 'Custom Addr 8'),
(9, 'Custom 9', 37.1800, 127.1800, 'Custom Addr 9'),
(10, 'Custom 10', 37.1900, 127.1900, 'Custom Addr 10');

INSERT INTO vote_places (want_id, user_id, vote) VALUES
(1, 1, TRUE),
(2, 2, FALSE),
(3, 3, TRUE),
(4, 4, FALSE),
(5, 5, TRUE),
(6, 6, FALSE),
(7, 7, TRUE),
(8, 8, FALSE),
(9, 9, TRUE),
(10, 10, FALSE);

INSERT INTO my_places (user_id, place_id, created_at) VALUES
(1, 1, '2025-08-12 12:00:00'),
(2, 2, '2025-08-13 12:00:00'),
(3, 3, '2025-08-14 12:00:00'),
(4, 4, '2025-08-15 12:00:00'),
(5, 5, '2025-08-16 12:00:00'),
(6, 6, '2025-08-17 12:00:00'),
(7, 7, '2025-08-18 12:00:00'),
(8, 8, '2025-08-19 12:00:00'),
(9, 9, '2025-08-20 12:00:00'),
(10, 10, '2025-08-21 12:00:00');

INSERT INTO friends (user_id, friend_id, created_at) VALUES
(1, 2, '2025-08-12 12:00:00'),
(2, 3, '2025-08-13 12:00:00'),
(3, 4, '2025-08-14 12:00:00'),
(4, 5, '2025-08-15 12:00:00'),
(5, 6, '2025-08-16 12:00:00'),
(6, 7, '2025-08-17 12:00:00'),
(7, 8, '2025-08-18 12:00:00'),
(8, 9, '2025-08-19 12:00:00'),
(9, 10, '2025-08-20 12:00:00'),
(10, 1, '2025-08-21 12:00:00');

-- INSERT INTO user_token (user_id, refresh_token, issued_at, expires_at) VALUES
-- (1, '464bc195-11a4-46e9-a284-5bff16da4ad5', '2025-08-12 12:00:00', '2025-09-11 12:00:00'),
-- (2, 'e6aa3bc2-4f33-46ca-946d-b508efa9b576', '2025-08-13 12:00:00', '2025-09-12 12:00:00'),
-- (3, 'fd65e53e-4861-4fd4-86b9-5ec7f26bcd88', '2025-08-14 12:00:00', '2025-09-13 12:00:00'),
-- (4, 'f08ee93b-38d3-44ea-bf4c-bdb5b38f0a75', '2025-08-15 12:00:00', '2025-09-14 12:00:00'),
-- (5, '5b399e76-4b02-4919-89e1-71c1c17d01b3', '2025-08-16 12:00:00', '2025-09-15 12:00:00'),
-- (6, '56cea42b-aab0-4dac-bfd7-8664e47aa122', '2025-08-17 12:00:00', '2025-09-16 12:00:00'),
-- (7, 'a0321a62-e87f-46e9-b7e9-cf8ec1e3d60a', '2025-08-18 12:00:00', '2025-09-17 12:00:00'),
-- (8, 'b42e4068-3a57-4a3d-b462-dd18e691138e', '2025-08-19 12:00:00', '2025-09-18 12:00:00'),
-- (9, '79bba3aa-3294-480e-8c3d-42e08b749cec', '2025-08-20 12:00:00', '2025-09-19 12:00:00'),
-- (10, '6566eb8d-dd8b-4bde-84aa-f4d82052d3aa', '2025-08-21 12:00:00', '2025-09-20 12:00:00');
