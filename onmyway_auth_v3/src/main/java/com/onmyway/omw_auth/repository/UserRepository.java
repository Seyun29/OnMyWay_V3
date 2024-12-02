package com.onmyway.omw_auth.repository;

import com.onmyway.omw_auth.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Integer> { //int의 경우 Integer로 변경 (reference type)
    boolean existsByUsername(String username);

    User findByUsername(String username);
}