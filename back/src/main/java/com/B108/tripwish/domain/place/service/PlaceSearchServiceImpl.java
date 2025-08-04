package com.B108.tripwish.domain.place.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.document.PlaceDocument;
import com.B108.tripwish.domain.place.dto.request.PlaceSearchRequest;
import com.B108.tripwish.domain.place.dto.response.PlaceListResponseDto;
import com.B108.tripwish.domain.place.dto.response.PlaceResponseDto;
import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.place.respoistory.PlaceRepository;
import com.B108.tripwish.domain.place.respoistory.PlaceSearchRepository;
import com.B108.tripwish.domain.room.service.RoomService;
import com.B108.tripwish.domain.room.service.WantPlaceService;
import com.B108.tripwish.domain.user.service.MyPlaceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlaceSearchServiceImpl implements PlaceSearchService {


    private final PlaceSearchRepository placeSearchRepository;
    private final PlaceRepository placeRepository;
    private final MyPlaceService myPlaceService;
    private final WantPlaceService wantPlaceService;
    private final RoomService roomService;

    @Transactional(readOnly = true)
    @Override
    public PlaceListResponseDto searchPlaces(CustomUserDetails user, Long roomId, PlaceSearchRequest request) {

        String keyword = request.getKeyword();
        String region = roomService.getRegionByRoomId(roomId);

        // 지역 기반 필터링
        Set<Long> regionPlaceIds = placeRepository.findAllByAddressNameContaining(region).stream()
                .map(Place::getId)
                .collect(Collectors.toSet());
        log.debug("region: {}", region);
        log.debug("regionPlaceIds: {}", regionPlaceIds);


        // 키워드 기반 필터링
        List<PlaceDocument> documents = placeSearchRepository
                .findByPlaceNameContainingOrAddressContainingOrCategoryNameContaining(keyword, keyword, keyword);

        // 교집합 (지역+키워드)
        List<PlaceResponseDto> response = documents.stream()
                .filter(doc -> regionPlaceIds.contains(Long.parseLong(doc.getId())))
                .map(doc -> {
                    // 각 document에서 필요한 필드 꺼냄
                    boolean isLiked = myPlaceService.isLiked(user.getUser().getId(), Long.parseLong(doc.getId()));
                    boolean isWanted = wantPlaceService.isWanted(roomId, Long.parseLong(doc.getId()));

                    return PlaceResponseDto.builder()
                            .placeId(Long.parseLong(doc.getId()))
                            .placeName(doc.getPlaceName())
                            .placeImg(doc.getImageUrl()) // 이미지 필드가 있다면
                            .category(doc.getCategoryName())
                            .address(doc.getAddress())
                            .latitude(doc.getLat())
                            .longitude(doc.getLng())
                            .isLiked(isLiked)
                            .isWanted(isWanted)
                            .build();
                })
                .toList();

        return new PlaceListResponseDto(response);
    }

}
