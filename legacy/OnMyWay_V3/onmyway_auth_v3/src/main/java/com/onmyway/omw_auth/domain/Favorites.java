package com.onmyway.omw_auth.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Favorites {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int favoritesId;

    @Column(name = "place_name")
    private String placeName;

    @Column(name = "road_address_name")
    private String roadAddressName;

    @Column(name = "address_name", nullable = false)
    private String addressName;

    @Column(name = "latitude", nullable = false)
    private String latitude;

    @Column(name = "longitude", nullable = false)
    private String longitude;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

//    public Favorites(String placeName, String roadAddressName, String addressName, String latitude, String longitude) {
//        this.placeName = placeName;
//        this.roadAddressName = roadAddressName;
//        this.addressName = addressName;
//        this.latitude = latitude;
//        this.longitude = longitude;
//    }
}