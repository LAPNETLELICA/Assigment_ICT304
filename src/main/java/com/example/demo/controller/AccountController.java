package com.example.demo.controller;

import com.example.demo.Entity.Account;
import com.example.demo.dto.CreateAccountRequest;
import com.example.demo.dto.UpdateAccountRequest;
import com.example.demo.service.Iservice.IAccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@Tag(name = "Account Management", description = "Endpoints pour la gestion des comptes bancaires")
public class AccountController {

    private final IAccountService accountService;

    @Operation(summary = "Créer un compte", description = "Permet de créer un nouveau compte bancaire avec un solde initial.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Compte créé avec succès")
    })
    @PostMapping
    public ResponseEntity<Account> createAccount(@RequestBody CreateAccountRequest request) {
        return new ResponseEntity<>(accountService.createAccount(request), HttpStatus.CREATED);
    }

    @Operation(summary = "Lister tous les comptes", description = "Récupère la liste de tous les comptes bancaires existants.")
    @ApiResponse(responseCode = "200", description = "Liste récupérée avec succès")
    @GetMapping
    public ResponseEntity<List<Account>> getAllAccounts() {
        return ResponseEntity.ok(accountService.getAllAccounts());
    }

    @Operation(summary = "Obtenir un compte", description = "Récupère les détails d'un compte bancaire à partir de son ID.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Compte trouvé"),
        @ApiResponse(responseCode = "404", description = "Compte introuvable")
    })
    @GetMapping("/{id}")
    public ResponseEntity<Account> getAccountById(
            @Parameter(description = "ID du compte à récupérer") @PathVariable Long id) {
        return ResponseEntity.ok(accountService.getAccountById(id));
    }

    @Operation(summary = "Mettre à jour un compte", description = "Permet de modifier les informations d'un compte existant (ex: nom).")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Compte mis à jour avec succès"),
        @ApiResponse(responseCode = "404", description = "Compte introuvable")
    })
    @PutMapping("/{id}")
    public ResponseEntity<Account> updateAccount(
            @Parameter(description = "ID du compte à modifier") @PathVariable Long id,
            @RequestBody UpdateAccountRequest request) {
        return ResponseEntity.ok(accountService.updateAccount(id, request));
    }

    @Operation(summary = "Supprimer un compte", description = "Supprime définitivement un compte bancaire de la base de données.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Compte supprimé avec succès"),
        @ApiResponse(responseCode = "404", description = "Compte introuvable")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(
            @Parameter(description = "ID du compte à supprimer") @PathVariable Long id) {
        accountService.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }
}
