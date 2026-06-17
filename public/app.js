async function api(path, opts = {}) {
  const res = await fetch(path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts));
  if (res.status === 204) return null;
  return res.json();
}

async function createAccount() {
  const name = document.getElementById('name').value.trim();
  const balance = parseFloat(document.getElementById('balance').value) || 0;
  try {
    const data = await api('/api/accounts', { method: 'POST', body: JSON.stringify({ name, balance }) });
    document.getElementById('createResult').innerText = `Created: ${data.name}`;
    document.getElementById('name').value = '';
    document.getElementById('balance').value = '';
    await refreshList();
    setTimeout(() => { document.getElementById('createResult').innerText = ''; }, 3000);
  } catch (e) {
    document.getElementById('createResult').innerText = `Error: ${e.message}`;
  }
}

async function refreshList() {
  const container = document.getElementById('listContainer');
  container.innerText = 'Loading...';
  try {
    const list = await api('/api/accounts');
    if (!Array.isArray(list) || list.length === 0) {
      container.innerText = 'No accounts';
      return;
    }
    const tpl = document.getElementById('rowTpl');
    container.innerHTML = '';
    list.forEach(acc => {
      const node = tpl.content.cloneNode(true);
        node.querySelector('.name').innerText = acc.name;
      const getBtn = node.querySelector('.btn-get');
      const editBtn = node.querySelector('.btn-edit');
      const delBtn = node.querySelector('.btn-del');
      getBtn.addEventListener('click', async () => {
        const full = await api('/api/accounts/' + acc.id);
        // show concise details in the createResult area
        document.getElementById('createResult').innerText = `${full.name} — $${full.balance}`;
        setTimeout(() => { document.getElementById('createResult').innerText = ''; }, 3000);
      });
      editBtn.addEventListener('click', async () => {
        const newName = prompt('New name', acc.name);
        if (newName === null) return;
        const newBal = prompt('New balance', acc.balance);
        if (newBal === null) return;
        await api('/api/accounts/' + acc.id, { method: 'PUT', body: JSON.stringify({ name: newName, balance: Number(newBal) }) });
        await refreshList();
      });
      const transferBtn = document.createElement('button');
      transferBtn.className = 'transfer';
      transferBtn.textContent = 'Transfer';
      transferBtn.addEventListener('click', () => openTransferModal(acc.id));
      node.querySelector('.actions').appendChild(transferBtn);
      delBtn.addEventListener('click', async () => {
        if (!confirm('Delete this account?')) return;
        await api('/api/accounts/' + acc.id, { method: 'DELETE' });
        await refreshList();
      });
      container.appendChild(node);
    });
  } catch (e) {
    container.innerText = 'Error loading accounts';
  }
}

function openTransferModal(defaultFrom) {
  // build modal
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.left = 0; modal.style.top = 0; modal.style.right = 0; modal.style.bottom = 0;
  modal.style.background = 'rgba(0,0,0,0.4)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  const box = document.createElement('div');
  box.style.background = '#fff'; box.style.padding = '1rem'; box.style.borderRadius = '8px'; box.style.minWidth = '320px';
  box.innerHTML = `<h3>Transfer</h3>
    <label>From</label><select id="tfrom"></select>
    <label>To</label><select id="tto"></select>
    <label>Amount</label><input id="tamount" type="number" />
    <label>Description</label><input id="tdesc" />
    <div style="margin-top:.75rem"><button id="tsend">Send</button> <button id="tclose" class="secondary">Cancel</button></div>`;
  modal.appendChild(box);
  document.body.appendChild(modal);

  const tfrom = box.querySelector('#tfrom');
  const tto = box.querySelector('#tto');
  // populate accounts
  api('/api/accounts').then(list => {
    list.forEach(a => {
      const o1 = document.createElement('option'); o1.value = a.id; o1.text = a.name + ' (' + a.id.slice(0,8) + ')'; tfrom.appendChild(o1);
      const o2 = document.createElement('option'); o2.value = a.id; o2.text = a.name + ' (' + a.id.slice(0,8) + ')'; tto.appendChild(o2);
    });
    if (defaultFrom) tfrom.value = defaultFrom;
  });

  box.querySelector('#tclose').addEventListener('click', () => modal.remove());
  box.querySelector('#tsend').addEventListener('click', async () => {
    const from = tfrom.value; const to = tto.value; const amt = box.querySelector('#tamount').value; const desc = box.querySelector('#tdesc').value;
    try {
      await api('/api/accounts/transfer', { method: 'POST', body: JSON.stringify({ from, to, amount: Number(amt), description: desc }) });
      modal.remove();
      await refreshList();
      alert('Transfer successful');
    } catch (e) { alert('Transfer failed: ' + e.message); }
  });
}

// CSV export for transactions of an account
async function exportTransactionsCSV(accountId) {
  const txs = await api('/api/accounts/' + accountId + '/transactions');
  const rows = [['id','type','amount','date','description','counterparty']];
  txs.forEach(t => rows.push([t.id, t.type, t.amount, t.date, (t.description||''), (t.counterparty||'')]));
  const csv = rows.map(r => r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'transactions_'+accountId+'.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

document.getElementById('create').addEventListener('click', createAccount);
document.getElementById('refresh').addEventListener('click', refreshList);
window.addEventListener('load', refreshList);
