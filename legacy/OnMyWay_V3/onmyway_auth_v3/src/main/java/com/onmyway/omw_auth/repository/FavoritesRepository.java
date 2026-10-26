package com.onmyway.omw_auth.repository;

import com.onmyway.omw_auth.domain.Favorites;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FavoritesRepository extends JpaRepository<Favorites, Integer> {

    @Query("SELECT f FROM Favorites f JOIN f.user u WHERE u.username = :username")
    List<Favorites> findFavoritesByUsername(@Param("username") String username);
//    List<Favorites> findByUser_UserId(int userId); <- same as above
}