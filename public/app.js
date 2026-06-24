// Helper: API Request Wrapper
async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const res = await fetch(path, Object.assign({ headers }, opts));
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

// Global Application State
let activeUser = {
  token: localStorage.getItem('token'),
  username: localStorage.getItem('username'),
  role: localStorage.getItem('role') || 'client'
};

// Global Store for Manager view caching
let cachedAccounts = [];
// Manager reveal state: maps accountId -> revealed boolean
let managerRevealState = {};

// Toast Notifications Helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Icon based on toast type
  let iconSVG = '';
  if (type === 'success') {
    iconSVG = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  } else if (type === 'error') {
    iconSVG = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  } else {
    iconSVG = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }

  toast.innerHTML = `
    ${iconSVG}
    <span class="toast-message">${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Slide out and remove
  setTimeout(() => {
    toast.style.animation = 'toastSlideIn 0.3s reverse forwards';
    toast.addEventListener('animationend', () => toast.remove());
  }, 4000);
}

// Router: Dynamic Screen Rendering
function navigate() {
  const authSection = document.getElementById('authSection');
  const clientDashboard = document.getElementById('clientDashboard');
  const managerDashboard = document.getElementById('managerDashboard');
  const appNavbar = document.getElementById('appNavbar');
  
  // Close any open modals when navigating
  closeAllModals();

  if (!activeUser.token) {
    // Show auth screen
    authSection.style.display = 'flex';
    clientDashboard.style.display = 'none';
    managerDashboard.style.display = 'none';
    appNavbar.style.display = 'none';
    return;
  }

  // User is logged in
  authSection.style.display = 'none';
  appNavbar.style.display = 'flex';
  
  // Set navbar profile
  document.getElementById('navUsername').innerText = activeUser.username;
  document.getElementById('navRole').innerText = activeUser.role === 'manager' ? 'System Manager' : 'Client';
  document.getElementById('userAvatar').innerText = activeUser.username.substring(0, 2).toUpperCase();

  if (activeUser.role === 'manager') {
    clientDashboard.style.display = 'none';
    managerDashboard.style.display = 'flex';
    loadManagerDashboard();
  } else {
    clientDashboard.style.display = 'flex';
    managerDashboard.style.display = 'none';
    document.getElementById('clientName').innerText = activeUser.username;
    loadClientDashboard();
  }
}

// --- AUTHENTICATION FLOWS ---

async function handleLogin() {
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value;
  
  if (!u || !p) {
    showToast('Username and password are required', 'error');
    return;
  }
  
  try {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: u, password: p })
    });
    
    // Set user details
    activeUser.token = res.token;
    activeUser.username = res.username;
    activeUser.role = res.role || 'client';
    
    localStorage.setItem('token', res.token);
    localStorage.setItem('username', res.username);
    localStorage.setItem('role', activeUser.role);
    
    showToast(`Welcome back, ${res.username}!`, 'success');
    navigate();
  } catch (e) {
    showToast('Invalid username or password', 'error');
  }
}

async function handleSignup() {
  const u = document.getElementById('username').value.trim();
  const e = document.getElementById('email').value.trim();
  const p = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  
  if (!u || !e || !p) {
    showToast('Username, email, and password are required to register', 'error');
    return;
  }
  
  try {
    await api('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username: u, email: e, password: p, role })
    });
    
    showToast('Registration successful! Please login.', 'success');
    // Clear password only, leave username for easy login
    document.getElementById('password').value = '';
  } catch (e) {
    showToast(e.message || 'Registration failed', 'error');
  }
}

function handleLogout() {
  activeUser = { token: null, username: null, role: 'client' };
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('role');
  
  // Reset form inputs
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  
  showToast('You have been logged out successfully', 'info');
  navigate();
}

// --- CLIENT DASHBOARD FLOWS ---

async function loadClientDashboard() {
  const grid = document.getElementById('clientAccountsGrid');
  grid.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <span>Loading accounts...</span>
    </div>
  `;
  
  try {
    const list = await api(`/api/accounts?owner_id=${activeUser.token}`);
    
    // Update stats
    let totalBal = 0;
    list.forEach(a => totalBal += (a.balance || 0));
    
    document.getElementById('clientTotalBalance').innerText = formatCurrency(totalBal);
    document.getElementById('clientTotalAccounts').innerText = list.length;
    
    // Count transactions across all client accounts
    let totalTxCount = 0;
    const txPromises = list.map(a => api(`/api/accounts/${a.id}/transactions`).catch(() => []));
    const allTxs = await Promise.all(txPromises);
    allTxs.forEach(txs => totalTxCount += txs.length);
    document.getElementById('clientTotalTransactions').innerText = totalTxCount;

    if (list.length === 0) {
      grid.innerHTML = `
        <div class="loading-state">
          <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted);"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <h3>No accounts found</h3>
          <p>Create your first bank account to begin depositing and transferring funds.</p>
          <button onclick="openModal('createAccountModal')" class="btn btn-primary btn-small" style="margin-top: 1rem;">
            Create Account
          </button>
        </div>
      `;
      return;
    }

    grid.innerHTML = '';
    list.forEach(acc => {
      const card = document.createElement('div');
      card.className = 'bank-card';
      
      // Mask account ID for visual aesthetics
      const maskedId = `${acc.id.substring(0, 4)} •••• •••• ${acc.id.substring(acc.id.length - 4)}`;
      
      card.innerHTML = `
        <div class="bank-card-header">
          <span class="bank-card-type">${acc.name}</span>
          <div class="bank-card-chip"></div>
        </div>
        <div class="bank-card-number">${maskedId}</div>
        <div class="bank-card-footer">
          <div>
            <div class="bank-card-balance-label">Available Balance</div>
            <div class="bank-card-balance">${formatCurrency(acc.balance)}</div>
          </div>
          <button class="btn-card-more" onclick="openEditAccountName('${acc.id}', '${acc.name}')" title="Edit account name">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
        </div>
        <div class="card-actions-overlay">
          <button class="btn btn-primary" onclick="openTxModal('${acc.id}', '${acc.name}', 'deposit')">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Deposit</span>
          </button>
          <button class="btn btn-secondary" onclick="openTxModal('${acc.id}', '${acc.name}', 'withdraw')">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Withdraw</span>
          </button>
          <button class="btn btn-accent" onclick="openActivityLog('${acc.id}', '${acc.name}', ${acc.balance})">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <span>Logs</span>
          </button>
          <button class="btn btn-danger" onclick="handleDeleteAccount('${acc.id}', '${acc.name}')">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            <span>Delete</span>
          </button>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (e) {
    grid.innerHTML = `
      <div class="loading-state">
        <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-rose);"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <h3>Error loading portfolio</h3>
        <p>${e.message || 'Check database connection.'}</p>
      </div>
    `;
  }
}

async function handleCreateAccount() {
  const name = document.getElementById('newAccountName').value.trim();
  const initialDeposit = parseFloat(document.getElementById('newAccountBalance').value);
  const accountPassword = document.getElementById('newAccountPassword').value;
  
  if (!name) {
    showToast('Account name is required', 'error');
    return;
  }
  if (!accountPassword) {
    showToast('Account password is required', 'error');
    return;
  }
  if (isNaN(initialDeposit) || initialDeposit < 0) {
    showToast('Invalid initial deposit amount', 'error');
    return;
  }
  
  try {
    await api('/api/accounts', {
      method: 'POST',
      body: JSON.stringify({
        name,
        initialDeposit,
        accountPassword,
        owner_id: activeUser.token
      })
    });
    
    showToast(`Successfully created "${name}" with ${formatCurrency(initialDeposit)} initial deposit!`, 'success');
    document.getElementById('newAccountPassword').value = '';
    closeModal('createAccountModal');
    loadClientDashboard();
  } catch (e) {
    showToast(e.message || 'Failed to create account', 'error');
  }
}

// --- DEPOSIT MODAL LOGIC ---

async function openDepositModal() {
  const sel = document.getElementById('depositAccountSelect');
  sel.innerHTML = '<option value="">Loading accounts...</option>';
  document.getElementById('depositAmount').value = '';
  document.getElementById('depositDescription').value = '';

  try {
    const accounts = await api(`/api/accounts?owner_id=${activeUser.token}`);
    sel.innerHTML = '<option value="">Choose account to deposit into...</option>';
    if (accounts.length === 0) {
      sel.innerHTML = '<option value="">No accounts found — create one first</option>';
    } else {
      accounts.forEach(acc => {
        const opt = document.createElement('option');
        opt.value = acc.id;
        opt.text = `${acc.name}  —  ${formatCurrency(acc.balance)}`;
        sel.appendChild(opt);
      });
    }
    openModal('depositModal');
  } catch (e) {
    showToast('Failed to load accounts for deposit', 'error');
  }
}

async function handleDeposit() {
  const accountId = document.getElementById('depositAccountSelect').value;
  const amount = parseFloat(document.getElementById('depositAmount').value);
  const description = document.getElementById('depositDescription').value.trim();

  if (!accountId) {
    showToast('Please select an account', 'error');
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    showToast('Please enter a valid deposit amount', 'error');
    return;
  }

  try {
    await api(`/api/accounts/${accountId}/transactions`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'deposit',
        amount,
        description: description || 'Deposit via Web Portal'
      })
    });
    showToast(`Deposited ${formatCurrency(amount)} successfully!`, 'success');
    closeModal('depositModal');
    loadClientDashboard();
  } catch (e) {
    showToast(e.message || 'Deposit failed', 'error');
  }
}

// Open specific Deposit/Withdraw transaction modal
function openTxModal(id, name, type) {
  document.getElementById('txAccountId').value = id;
  document.getElementById('txType').value = type;
  document.getElementById('txAccountName').innerText = name;
  document.getElementById('txModalTitle').innerText = type === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds';
  document.getElementById('txAmount').value = '';
  document.getElementById('txDescription').value = '';
  document.getElementById('txAccountPassword').value = '';
  
  const pwdGroup = document.getElementById('txPasswordGroup');
  if (type === 'withdraw') {
    pwdGroup.style.display = 'block';
  } else {
    pwdGroup.style.display = 'none';
  }
  
  openModal('txModal');
}

async function handleTransaction() {
  const id = document.getElementById('txAccountId').value;
  const type = document.getElementById('txType').value;
  const amount = parseFloat(document.getElementById('txAmount').value);
  const description = document.getElementById('txDescription').value.trim();
  const accountPassword = document.getElementById('txAccountPassword').value;
  
  if (isNaN(amount) || amount <= 0) {
    showToast('Please enter a valid amount greater than 0', 'error');
    return;
  }
  if (type === 'withdraw' && !accountPassword) {
    showToast('Account password is required for withdrawals', 'error');
    return;
  }
  
  try {
    await api(`/api/accounts/${id}/transactions`, {
      method: 'POST',
      body: JSON.stringify({
        type,
        amount,
        accountPassword,
        description: description || `${type.charAt(0).toUpperCase() + type.slice(1)} via UI`
      })
    });
    
    showToast(`Successfully processed ${type} of ${formatCurrency(amount)}`, 'success');
    closeModal('txModal');
    loadClientDashboard();
  } catch (e) {
    showToast(e.message || 'Transaction failed', 'error');
  }
}

// Transfer Funds Modal Logic
async function openTransferFunds() {
  const fromSelect = document.getElementById('transferFromSelect');
  const toSelect = document.getElementById('transferToSelect');
  
  // Clear select dropdowns
  fromSelect.innerHTML = '<option value="">Select source account</option>';
  toSelect.innerHTML = '<option value="">Select destination account</option>';
  
  document.getElementById('transferToInput').value = '';
  document.getElementById('transferAmount').value = '';
  document.getElementById('transferDescription').value = '';
  document.getElementById('transferAccountPassword').value = '';
  
  try {
    // 1. Fetch current client accounts
    const clientAccounts = await api(`/api/accounts?owner_id=${activeUser.token}`);
    clientAccounts.forEach(acc => {
      const opt = document.createElement('option');
      opt.value = acc.id;
      opt.text = `${acc.name} (${formatCurrency(acc.balance)})`;
      fromSelect.appendChild(opt);
    });

    // 2. Fetch all system accounts for destination dropdown
    const allAccounts = await api('/api/accounts');
    allAccounts.forEach(acc => {
      // Don't show accounts owned by self in destination list to keep lists clean,
      // but they can still select another account of their own.
      const opt = document.createElement('option');
      opt.value = acc.id;
      const ownerLabel = acc.owner_id === activeUser.token ? 'My Account' : 'Other User';
      opt.text = `${acc.name} — ${ownerLabel} (${acc.id.substring(0,8)})`;
      toSelect.appendChild(opt);
    });

    openModal('transferModal');
  } catch (e) {
    showToast('Failed to initialize transfer forms', 'error');
  }
}

async function handleTransfer() {
  const from = document.getElementById('transferFromSelect').value;
  let to = document.getElementById('transferToSelect').value;
  const directInput = document.getElementById('transferToInput').value.trim();
  const amount = parseFloat(document.getElementById('transferAmount').value);
  const description = document.getElementById('transferDescription').value.trim();
  const accountPassword = document.getElementById('transferAccountPassword').value;
  
  if (!from) {
    showToast('Source account is required', 'error');
    return;
  }
  
  // Prefer direct paste input if provided
  if (directInput) {
    to = directInput;
  }
  
  if (!to) {
    showToast('Destination account is required', 'error');
    return;
  }
  
  if (from === to) {
    showToast('Cannot transfer money to the same account', 'error');
    return;
  }
  
  if (isNaN(amount) || amount <= 0) {
    showToast('Please enter a valid amount greater than 0', 'error');
    return;
  }

  if (!accountPassword) {
    showToast('Source account password is required', 'error');
    return;
  }
  
  try {
    await api('/api/accounts/transfer', {
      method: 'POST',
      body: JSON.stringify({
        from,
        to,
        amount,
        accountPassword,
        description: description || 'Transfer via Web Portal'
      })
    });
    
    showToast(`Transferred ${formatCurrency(amount)} successfully!`, 'success');
    closeModal('transferModal');
    loadClientDashboard();
  } catch (e) {
    showToast(e.message || 'Transfer failed', 'error');
  }
}

// Edit Account Name Modal Logic
function openEditAccountName(id, name) {
  document.getElementById('editAccountId').value = id;
  document.getElementById('editAccountNameInput').value = name;
  openModal('editAccountModal');
}

async function handleSaveAccountName() {
  const id = document.getElementById('editAccountId').value;
  const newName = document.getElementById('editAccountNameInput').value.trim();
  
  if (!newName) {
    showToast('Account name cannot be blank', 'error');
    return;
  }
  
  try {
    await api(`/api/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: newName })
    });
    
    showToast('Account name updated successfully', 'success');
    closeModal('editAccountModal');
    
    // Refresh whichever dashboard is active
    if (activeUser.role === 'manager') {
      loadManagerDashboard();
    } else {
      loadClientDashboard();
    }
  } catch (e) {
    showToast(e.message || 'Failed to update account name', 'error');
  }
}

