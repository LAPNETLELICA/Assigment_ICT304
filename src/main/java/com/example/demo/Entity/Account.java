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

    @Column(nullable = false, unique = true, length = 20)
    private String accountNumber;

    @Column(nullable = false, length = 20)
    private String accountType;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal solde;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Account(String name, String currency, BigDecimal solde, String accountNumber, String accountType) {
        this.name = name;
        this.currency = currency;
        this.solde = solde;
        this.accountNumber = accountNumber;
        this.accountType = accountType;
        this.status = "ACTIVE";
        this.createdAt = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return "Your Account{" +
                "id=" + id +
                ", accountNumber='" + accountNumber + '\'' +
                ", accountType='" + accountType + '\'' +
                ", status='" + status + '\'' +
                ", name='" + name + '\'' +
                ", currency='" + currency + '\'' +
                ", solde=" + solde +
                ", createdAt=" + createdAt +
                '}';
    }
}
