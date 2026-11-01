package com.onmyway.omw_auth.controller;

import com.onmyway.omw_auth.auth.JWTUtil;
import com.onmyway.omw_auth.domain.Refresh;
import com.onmyway.omw_auth.repository.RefreshRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Date;

@RestController()
public class JWTController {
    private final JWTUtil jwtUtil;
    private final RefreshRepository refreshRepository;

    public JWTController(JWTUtil jwtUtil, RefreshRepository refreshRepository) {
        this.jwtUtil = jwtUtil;
        this.refreshRepository = refreshRepository;
    }

    @PostMapping("/auth/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = request.getHeader("refreshToken");

        if (refreshToken == null || !refreshToken.startsWith("Bearer ")) {
            return new ResponseEntity<>("Invalid refresh token", HttpStatus.BAD_REQUEST);
        }

        String token = refreshToken.split(" ")[1];

        if (jwtUtil.isExpired(token)) {
            return new ResponseEntity<>("Refresh token expired", HttpStatus.FORBIDDEN);
        }

        String type = jwtUtil.getType(token);
        if (!type.equals("refresh")) {
            return new ResponseEntity<>("invalid refresh token", HttpStatus.BAD_REQUEST);
        }

        //Check if refresh token exists in the database
        Boolean isExist = refreshRepository.existsByRefresh(token);
        if (!isExist) {
            return new ResponseEntity<>("invalid refresh token", HttpStatus.BAD_REQUEST); //response body
        }

        String username = jwtUtil.getUsername(token);
        String role = jwtUtil.getRole(token);

        String newAccessToken = jwtUtil.createJwt("access", username, role, 600000L);
        String newRefreshToken = jwtUtil.createJwt("refresh", username, role, 86400000L);

        //Delete old refresh token and add new refresh token
        refreshRepository.deleteByRefresh(token);
        addRefreshEntity(username, newRefreshToken, 86400000L);

        //response
        response.setHeader("accessToken", "Bearer " + newAccessToken);
        response.setHeader("refreshToken", "Bearer " + newRefreshToken);

        return new ResponseEntity<>(HttpStatus.OK);
    }

    private void addRefreshEntity(String username, String refresh, Long expiredMs) {
        Date date = new Date(System.currentTimeMillis() + expiredMs);
        Refresh refreshEntity = new Refresh(username, refresh, date.toString());
        refreshRepository.save(refreshEntity);
    }

}