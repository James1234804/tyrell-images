 // ============================================
// TYRELL IMAGES — CLIENT DASHBOARD v2
// ============================================

// Auth guard
const clientId   = sessionStorage.getItem('clientId');
const clientName = sessionStorage.getItem('clientName');

if (sessionStorage.getItem('role') !== 'client' || !clientId) {
  window.location.href = 'login.html';
}

// ── State ────────────────────────────────────
let allPhotos         = [];
let filteredPhotos    = [];
let currentLightboxIdx = 0;
let selectMode        = false;
let selectedSet       = new Set();
let favouriteSet      = new Set(JSON.parse(sessionStorage.getItem('ti_favs_' + clientId) || '[]'));
let activeFilter      = 'all';

// ── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('client-welcome').textContent = `Welcome, ${clientName}`;
  loadGallery();

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape')         closeLightbox();
    if (e.key === 'ArrowRight')     lightboxNav(1);
    if (e.key === 'ArrowLeft')      lightboxNav(-1);
  });
});

// ── Gallery ───────────────────────────────────
async function loadGallery() {
  allPhotos = await getPhotos(clientId);

  // Hide skeleton
  const skeleton = document.getElementById('skeleton-loader');
  if (skeleton) skeleton.remove();

  const grid = document.getElementById('gallery-grid');

  if (!allPhotos.length) {
    grid.innerHTML = '<p class="empty-state">No photos uploaded yet — check back soon!</p>';
    document.getElementById('photo-count').textContent = 'No photos yet';
    document.getElementById('download-all-btn').disabled = true;
    return;
  }

  // Show stats + filters
  document.getElementById('gallery-stats').classList.remove('hidden');
  document.getElementById('gallery-filters').classList.remove('hidden');

  updateStats();
  renderGallery();
}

