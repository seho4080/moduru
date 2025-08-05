package com.B108.tripwish.domain.place.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@Document(indexName = "places")
@AllArgsConstructor
@NoArgsConstructor
public class PlaceDocument {

  @Id private String id;

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
