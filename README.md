# Banking System API - Beginner's Guide

Welcome to the **Banking System API** project! This README is specifically designed for beginners. It explains what this project is, defines the technical terms you need to know, and breaks down what each part of the code does based on the recent updates.

---

## 📖 1. What is this project?
This is a **Spring Boot** application. Spring Boot is a popular Java framework used to build web applications and APIs quickly. Specifically, this project is a **REST API** (Representational State Transfer Application Programming Interface) that manages bank accounts. It allows you to:
- **Create** a new bank account.
- **Read** (get) a list of all accounts or a specific account.
- **Update** an account's name.
- **Delete** an account.

Because you hosted this on **Render**, anyone on the internet can interact with this API using your public Render link.

---

## 🧠 2. Essential Terms for Beginners

Before looking at the code, let's understand some important concepts used in this project:

- **API (Application Programming Interface)**: A set of rules that allows different software applications to talk to each other. Think of it as a waiter in a restaurant: you give the waiter your order (Request), the waiter goes to the kitchen (System), and brings your food back to you (Response).
- **Endpoint**: A specific URL where your API can be accessed. For example, `https://your-app.onrender.com/api/accounts`.
- **HTTP Methods**: The verbs used to tell the API what action to perform:
  - **GET**: Retrieve data (e.g., getting the list of accounts).
  - **POST**: Send new data to create something (e.g., creating a new account).
  - **PUT**: Update existing data (e.g., changing the name on an account).
  - **DELETE**: Remove data.
- **DTO (Data Transfer Object)**: A simple object used to carry data between the client (the user) and the server. It only contains the exact data we need to send or receive, nothing more.
- **Dependency Injection**: A technique where Spring Boot automatically provides the objects a class needs to work, rather than the class creating them itself. (You see this with `@RequiredArgsConstructor` and `private final` fields).
- **Swagger**: A tool that automatically reads your code and creates a beautiful, interactive web page (`/swagger-ui.html`) where you can test your API endpoints visually without writing code.

---

## 🏗️ 3. How the Code is Organized (Architecture)

Spring Boot applications are usually divided into "Layers". Each file is in a specific folder (package) based on its job. Let's break down the files we worked on.

### A. The Entity Layer (`Entity/Account.java`)
**What it does:** This is the blueprint of what a Bank Account looks like in the database.
- `@Entity` and `@Table(name = "accounts")`: Tells the database, "Please create a table named 'accounts' to store this data."
- `@Id` and `@GeneratedValue`: Automatically generates a unique ID (1, 2, 3...) for every new account.
- Other fields like `accountNumber`, `accountType`, `status`, `name`, `currency`, and `solde` (balance) represent the columns in the database table to make it a realistic bank account.

### B. The DTO Layer (`dto/CreateAccountRequest.java` & `dto/UpdateAccountRequest.java`)
**What it does:** These files define the exact structure of the JSON data we expect the user to send us when they want to create or update an account.
- For example, when you added `UpdateAccountRequest`, you told the system: "When someone wants to update an account, they only need to send me the new `name`."
- We use Java `record` here because it's a modern, lean way to create data-holding classes without writing boilerplate code (like getters and setters).

### C. The Repository Layer (`repository/AccountRepo.java`)
**What it does:** This is the bridge between your Java code and the SQL Database.
- By extending `JpaRepository`, Spring Boot automatically writes all the SQL queries (SELECT, INSERT, UPDATE, DELETE) for you. You don't have to write a single line of database code!

### D. The Service Layer (`service/AccountService.java` & `IAccountService.java`)
**What it does:** This is the **Brain** of your application. It contains the "Business Logic". The Controller asks the Service to do the work.
- `IAccountService` is an **Interface**. Think of it as a contract that lists all the abilities the service *must* have (create, read, update, delete).
- `AccountService` is the actual worker that implements that contract.
  - **`createAccount`**: Generates a unique `accountNumber` automatically, checks the starting balance, assigns an `accountType` and `status`, creates a new `Account` object, then asks the Repository to save it.
  - **`getAccountById`**: Asks the Repository to find an account. If it doesn't exist, it throws a `NotfoundException` (Error 404).
  - **`updateAccount`**: (What we added!). It first finds the account. If a new name was provided in the request, it changes the name. Finally, it saves the updated account back to the database.
  - **`deleteAccount`**: (What we added!). It finds the account, then tells the Repository to delete it.

### E. The Controller Layer (`controller/AccountController.java`)
**What it does:** This is the **Receptionist**. It waits for HTTP requests from the internet (like from Swagger or Render), takes the user's data, passes it to the Service, and then returns the final response back to the user.
- `@RestController`: Tells Spring Boot "This class is a Web Controller".
- `@RequestMapping("/api/accounts")`: Means every URL in this class will start with `/api/accounts`.
- **The Swagger Annotations (`@Operation`, `@ApiResponse`)**: (What we added!). These are purely for documentation. They tell Swagger what summary to display on the visual interface so human users understand what the endpoint does.
- **`@PostMapping`, `@GetMapping`, `@PutMapping`, `@DeleteMapping`**: Link the HTTP methods to your Java functions. When a DELETE request comes to `/api/accounts/1`, Spring Boot automatically triggers the `deleteAccount` function in this file.

---

## 🎯 4. Summary of What We Achieved Together

Based on your assignment, here is exactly what we did:
1. **Completed the API:** The application previously only allowed users to Create and Read accounts. We wrote the code to allow **Updating** (PUT) and **Deleting** (DELETE) accounts, completing the full "CRUD" (Create, Read, Update, Delete) cycle.
2. **Documented with Swagger:** We added OpenAPI annotations to the `AccountController`, generating a professional, clickable interface for testing.
3. **Generated Test Cases:** We defined Functional and Non-Functional specifications for all 5 endpoints to formalize how the system should behave under both normal and error conditions.
4. **Deployed & Tested:** We pushed the code to your GitHub repository so that **Render** could automatically pull it, build the application, and host it live on the internet!

---
*Happy coding! Understanding these basics is the perfect first step into backend engineering.*
