package com.onmyway.omw_auth.dto.request;

import lombok.Getter;

@Getter
public class RegisterRequest {
    private String username;
    private String password;
}