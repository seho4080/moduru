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
import com.B108.tripwish.domain.room.service.WantPlaceReaderService;
import com.B108.tripwish.domain.room.service.WantPlaceService;
import com.B108.tripwish.domain.user.service.MyPlaceReaderService;
import com.B108.tripwish.domain.user.service.MyPlaceService;
import com.B108.tripwish.global.common.enums.PlaceType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlaceSearchServiceImpl implements PlaceSearchService {


    private final PlaceSearchRepository placeSearchRepository;
    private final PlaceRepository placeRepository;
    private final MyPlaceReaderService myPlaceReaderService;
    private final WantPlaceReaderService wantPlaceReaderService;
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

        // 키워드 기반 전체 검색
        List<PlaceDocument> documents = placeSearchRepository
                .findByPlaceNameContainingOrAddressContainingOrCategoryNameContaining(keyword, keyword, keyword);

        // 1. 지역 포함된 문서(우선순위 높음)
        List<PlaceResponseDto> regionMatched = documents.stream()
                .filter(doc -> regionPlaceIds.contains(Long.parseLong(doc.getId())))
                .map(doc -> mapToResponseDto(user, roomId, doc))
                .toList();


        // 2. 지역 포함되지 않은 문서 (후순위)
        List<PlaceResponseDto> others = documents.stream()
                .filter(doc -> !regionPlaceIds.contains(Long.parseLong(doc.getId())))
                .map(doc -> mapToResponseDto(user, roomId, doc))
                .toList();

        // 합치기: 지역 우선 → 기타
        List<PlaceResponseDto> response = new ArrayList<>();
        response.addAll(regionMatched);
        response.addAll(others);

        return new PlaceListResponseDto(response);
    }

    private PlaceResponseDto mapToResponseDto(CustomUserDetails user, Long roomId, PlaceDocument doc) {
        Long placeId = Long.parseLong(doc.getId());
        boolean isLiked = myPlaceReaderService.isLiked(user.getUser().getId(), placeId);
        boolean isWanted = wantPlaceReaderService.isWanted(roomId, placeId, PlaceType.PLACE);

        return PlaceResponseDto.builder()
                .placeId(placeId)
                .placeName(doc.getPlaceName())
                .placeImg(doc.getImageUrl())
                .category(doc.getCategoryName())
                .address(doc.getAddress())
                .latitude(doc.getLat())
                .longitude(doc.getLng())
                .isLiked(isLiked)
                .isWanted(isWanted)
                .build();
    }


}
