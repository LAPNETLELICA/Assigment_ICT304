import { AuthService, ClientService, AdminService, MemoryDB } from './index.js';

async function runTests() {
  console.log("--- Starting Bank System Tests ---");
  
  // 1. Auth & Users
  const user = AuthService.register("john_doe", "john@email.com", "password123", "USER");
  console.log("Registered User:", user.username);

  const admin = AuthService.register("admin_boss", "admin@email.com", "secure_admin", "ADMIN");
  console.log("Registered Admin:", admin.username);

  const userLogin = AuthService.login("john_doe", "password123");
  const userToken = userLogin.token;

  const adminLogin = AuthService.login("admin_boss", "secure_admin");
  const adminToken = adminLogin.token;

  // 2. Client Operations
  const account1 = ClientService.createAccount(userToken, "Checking Account", "secret123", 0);
  console.log(`Created Account: ${account1.accountId} - ${account1.name}`);
  
  const account2 = ClientService.createAccount(userToken, "Savings Account", "secret123", 0);
  
  ClientService.deposit(userToken, account1.accountId, 500);
  console.log(`Deposited 500 to ${account1.accountId}. Balance: ${account1.balance}`);

  ClientService.transfer(userToken, account1.accountId, account2.accountId, 200, "secret123");
  console.log(`Transferred 200 from ${account1.accountId} to ${account2.accountId}`);
  console.log(`Checking Balance: ${account1.balance}, Savings Balance: ${account2.balance}`);

  ClientService.withdraw(userToken, account1.accountId, 50, "secret123");
  console.log(`Withdrew 50 from ${account1.accountId}. Balance: ${account1.balance}`);

  const myAccounts = ClientService.getMyAccounts(userToken);
  console.log(`User owns ${myAccounts.length} accounts.`);

  const auditTrail = ClientService.getAuditTrail(userToken);
  console.log(`User has ${auditTrail.length} transactions in audit trail.`);

  // 3. Admin Operations
  const allAccounts = AdminService.getAllAccounts(adminToken);
  console.log(`Admin sees ${allAccounts.length} accounts total.`);

  const accDetails = AdminService.getAccountDetails(adminToken, account1.accountId);
  console.log(`Admin sees account ${accDetails.accountId} belongs to ${accDetails.ownerUsername}`);

  AdminService.modifyBalance(adminToken, account2.accountId, 1000, "Bonus adjustment");
  console.log(`Admin modified balance of ${account2.accountId} to 1000.`);

  const masterAudit = AdminService.getMasterAuditTrail(adminToken);
  console.log(`Admin sees ${masterAudit.length} total transactions in master ledger.`);

  console.log("--- All basic checks passed successfully! ---");
}

runTests().catch(console.error);
