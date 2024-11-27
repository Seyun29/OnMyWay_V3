package com.onmyway.omw_auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;

@SpringBootApplication(exclude = SecurityAutoConfiguration.class)
public class OmwAuthApplication {

    public static void main(String[] args) {
        SpringApplication.run(OmwAuthApplication.class, args);
    }

}