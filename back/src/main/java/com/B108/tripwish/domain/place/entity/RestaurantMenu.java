package com.B108.tripwish.domain.place.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "restaurant_menus")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class RestaurantMenu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant; // 연관된 식당

    @Column(name = "menu", length = 20, nullable = false)
    private String menu;
}
