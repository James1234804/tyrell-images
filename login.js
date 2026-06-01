// ============================================
// TYRELL IMAGES — LOGIN PAGE
// Requires: db.js loaded first
// ============================================

let currentRole = 'client';

function setRole(role) {
  currentRole = role;
  document.getElementById('btn-client').classList.toggle('active', role === 'client');
  document.getElementById('btn-photographer').classList.toggle('active', role === 'photographer');
}

async function handleLogin() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errEl    = document.getElementById('error-msg');
  const btnText  = document.getElementById('btn-text');
  const btnLoader = document.getElementById('btn-loader');

  errEl.classList.add('hidden');

  if (!username || !password) {
    errEl.textContent = 'Please enter username and password.';
    errEl.classList.remove('hidden');
    return;
  }

  btnText.classList.add('hidden');
  btnLoader.classList.remove('hidden');

  if (currentRole === 'photographer') {
    if (username === 'tyrellphotog' && password === 'tyrell2024') {
      sessionStorage.setItem('role', 'photographer');
      sessionStorage.setItem('username', username);
      window.location.href = 'photographer-dashboard.html';
    } else {
      errEl.textContent = 'Invalid photographer credentials.';
      errEl.classList.remove('hidden');
      btnText.classList.remove('hidden');
      btnLoader.classList.add('hidden');
    }
  } else {
    const result = await loginClient(username, password);
    if (result.success) {
      sessionStorage.setItem('role', 'client');
      sessionStorage.setItem('clientId', result.client.id);
      sessionStorage.setItem('clientName', result.client.name);
      window.location.href = 'client-dashboard.html';
    } else {
      errEl.textContent = result.error || 'Invalid username or password.';
      errEl.classList.remove('hidden');
      btnText.classList.remove('hidden');
      btnLoader.classList.add('hidden');
    }
  }
}

// Allow Enter key to submit
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleLogin();
});