// Delete Account Handler
async function handleDeleteAccount(id, name) {
  // only allow immediate delete for client owners; managers must re-auth
  if (activeUser.role === 'manager') {
    // open manager auth modal and set flag
    document.getElementById('managerAuthAccountId').value = `DELETE:${id}`;
    document.getElementById('managerAuthPassword').value = '';
    openModal('managerAuthModal');
    return;
  }

  (async () => {
    const ok = confirm(`Are you absolutely sure you want to delete "${name}"?\nThis action will also delete all associated transactions and cannot be undone.`);
    if (!ok) return;
    try {
      await api(`/api/accounts/${id}`, { method: 'DELETE' });
      showToast(`Account "${name}" deleted successfully`, 'info');
      if (activeUser.role === 'manager') {
        loadManagerDashboard();
      } else {
        loadClientDashboard();
      }
    } catch (e) {
      showToast(e.message || 'Failed to delete account', 'error');
    }
  })();
}

function promptManagerAuth(accountId) {
  document.getElementById('managerAuthAccountId').value = accountId;
  document.getElementById('managerAuthPassword').value = '';
  openModal('managerAuthModal');
}

function promptManagerAuthDelete(accountId, name) {
  document.getElementById('managerAuthAccountId').value = `DELETE:${accountId}`;
  document.getElementById('managerAuthPassword').value = '';
  openModal('managerAuthModal');
}

