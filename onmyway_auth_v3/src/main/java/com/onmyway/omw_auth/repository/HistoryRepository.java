package com.onmyway.omw_auth.repository;

import com.onmyway.omw_auth.domain.History;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HistoryRepository extends JpaRepository<History, Integer> {

    @Query("SELECT h FROM History h JOIN h.user u WHERE u.username = :username")
    List<History> findHistoryByUsername(@Param("username") String username);
//    List<History> findByUser_UserId(int userId); <- same as above

}