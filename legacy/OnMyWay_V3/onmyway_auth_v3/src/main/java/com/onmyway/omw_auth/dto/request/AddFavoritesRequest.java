package com.onmyway.omw_auth.dto.request;

import com.onmyway.omw_auth.domain.Coordinate;
import lombok.Getter;

@Getter
public class AddFavoritesRequest {
    private String username; //not null
    private String placeName; //possibly null
    private String roadAddressName; //possibly null
    private String addressName; //not null
    private Coordinate coordinate; //not null
}