// --- ACTIVITY LOG & TIMELINE LOGIC ---

async function openActivityLog(id, name, balance) {
  const timelineList = document.getElementById('timelineList');
  const title = document.getElementById('timelineModalTitle');
  const subtitle = document.getElementById('timelineModalSubtitle');
  const balDisplay = document.getElementById('timelineAccountBalance');
  
  title.innerText = `Activity Log: ${name}`;
  subtitle.innerText = `Account ID: ${id}`;
  balDisplay.innerText = formatCurrency(balance);
  
  timelineList.innerHTML = `
    <div class="loading-state" style="padding: 2rem;">
      <div class="spinner"></div>
      <span>Retrieving transaction history...</span>
    </div>
  `;
  
  // Cache the account ID on the Export Button for easy extraction
  document.getElementById('exportCsvBtn').onclick = () => exportTransactionsCSV(id, name);
  
  openModal('timelineModal');
  
  try {
    const txs = await api(`/api/accounts/${id}/transactions`);
    
    if (!txs || txs.length === 0) {
      timelineList.innerHTML = `
        <div class="timeline-empty">
          No transactions recorded for this account.
        </div>
      `;
      return;
    }
    
    timelineList.innerHTML = '';
    txs.forEach(tx => {
      const item = document.createElement('div');
      item.className = 'timeline-item';
      
      const isDeposit = tx.type === 'deposit' || tx.type === 'transfer-in';
      const typeClass = tx.type.toLowerCase();
      const amountSign = isDeposit ? '+' : '-';
      const amountClass = isDeposit ? 'income' : 'expense';
      
      // Select appropriate icon
      let typeIcon = '';
      if (tx.type === 'deposit') {
        typeIcon = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
      } else if (tx.type === 'withdraw') {
        typeIcon = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>';
      } else {
        typeIcon = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20L20.2 3.8M21 16v5h-5M4 4l16.2 16.2"/></svg>';
      }
      
      const formattedDate = new Date(tx.date).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      item.innerHTML = `
        <div class="timeline-badge ${typeClass}">
          ${typeIcon}
        </div>
        <div class="timeline-info">
          <div class="timeline-title-row">
            <span>${tx.type.toUpperCase().replace('-', ' ')}</span>
            <span class="timeline-amount ${amountClass}">${amountSign}${formatCurrency(tx.amount)}</span>
          </div>
          <div class="timeline-desc">${tx.description || 'N/A'}</div>
          <div class="timeline-meta">
            <span>Date: ${formattedDate}</span>
            <span>Ref: #${tx.id.substring(0, 8)}</span>
          </div>
        </div>
      `;
      timelineList.appendChild(item);
    });
  } catch (e) {
    timelineList.innerHTML = `
      <div class="timeline-empty" style="color: var(--color-rose);">
        Failed to load activity logs: ${e.message}
      </div>
    `;
  }
}

