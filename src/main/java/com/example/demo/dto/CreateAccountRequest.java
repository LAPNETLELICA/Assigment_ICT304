package com.example.demo.dto;

import java.math.BigDecimal;

public record CreateAccountRequest(
        String name,
        String currency,
        BigDecimal soldeInitial
) {}
