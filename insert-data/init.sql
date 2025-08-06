-- ================================
-- 1. 테이블 생성부 (IF NOT EXISTS)
-- ================================
CREATE EXTENSION IF NOT EXISTS vector;
create table if not exists categories (
    id            bigserial not null,
    category_name varchar(255) not null,
    primary key (id)
);

create table if not exists users (
    birth         date,
    created_at    timestamp(6) not null,
    id            bigserial not null,
    nickname      varchar(50) not null,
    email         varchar(100) unique,
    gender        varchar(255) not null check (gender in ('M', 'F', 'O')),
    password      varchar(255),
    phone         varchar(255),
    profile_img   text,
    provider      varchar(255) not null,
    role          varchar(255) not null check (role in ('ROLE_USER', 'ROLE_ADMIN')),
    primary key (id)
);

create table if not exists friends (
    id            bigserial not null,
    user_id       bigint not null,
    friend_id     bigint not null,
    created_at    timestamp(6) not null,
    primary key (id),
    constraint uk_friends_user_id_friend_id unique (user_id, friend_id)
);

create table if not exists travel_rooms (
    id            bigserial not null,
    title         varchar(255) not null,
    start_date    date,
    end_date      date,
    created_at    timestamp(6) not null,
    region        varchar(255),
    primary key (id)
);

create table if not exists travel_members (
    room_id       bigint not null,
    user_id       bigint not null,
    role          varchar(255) not null check (role in ('OWNER', 'INVITED')),
    primary key (room_id, user_id)
);

create table if not exists places (
    id               bigserial not null,
    category_id      bigint,
    kakao_id         bigint,
    address_name     varchar(500),
    place_name       varchar(500),
    road_address_name varchar(500) not null,
    lat              float(53) not null,
    lng              float(53) not null,
    place_url        varchar(255),
    embedding        vector(3072),
    primary key (id)
);
-- CREATE INDEX IF NOT EXISTS idx_places_embedding
--   ON places
--   USING ivfflat (embedding vector_cosine_ops)
--   WITH (lists = 100);

create table if not exists restaurants (
    id             bigserial not null,
    place_id       bigint not null unique,
    business_hours varchar(500),
    homepage       varchar(500),
    parking        varchar(500),
    rest_date      varchar(500),
    tel            varchar(500),
    description    text,
    description_short text,
    primary key (id)
);

create table if not exists restaurant_menus (
    id             bigserial not null,
    restaurant_id  bigint not null,
    menu           varchar(500) not null,
    primary key (id)
);

create table if not exists festivals (
    id             bigserial not null,
    place_id       bigint not null unique,
    homepage       varchar(500),
    info_center    varchar(500),
    organizer      varchar(500),
    period         varchar(500),
    price          varchar(500),
    sns            varchar(500),
    description    text,
    description_short text,
    embedding      vector(3072),
    primary key (id)
);

create table if not exists spots (
    id             bigserial not null,
    place_id       bigint not null unique,
    business_hours varchar(500),
    homepage       varchar(500),
    info_center    varchar(500),
    parking        varchar(500),
    price          varchar(500),
    rest_date      varchar(500),
    description    text,
    description_short text,
    embedding      vector(3072),
    primary key (id)
);

create table if not exists reviews (
    id         bigserial not null,
    place_id   bigint not null,
    user_id    bigint not null,
    created_at timestamp(6) not null,
    primary key (id)
);

create table if not exists review_tags (
    id           bigserial not null,
    category_id  bigint not null,
    content      varchar(255),
    primary key (id)
);

create table if not exists place_images (
    id       bigserial not null,
    place_id bigint not null,
    img_url  varchar(500) not null,
    primary key (id)
);

create table if not exists place_metadata_tags (
    id       bigserial not null,
    place_id bigint not null,
    content  varchar(500) not null,
    primary key (id)
);

create table if not exists place_review_tags (
    review_id bigint not null,
    tag_id    bigint not null,
    primary key (review_id, tag_id)
);

create table if not exists invite_tokens (
    id        bigserial not null,
    room_id   bigint not null,
    val       timestamp(6) not null,
    token     varchar(255) not null unique,
    primary key (id)
);