// CSV export for transactions of an account
async function exportTransactionsCSV(accountId, accountName) {
  try {
    const txs = await api(`/api/accounts/${accountId}/transactions`);
    if (!txs || txs.length === 0) {
      showToast('No transactions to export', 'info');
      return;
    }
    const rows = [['Transaction ID', 'Type', 'Amount ($)', 'Date', 'Description', 'Counterparty ID']];
    txs.forEach(t => {
      rows.push([
        t.id,
        t.type,
        t.amount,
        t.date,
        t.description || '',
        t.counterparty || ''
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ApexVault_TX_${accountName.replace(/\s+/g, '_')}_${accountId.substring(0,8)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('CSV Exported successfully', 'success');
  } catch (e) {
    showToast('Failed to export transactions CSV', 'error');
  }
}

// --- MANAGER AUDIT FLOWS ---

// Global user map: id -> username, populated by loadManagerDashboard
let userMap = {};

async function loadManagerDashboard() {
  const tableBody = document.getElementById('managerAccountsTableBody');
  tableBody.innerHTML = `
    <tr>
      <td colspan="5" class="table-loading">
        <div class="spinner" style="margin: 0 auto 1rem auto;"></div>
        Retrieving system bank records...
      </td>
    </tr>
  `;

  try {
    // Fetch all accounts AND all users in parallel
    const [list, users] = await Promise.all([
      api('/api/accounts'),
      api('/api/auth/users').catch(() => [])
    ]);

    // Build a map: userId -> username
    userMap = {};
    (users || []).forEach(u => { userMap[u.id] = u.username; });

    cachedAccounts = list;
    renderManagerRegistryTable(list);
  } catch (e) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="table-loading" style="color: var(--color-rose);">
          System database error: ${e.message}
        </td>
      </tr>
    `;
  }
}

// Retrieve by ID — called from manager dashboard
async function handleRetrieveById() {
  const input = document.getElementById('retrieveByIdInput').value.trim();
  const resultBox = document.getElementById('retrieveByIdResult');

  if (!input) {
    showToast('Please enter an Account UUID', 'error');
    return;
  }

  resultBox.style.display = 'none';
  resultBox.innerHTML = '';

  try {
    const acc = await api(`/api/accounts/${input}`);
    const ownerName = acc.owner_id
      ? (userMap[acc.owner_id] || acc.owner_id.substring(0, 8) + '...')
      : 'System Shared';
    resultBox.style.display = 'block';
    resultBox.innerHTML = `
      <div class="retrieve-result-card">
        <div class="retrieve-result-title">&#10003; Account Found</div>
        <div class="retrieve-result-grid">
          <span class="r-label">Account ID</span><span class="r-value mono">${acc.id}</span>
          <span class="r-label">Account Name</span><span class="r-value"><strong>${acc.name}</strong></span>
          <span class="r-label">Owner Username</span><span class="r-value">${ownerName}</span>
          <span class="r-label">Balance</span><span class="r-value balance-highlight">${formatCurrency(acc.balance)}</span>
        </div>
        <div class="retrieve-result-actions">
          <button class="btn btn-secondary btn-small" onclick="openActivityLog('${acc.id}','${acc.name}',${acc.balance})">View Logs</button>
          <button class="btn btn-secondary btn-small" onclick="openEditAccountName('${acc.id}','${acc.name}')">Edit Name</button>
          <button class="btn btn-danger btn-small" onclick="promptManagerAuthDelete('${acc.id}','${acc.name}')">Delete</button>
        </div>
      </div>
    `;
    showToast('Account retrieved successfully', 'success');
  } catch (e) {
    resultBox.style.display = 'block';
    resultBox.innerHTML = `<div class="retrieve-result-error">&#10007; No account found with that ID. ${e.message}</div>`;
  }
}

function renderManagerRegistryTable(accounts) {
  const tableBody = document.getElementById('managerAccountsTableBody');

  if (accounts.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 3rem;">
          No bank accounts found matching the criteria.
        </td>
      </tr>
    `;
    document.getElementById('managerTotalBalance').innerText = '$0.00';
    document.getElementById('managerTotalAccounts').innerText = '0';
    document.getElementById('managerTotalClients').innerText = '0';
    return;
  }

  tableBody.innerHTML = '';
  let totalBalance = 0;
  const uniqueOwners = new Set();

  accounts.forEach(acc => {
    totalBalance += (acc.balance || 0);
    if (acc.owner_id) uniqueOwners.add(acc.owner_id);

    const ownerUsername = acc.owner_id
      ? (userMap[acc.owner_id] || acc.owner_id.substring(0, 8) + '...')
      : 'System';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <button class="copy-id-btn" title="Click to copy full ID: ${acc.id}" onclick="copyToClipboard('${acc.id}', this)">
          <span class="mono">${acc.id.substring(0, 12)}...</span>
          <svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
      </td>
      <td><strong>${acc.name}</strong></td>
      <td><span class="owner-badge">${ownerUsername}</span></td>
      <td class="acc-balance">${formatCurrency(acc.balance)}</td>
      <td>
        <div class="actions" style="gap: 0.35rem;">
          <button class="btn btn-secondary btn-small" onclick="openActivityLog('${acc.id}', '${acc.name}', ${acc.balance})" title="View audit log">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <span>Audit</span>
          </button>
          <button class="btn btn-secondary btn-small" onclick="openEditAccountName('${acc.id}', '${acc.name}')" title="Update account name">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            <span>Update</span>
          </button>
          <button class="btn btn-danger btn-small" onclick="promptManagerAuthDelete('${acc.id}', '${acc.name}')" title="Delete account">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            <span>Delete</span>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });

  document.getElementById('managerTotalBalance').innerText = formatCurrency(totalBalance);
  document.getElementById('managerTotalAccounts').innerText = accounts.length;
  document.getElementById('managerTotalClients').innerText = uniqueOwners.size;
}

// Copy account ID to clipboard
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = '<span style="color:var(--color-emerald)">&#10003; Copied!</span>';
    setTimeout(() => { btn.innerHTML = orig; }, 2000);
    showToast('Account ID copied to clipboard', 'success');
  }).catch(() => {
    showToast('Could not copy — please copy manually: ' + text, 'info');
  });
}

// Manager search registry filtering (searches by name, id, or resolved username)
function handleManagerSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  if (!query) {
    renderManagerRegistryTable(cachedAccounts);
    return;
  }

  const filtered = cachedAccounts.filter(acc => {
    const nameMatch = acc.name.toLowerCase().includes(query);
    const idMatch = acc.id.toLowerCase().includes(query);
    const ownerIdMatch = acc.owner_id && acc.owner_id.toLowerCase().includes(query);
    const usernameMatch = acc.owner_id && userMap[acc.owner_id] && userMap[acc.owner_id].toLowerCase().includes(query);
    return nameMatch || idMatch || ownerIdMatch || usernameMatch;
  });

  renderManagerRegistryTable(filtered);
}

// --- MODAL UTILITIES ---

function openModal(modalId) {
  document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

function closeAllModals() {
  const backdrops = document.querySelectorAll('.modal-backdrop');
  backdrops.forEach(modal => modal.style.display = 'none');
}

// --- HELPERS ---

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(val || 0);
}

// --- EVENT REGISTRATION & INITIALIZATION ---

window.addEventListener('load', () => {
  // Navigation & Init
  navigate();
  
  // Auth Submit listeners
  document.getElementById('loginBtn').addEventListener('click', handleLogin);
  document.getElementById('signupBtn').addEventListener('click', handleSignup);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  
  // Client Dashboard actions
  document.getElementById('triggerCreateAccBtn').addEventListener('click', () => {
    document.getElementById('newAccountName').value = '';
    document.getElementById('newAccountBalance').value = '100';
    openModal('createAccountModal');
  });
  document.getElementById('submitCreateAccountBtn').addEventListener('click', handleCreateAccount);
  document.getElementById('submitTxBtn').addEventListener('click', handleTransaction);
  
  document.getElementById('triggerTransferBtn').addEventListener('click', openTransferFunds);
  document.getElementById('submitTransferBtn').addEventListener('click', handleTransfer);
  
  document.getElementById('submitEditAccountBtn').addEventListener('click', handleSaveAccountName);
  
  document.getElementById('refreshClientBtn').addEventListener('click', loadClientDashboard);
  document.getElementById('refreshManagerBtn').addEventListener('click', loadManagerDashboard);

  // Manager search action
  document.getElementById('managerSearchInput').addEventListener('input', handleManagerSearch);

  // Manager Retrieve by ID
  document.getElementById('retrieveByIdBtn').addEventListener('click', handleRetrieveById);
  document.getElementById('retrieveByIdInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleRetrieveById();
  });

  // Deposit button
  document.getElementById('triggerDepositBtn').addEventListener('click', openDepositModal);
  document.getElementById('submitDepositBtn').addEventListener('click', handleDeposit);

  // Password eye toggle
  document.getElementById('togglePasswordBtn').addEventListener('click', () => {
    const pwdInput = document.getElementById('password');
    const showIcon = document.getElementById('eyeIconShow');
    const hideIcon = document.getElementById('eyeIconHide');
    if (pwdInput.type === 'password') {
      pwdInput.type = 'text';
      showIcon.style.display = 'none';
      hideIcon.style.display = 'block';
    } else {
      pwdInput.type = 'password';
      showIcon.style.display = 'block';
      hideIcon.style.display = 'none';
    }
  });

  // Manager auth modal wiring
  document.getElementById('managerAuthSubmitBtn').addEventListener('click', async () => {
    const pwd = document.getElementById('managerAuthPassword').value;
    const accountId = document.getElementById('managerAuthAccountId').value;
    if (!pwd) {
      showToast('Password required', 'error');
      return;
    }
    try {
      // verify by logging in (reuse login endpoint)
      const res = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: activeUser.username, password: pwd }) });
      if (!res || res.role !== 'manager') throw new Error('Invalid manager credentials');

      // if accountId is special token 'DELETE:<id>' perform delete
      if (accountId && accountId.startsWith('DELETE:')) {
        const idToDelete = accountId.split(':')[1];
        await api(`/api/accounts/${idToDelete}`, { method: 'DELETE' });
        showToast('Account deleted', 'success');
        closeModal('managerAuthModal');
        loadManagerDashboard();
        return;
      }

      // Otherwise toggle reveal state for that account
      if (accountId) {
        managerRevealState[accountId] = !managerRevealState[accountId];
      }
      closeModal('managerAuthModal');
      renderManagerRegistryTable(cachedAccounts);
    } catch (e) {
      showToast(e.message || 'Manager authentication failed', 'error');
    }
  });
  
  // Wire up all modal background and close-button dismiss events
  const modals = document.querySelectorAll('.modal-backdrop');
  modals.forEach(modal => {
    // Close on click of close button
    const closeBtns = modal.querySelectorAll('.modal-close-btn');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => modal.style.display = 'none');
    });
    
    // Close on click of background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
});
