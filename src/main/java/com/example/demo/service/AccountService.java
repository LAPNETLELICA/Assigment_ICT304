package com.example.demo.service;

import com.example.demo.Entity.Account;
import com.example.demo.dto.CreateAccountRequest;
import com.example.demo.exception.NotfoundException;
import com.example.demo.repository.AccountRepo;
import com.example.demo.service.Iservice.IAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountService implements IAccountService {

    private final AccountRepo accountRepo;

    @Override
    public Account createAccount(CreateAccountRequest request) {
        BigDecimal soldeInitial = request.soldeInitial() != null
                ? request.soldeInitial()
                : BigDecimal.ZERO;

        Account account = new Account(
                request.name(),
                request.currency() != null ? request.currency() : "XAF",
                soldeInitial
        );

        return accountRepo.save(account);
    }

    @Override
    public List<Account> getAllAccounts() {
        return accountRepo.findAll();
    }

    @Override
    public Account getAccountById(Long id) {
        return accountRepo.findById(id)
                .orElseThrow(() -> new NotfoundException("Compte introuvable avec l'id : " + id));
    }
}
