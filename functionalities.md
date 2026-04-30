# Bank System Functionalities Source Code

This document contains the source code for 5 distinct functionalities extracted from the bank system. For each functionality, the corresponding Controller endpoint and Service implementation are provided.

## 1. Create a New Account

**Controller (`AccountController.java`)**
```java
@Operation(summary = "Créer un compte", description = "Permet de créer un nouveau compte bancaire avec un solde initial.")
@ApiResponses(value = {
    @ApiResponse(responseCode = "201", description = "Compte créé avec succès")
})
@PostMapping
public ResponseEntity<Account> createAccount(@RequestBody CreateAccountRequest request) {
    return new ResponseEntity<>(accountService.createAccount(request), HttpStatus.CREATED);
}
```

**Service (`AccountService.java`)**
```java
@Override
public Account createAccount(CreateAccountRequest request) {
    BigDecimal soldeInitial = request.soldeInitial() != null
            ? request.soldeInitial()
            : BigDecimal.ZERO;
            
    // Generate a random 10-digit account number
    String accountNumber = java.util.UUID.randomUUID().toString().replaceAll("-", "").substring(0, 10).toUpperCase();
    
    String accountType = request.accountType() != null ? request.accountType() : "CURRENT";

    Account account = new Account(
            request.name(),
            request.currency() != null ? request.currency() : "XAF",
            soldeInitial,
            accountNumber,
            accountType
    );

    return accountRepo.save(account);
}
```

---

## 2. Retrieve All Accounts

**Controller (`AccountController.java`)**
```java
@Operation(summary = "Lister tous les comptes", description = "Récupère la liste de tous les comptes bancaires existants.")
@ApiResponse(responseCode = "200", description = "Liste récupérée avec succès")
@GetMapping
public ResponseEntity<List<Account>> getAllAccounts() {
    return ResponseEntity.ok(accountService.getAllAccounts());
}
```

**Service (`AccountService.java`)**
```java
@Override
public List<Account> getAllAccounts() {
    return accountRepo.findAll();
}
```

---

## 3. Retrieve Account by ID

**Controller (`AccountController.java`)**
```java
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
```

**Service (`AccountService.java`)**
```java
@Override
public Account getAccountById(Long id) {
    return accountRepo.findById(id)
            .orElseThrow(() -> new NotfoundException("Compte introuvable avec l'id : " + id));
}
```

---

## 4. Update an Account

**Controller (`AccountController.java`)**
```java
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
```

**Service (`AccountService.java`)**
```java
@Override
public Account updateAccount(Long id, UpdateAccountRequest request) {
    Account account = getAccountById(id);
    if (request.name() != null && !request.name().trim().isEmpty()) {
        account.setName(request.name());
    }
    return accountRepo.save(account);
}
```

---

## 5. Delete an Account

**Controller (`AccountController.java`)**
```java
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
```

**Service (`AccountService.java`)**
```java
@Override
public void deleteAccount(Long id) {
    Account account = getAccountById(id);
    accountRepo.delete(account);
}
```
