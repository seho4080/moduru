package com.B108.tripwish.domain.place.dto.response;


import java.util.List;

import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;


public class AiRecommendResponse {
    private List<AiPlaceDto> result;

    public List<AiPlaceDto> getResult() {
        return result;
    }

    // 세터
    public void setResult(List<AiPlaceDto> result) {
        this.result = result;
    }


}
