package com.example.demo.service.Iservice;

import com.example.demo.Entity.Account;
import com.example.demo.dto.CreateAccountRequest;

import com.example.demo.dto.UpdateAccountRequest;

import java.util.List;

public interface IAccountService {
    Account createAccount(CreateAccountRequest request);
    List<Account> getAllAccounts();
    Account getAccountById(Long id);
    Account updateAccount(Long id, UpdateAccountRequest request);
    void deleteAccount(Long id);
}
