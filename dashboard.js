 // ============================================
// TYRELL IMAGES — PHOTOGRAPHER DASHBOARD UI
// Requires: db.js loaded first
// ============================================

// ── AUTH GUARD ────────────────────────────────

if (sessionStorage.getItem('role') !== 'photographer') {
  window.location.href = 'login.html';
}

// ── STATE ─────────────────────────────────────

let selectedFiles = [];

// ── SIDEBAR / MOBILE DRAWER ───────────────────

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const burger  = document.getElementById('burger-btn');
  if (sidebar.classList.contains('open')) {
    closeSidebar();
  } else {
    sidebar.classList.add('open');
    overlay.classList.add('visible');
    burger.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
  document.getElementById('burger-btn').classList.remove('open');
  document.body.style.overflow = '';
}

// ── TABS ──────────────────────────────────────

function showTab(tab, el) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  if (el) el.classList.add('active');
  const titles = { clients: 'Clients', upload: 'Upload Photos', gallery: 'All Photos' };
  document.getElementById('tab-title').textContent = titles[tab];
  if (tab === 'gallery') loadAllPhotos();
  closeSidebar();
}

// ── CLIENTS ───────────────────────────────────

async function createNewClient() {
  const name     = document.getElementById('client-name').value.trim();
  const username = document.getElementById('client-username').value.trim();
  const password = document.getElementById('client-password').value.trim();

  if (!name || !username || !password) {
    showMsg('client-msg', 'Please fill in all fields.', 'error');
    return;
  }

  const result = await addClient(name, username, password);
  if (result.success) {
    showMsg('client-msg', `Client "${name}" created successfully!`, 'success');
    document.getElementById('client-name').value     = '';
    document.getElementById('client-username').value = '';
    document.getElementById('client-password').value = '';
    loadClients();
    loadClientSelects();
  } else {
    showMsg('client-msg', result.error || 'Failed to create client.', 'error');
  }
}

async function loadClients() {
  const list    = document.getElementById('clients-list');
  const clients = await getClients();

  if (!clients.length) {
    list.innerHTML = '<p class="empty-state">No clients yet. Add your first client above!</p>';
    return;
  }

  list.innerHTML = clients.map(c => `
    <div class="client-row">
      <div class="client-avatar">${c.name.charAt(0).toUpperCase()}</div>
      <div class="client-info">
        <strong>${c.name}</strong>
        <span>@${c.username}</span>
      </div>
      <div class="client-actions">
        <button class="btn-ghost" onclick="viewClientPhotos('${c.id}')">View Photos</button>
        <button class="btn-danger" onclick="deleteClient('${c.id}', '${c.name}')">Delete</button>
      </div>
    </div>
  `).join('');
}

async function loadClientSelects() {
  const clients = await getClients();
  const opts    = clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  document.getElementById('upload-client-select').innerHTML  = '<option value="">Select a client...</option>' + opts;
  document.getElementById('gallery-client-filter').innerHTML = '<option value="">All Clients</option>' + opts;
}

async function deleteClient(id, name) {
  if (!confirm(`Delete client "${name}" and all their photos?`)) return;
  const result = await removeClient(id);
  if (result.success) { loadClients(); loadClientSelects(); }
  else alert('Failed to delete: ' + result.error);
}

function viewClientPhotos(clientId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-gallery').classList.add('active');
  document.querySelectorAll('.nav-item')[2].classList.add('active');
  document.getElementById('tab-title').textContent = 'All Photos';
  document.getElementById('gallery-client-filter').value = clientId;
  loadAllPhotos();
  closeSidebar();
}

// ── UPLOAD ────────────────────────────────────

function handleFileSelect() {
  selectedFiles = Array.from(document.getElementById('photo-files').files);
  const preview = document.getElementById('file-preview');

  if (!selectedFiles.length) { preview.classList.add('hidden'); return; }

  preview.classList.remove('hidden');
  preview.innerHTML = selectedFiles.map(f => `
    <div class="preview-item">
      <img src="${URL.createObjectURL(f)}" alt="${f.name}" />
      <span>${f.name}</span>
    </div>
  `).join('');
}

async function uploadPhotos() {
  const clientId = document.getElementById('upload-client-select').value;
  if (!clientId)             { showMsg('upload-msg', 'Please select a client.', 'error'); return; }
  if (!selectedFiles.length) { showMsg('upload-msg', 'Please select photos to upload.', 'error'); return; }

  const progress     = document.getElementById('upload-progress');
  const fill         = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  progress.classList.remove('hidden');

  let uploaded = 0;
  for (const file of selectedFiles) {
    const result = await uploadPhoto(clientId, file);
    if (!result.success) showMsg('upload-msg', `Failed to upload ${file.name}: ${result.error}`, 'error');
    uploaded++;
    fill.style.width         = Math.round((uploaded / selectedFiles.length) * 100) + '%';
    progressText.textContent = `Uploading ${uploaded}/${selectedFiles.length}...`;
  }

  progress.classList.add('hidden');
  fill.style.width = '0%';
  selectedFiles    = [];
  document.getElementById('photo-files').value = '';
  document.getElementById('file-preview').classList.add('hidden');
  showMsg('upload-msg', `${uploaded} photo(s) uploaded successfully!`, 'success');
}

// ── GALLERY ───────────────────────────────────

async function loadAllPhotos() {
  const grid     = document.getElementById('all-photos-grid');
  const clientId = document.getElementById('gallery-client-filter').value;
  grid.innerHTML = '<p class="empty-state">Loading...</p>';

  const photos = await getPhotos(clientId || null);
  if (!photos.length) {
    grid.innerHTML = '<p class="empty-state">No photos found.</p>';
    return;
  }

  grid.innerHTML = photos.map(p => `
    <div class="photo-card">
      <img src="${p.file_url}" alt="${p.file_name}" onclick="openLightbox('${p.file_url}')" />
      <div class="photo-card-info">
        <span>${p.file_name}</span>
        <button class="btn-danger-sm" onclick="deletePhoto('${p.id}', '${p.file_name}')">Delete</button>
      </div>
    </div>
  `).join('');
}

async function deletePhoto(id, name) {
  if (!confirm(`Delete photo "${name}"?`)) return;
  const result = await removePhoto(id);
  if (result.success) loadAllPhotos();
  else alert('Failed to delete: ' + result.error);
}

// ── LIGHTBOX ──────────────────────────────────

function openLightbox(url) {
  document.getElementById('lightbox-img').src = url;
  document.getElementById('lightbox').classList.remove('hidden');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
}

// ── UTILITIES ─────────────────────────────────

function showMsg(id, text, type) {
  const el        = document.getElementById(id);
  el.textContent  = text;
  el.className    = 'msg ' + type;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

function logout() {
  sessionStorage.clear();
  window.location.href = 'login.html';
}

// ── INIT ──────────────────────────────────────

loadClients();
loadClientSelects();
