package com.example.demo.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "accounts")
@Getter
@Setter
@NoArgsConstructor
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 10)
    private String currency;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal solde;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Account(String name, String currency, BigDecimal solde) {
        this.name = name;
        this.currency = currency;
        this.solde = solde;
        this.createdAt = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return "Your Account{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", currency='" + currency + '\'' +
                ", solde=" + solde +
                ", createdAt=" + createdAt +
                '}';
    }
}