function renderGallery() {
  filteredPhotos = activeFilter === 'favs'
    ? allPhotos.filter(p => favouriteSet.has(p.file_url))
    : allPhotos;

  const grid = document.getElementById('gallery-grid');

  if (!filteredPhotos.length) {
    grid.innerHTML = '<p class="empty-state">No favourites yet — click the ♥ on any photo!</p>';
    document.getElementById('photo-count').textContent = '0 photos';
    return;
  }

  document.getElementById('photo-count').textContent =
    `${filteredPhotos.length} photo${filteredPhotos.length !== 1 ? 's' : ''}${activeFilter === 'favs' ? ' favourited' : ' in your gallery'}`;

  const selectClass = selectMode ? 'select-mode' : '';

  grid.innerHTML = filteredPhotos.map((p, i) => {
    const isFav      = favouriteSet.has(p.file_url);
    const isSelected = selectedSet.has(p.file_url);
    return `
      <div class="photo-card client-photo-card ${isFav ? 'fav' : ''} ${isSelected ? 'selected' : ''} ${selectClass}"
           style="animation-delay: ${i * 0.04}s"
           data-url="${p.file_url}"
           data-name="${p.file_name}"
           onclick="handleCardClick(event, ${i}, '${p.file_url}', '${p.file_name}')">
        <div class="photo-img-wrap">
          <img src="${p.file_url}" alt="${p.file_name}" loading="lazy" />
          <div class="photo-hover-overlay">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </div>
          <!-- Checkbox -->
          <div class="photo-select-check" onclick="event.stopPropagation(); toggleSelect('${p.file_url}', this.closest('.client-photo-card'))">
            <svg class="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${'#0C0C0C'}" stroke-width="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <!-- Favourite -->
          <button class="photo-fav-btn" onclick="event.stopPropagation(); toggleFav('${p.file_url}', this.closest('.client-photo-card'))" title="${isFav ? 'Unfavourite' : 'Favourite'}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFav ? '#E74C3C' : 'none'}" stroke="${isFav ? '#E74C3C' : 'white'}" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
        <div class="photo-card-info">
          <span title="${p.file_name}">${p.file_name}</span>
          <button class="btn-download-sm"
                  onclick="event.stopPropagation(); quickDownload('${p.file_url}', '${p.file_name}')"
                  title="Download">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ── Card click — opens lightbox or selects ──
function handleCardClick(e, idx, url, name) {
  if (selectMode) {
    const card = e.currentTarget;
    toggleSelect(url, card);
  } else {
    openLightbox(idx);
  }
}

// ── Filter ────────────────────────────────────
function setFilter(filter, btn) {
  activeFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // Clear selection when switching filter
  selectedSet.clear();
  updateSelectionUI();
  renderGallery();
}

// ── Selection mode ────────────────────────────
function toggleSelectMode() {
  selectMode = !selectMode;
  const btn = document.getElementById('select-mode-btn');
  const dlBtn = document.getElementById('download-selected-btn');

  btn.classList.toggle('active', selectMode);
  dlBtn.classList.toggle('hidden', !selectMode);

  if (!selectMode) {
    selectedSet.clear();
    updateSelectionUI();
  }

  // Re-render to toggle select-mode class on cards
  renderGallery();
}

function toggleSelect(url, card) {
  if (selectedSet.has(url)) {
    selectedSet.delete(url);
    card.classList.remove('selected');
  } else {
    selectedSet.add(url);
    card.classList.add('selected');
  }
  updateSelectionUI();
}

function updateSelectionUI() {
  const count = selectedSet.size;
  document.getElementById('sel-count').textContent = count;
  const dlBtn = document.getElementById('download-selected-btn');
  dlBtn.disabled = count === 0;
}

// ── Favourites ────────────────────────────────
function toggleFav(url, card) {
  if (favouriteSet.has(url)) {
    favouriteSet.delete(url);
    card.classList.remove('fav');
    card.querySelector('.photo-fav-btn svg').setAttribute('fill', 'none');
    card.querySelector('.photo-fav-btn svg').setAttribute('stroke', 'white');
  } else {
    favouriteSet.add(url);
    card.classList.add('fav');
    card.querySelector('.photo-fav-btn svg').setAttribute('fill', '#E74C3C');
    card.querySelector('.photo-fav-btn svg').setAttribute('stroke', '#E74C3C');
  }
  saveFavs();
  updateStats();
}

function saveFavs() {
  sessionStorage.setItem('ti_favs_' + clientId, JSON.stringify([...favouriteSet]));
}

function updateStats() {
  document.getElementById('stat-total').textContent = allPhotos.length;
  document.getElementById('stat-favs').textContent  = favouriteSet.size;
}

// ── Lightbox ──────────────────────────────────
function openLightbox(idx) {
  currentLightboxIdx = idx;
  const p = filteredPhotos[idx];
  document.getElementById('lightbox-img').src = p.file_url;
  document.getElementById('lb-filename').textContent  = p.file_name;
  document.getElementById('lb-counter').textContent   = `${idx + 1} / ${filteredPhotos.length}`;
  document.getElementById('lb-prev').disabled = idx === 0;
  document.getElementById('lb-next').disabled = idx === filteredPhotos.length - 1;
  document.getElementById('lightbox').classList.remove('hidden');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
}

function lightboxNav(dir) {
  const newIdx = currentLightboxIdx + dir;
  if (newIdx < 0 || newIdx >= filteredPhotos.length) return;
  openLightbox(newIdx);
}

// ── Downloads ─────────────────────────────────
async function downloadSingle() {
  const p = filteredPhotos[currentLightboxIdx];
  await quickDownload(p.file_url, p.file_name);
}

async function quickDownload(url, name) {
  try {
    const res  = await fetch(url);
    const blob = await res.blob();
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    showToast('Download failed. Please try again.');
  }
}

async function downloadSelected() {
  const toDownload = filteredPhotos.filter(p => selectedSet.has(p.file_url));
  if (!toDownload.length) return;

  const btn = document.getElementById('download-selected-btn');
  btn.disabled = true;

  for (let i = 0; i < toDownload.length; i++) {
    showToast(`Downloading ${i + 1} of ${toDownload.length}...`);
    await quickDownload(toDownload[i].file_url, toDownload[i].file_name);
    await new Promise(r => setTimeout(r, 700));
  }

  showToast(`${toDownload.length} photo${toDownload.length !== 1 ? 's' : ''} downloaded!`);
  btn.disabled = false;

  // Clear selection after download
  selectedSet.clear();
  updateSelectionUI();
  renderGallery();
}

async function downloadAll() {
  if (!allPhotos.length) return;

  const btn = document.getElementById('download-all-btn');
  btn.disabled = true;

  for (let i = 0; i < allPhotos.length; i++) {
    showToast(`Downloading ${i + 1} of ${allPhotos.length}...`);
    await quickDownload(allPhotos[i].file_url, allPhotos[i].file_name);
    await new Promise(r => setTimeout(r, 800));
  }

  showToast(`All ${allPhotos.length} photos downloaded!`);
  btn.disabled = false;
}

// ── Toast ─────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Auth ──────────────────────────────────────
function logout() {
  sessionStorage.clear();
  window.location.href = 'login.html';
}