create table if not exists my_places (
    place_id   bigint not null,
    user_id    bigint not null,
    created_at timestamp(6) not null,
    primary key (place_id, user_id)
);

create table if not exists want_places (
    id         bigserial not null,
    place_id   bigint not null,
    room_id    bigint not null,
    created_at timestamp(6) not null,
    primary key (id)
);

create table if not exists vote_places (
    user_id bigint not null,
    want_id bigint not null,
    vote    boolean not null,
    primary key (user_id, want_id)
);

create table if not exists user_token (
    id            bigserial not null,
    user_id       bigint not null,
    issued_at     timestamp(6) not null,
    expires_at    timestamp(6) not null,
    refresh_token varchar(512) not null unique,
    primary key (id)
);

-- ================================
-- 2. 외래키 제약조건부 (ON DELETE CASCADE 추가)
-- ================================
alter table friends
    add constraint fk_friends_user_id_to_users
    foreign key (user_id) references users on delete cascade;

alter table friends
    add constraint fk_friends_friend_id_to_users
    foreign key (friend_id) references users on delete cascade;

alter table travel_members
    add constraint fk_travel_members_room_id_to_travel_rooms
    foreign key (room_id) references travel_rooms on delete cascade;

alter table travel_members
    add constraint fk_travel_members_user_id_to_users
    foreign key (user_id) references users on delete cascade;

alter table places
    add constraint fk_places_category_id_to_categories
    foreign key (category_id) references categories on delete set null;

alter table restaurants
    add constraint fk_restaurants_place_id_to_places
    foreign key (place_id) references places on delete cascade;

alter table restaurant_menus
    add constraint fk_restaurant_menus_restaurant_id_to_restaurants
    foreign key (restaurant_id) references restaurants on delete cascade;

alter table festivals
    add constraint fk_festivals_place_id_to_places
    foreign key (place_id) references places on delete set null;

alter table spots
    add constraint fk_spots_place_id_to_places
    foreign key (place_id) references places on delete cascade;

alter table reviews
    add constraint fk_reviews_place_id_to_places
    foreign key (place_id) references places on delete cascade;

alter table reviews
    add constraint fk_reviews_user_id_to_users
    foreign key (user_id) references users on delete cascade;

alter table review_tags
    add constraint fk_review_tags_category_id_to_categories
    foreign key (category_id) references categories on delete cascade;

alter table place_images
    add constraint fk_place_images_place_id_to_places
    foreign key (place_id) references places on delete cascade;

alter table place_metadata_tags
    add constraint fk_place_metadata_tags_place_id_to_places
    foreign key (place_id) references places on delete cascade;

alter table place_review_tags
    add constraint fk_place_review_tags_review_id_to_reviews
    foreign key (review_id) references reviews on delete cascade;

alter table place_review_tags
    add constraint fk_place_review_tags_tag_id_to_review_tags
    foreign key (tag_id) references review_tags on delete cascade;

alter table invite_tokens
    add constraint fk_invite_tokens_room_id_to_travel_rooms
    foreign key (room_id) references travel_rooms on delete cascade;

alter table my_places
    add constraint fk_my_places_place_id_to_places
    foreign key (place_id) references places on delete cascade;

alter table my_places
    add constraint fk_my_places_user_id_to_users
    foreign key (user_id) references users on delete cascade;

alter table want_places
    add constraint fk_want_places_place_id_to_places
    foreign key (place_id) references places on delete cascade;

alter table want_places
    add constraint fk_want_places_room_id_to_travel_rooms
    foreign key (room_id) references travel_rooms on delete cascade;

alter table vote_places
    add constraint fk_vote_places_user_id_to_users
    foreign key (user_id) references users on delete cascade;

alter table vote_places
    add constraint fk_vote_places_want_id_to_want_places
    foreign key (want_id) references want_places on delete cascade;

alter table user_token
    add constraint fk_user_token_user_id_to_users
    foreign key (user_id) references users on delete cascade;

INSERT INTO categories (id, category_name) VALUES
(1, '카페'),
(2, '음식점'),
(3, '술집'),
(4, '베이커리');