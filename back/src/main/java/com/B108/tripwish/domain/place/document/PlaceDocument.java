package com.B108.tripwish.domain.place.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import lombok.Getter;
import org.springframework.data.elasticsearch.annotations.Document;

import java.util.List;

import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Getter
@Builder
@Document(indexName = "places")
@AllArgsConstructor
@NoArgsConstructor
public class PlaceDocument {

    @Id
    private String id;

    @Field(type = FieldType.Text)
    private String placeName;

    @Field(type = FieldType.Text)
    private String imageUrl;

    @Field(type = FieldType.Text)
    private String address;

    @Field(type = FieldType.Double)
    private Double lat;

    @Field(type = FieldType.Double)
    private Double lng;

    @Field(type = FieldType.Text)
    private String categoryName;
}


