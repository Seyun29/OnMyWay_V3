package com.onmyway.omw_auth.auth;

import com.onmyway.omw_auth.domain.User;
import com.onmyway.omw_auth.dto.CustomUserDetails;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

//@Component
public class JWTFilter extends OncePerRequestFilter {

    private final JWTUtil jwtUtil;

    public JWTFilter(JWTUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String requestURI = request.getRequestURI();
        boolean jwtNotRequired = requestURI.startsWith("/user/register") || requestURI.startsWith("/user/login") || requestURI.startsWith("/user/logout") || requestURI.startsWith("/auth/refresh");
        boolean authRequired = requestURI.startsWith("/map/get-review-summary") || requestURI.startsWith("/user/favorites") || requestURI.startsWith("/user/history");

        if (jwtNotRequired) {
            filterChain.doFilter(request, response);
            return;
        }

        String accessToken = request.getHeader("accessToken");

        if (accessToken == null || !accessToken.startsWith("Bearer ")) {
            System.out.println("JWTFilter : Invalid token"); //FIXME: use logger here
            if (authRequired) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter()
                        .write("{\"error\": \"Invalid Token\"}");
            } else customDoFilter(request, response, filterChain, false);
            return;
        }

        String token = accessToken.split(" ")[1];

        if (jwtUtil.isExpired(token)) {
            System.out.println("JWTFilter : token expired"); //FIXME: user logger here
            if (authRequired) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN); //send 403 to client!!
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter()
                        .write("{\"error\": \"Token Expired\"}");
            } else customDoFilter(request, response, filterChain, false);
            return;
        }

        String type = jwtUtil.getType(token);

        if (!type.equals("access")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter()
                    .write("{\"error\": \"Invalid Token\"}");
            return;
        }

        String username = jwtUtil.getUsername(token);
        String role = jwtUtil.getRole(token);

        User user = new User();
        user.setUsername(username);
        user.setPassword("temp"); //context holder에 정확한 pw가 필요하지 않음 (형식적)
        user.setRole(role);

        CustomUserDetails customUserDetails = new CustomUserDetails(user);
        //Generate Spring Security Auth Token
        Authentication authToken = new UsernamePasswordAuthenticationToken(customUserDetails, null, customUserDetails.getAuthorities());
        //Set Auth Token to Security Context
        SecurityContextHolder.getContext()
                .setAuthentication(authToken);

        customDoFilter(request, response, filterChain, true);
    }

    private void customDoFilter(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain, boolean isUser) throws ServletException, IOException {
        HttpServletRequest wrappedRequest = new HttpServletRequestWrapper(request) {
            @Override
            public String getHeader(String name) {
                if ("is_user".equals(name)) {
                    return isUser ? "true" : "false";
                }
                return super.getHeader(name);
            }

            @Override
            public java.util.Enumeration<String> getHeaders(String name) {
                if ("is_user".equals(name)) {
                    return Collections.enumeration(Collections.singletonList(isUser ? "true" : "false"));
                }
                return super.getHeaders(name);
            }
        };
        filterChain.doFilter(wrappedRequest, response);
    }
}