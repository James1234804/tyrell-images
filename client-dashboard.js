// ============================================
// TYRELL IMAGES — CLIENT DASHBOARD
// ============================================

// Auth guard — clients only
const clientId   = sessionStorage.getItem('clientId');
const clientName = sessionStorage.getItem('clientName');

if (sessionStorage.getItem('role') !== 'client' || !clientId) {
  window.location.href = 'login.html';
}

// ── State ────────────────────────────────────
let currentPhotoUrl  = '';
let currentPhotoName = '';
let allPhotos        = [];

// ── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('client-welcome').textContent = `Welcome, ${clientName}`;
  loadGallery();

  // Close lightbox on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });
});

// ── Gallery ───────────────────────────────────
async function loadGallery() {
  const grid = document.getElementById('gallery-grid');
  allPhotos  = await getPhotos(clientId);

  if (!allPhotos.length) {
    grid.innerHTML = '<p class="empty-state">No photos uploaded yet. Check back soon!</p>';
    document.getElementById('photo-count').textContent        = 'No photos yet';
    document.getElementById('download-all-btn').disabled      = true;
    return;
  }

  document.getElementById('photo-count').textContent =
    `${allPhotos.length} photo${allPhotos.length !== 1 ? 's' : ''} in your gallery`;

  grid.innerHTML = allPhotos.map((p) => `
    <div class="photo-card client-photo-card"
         onclick="openLightbox('${p.file_url}', '${p.file_name}')">
      <div class="photo-img-wrap">
        <img src="${p.file_url}" alt="${p.file_name}" loading="lazy" />
        <div class="photo-hover-overlay">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
               stroke="white" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8"  x2="11" y2="14"/>
            <line x1="8"  y1="11" x2="14" y2="11"/>
          </svg>
        </div>
      </div>
      <div class="photo-card-info">
        <span>${p.file_name}</span>
        <button class="btn-download-sm"
                onclick="event.stopPropagation(); quickDownload('${p.file_url}', '${p.file_name}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

// ── Lightbox ──────────────────────────────────
function openLightbox(url, name) {
  currentPhotoUrl  = url;
  currentPhotoName = name;
  document.getElementById('lightbox-img').src = url;
  document.getElementById('lightbox').classList.remove('hidden');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
}

// ── Downloads ─────────────────────────────────
async function downloadSingle() {
  await quickDownload(currentPhotoUrl, currentPhotoName);
}

async function quickDownload(url, name) {
  const a   = document.createElement('a');
  const res = await fetch(url);
  const blob = await res.blob();
  a.href     = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}

async function downloadAll() {
  if (!allPhotos.length) return;

  const status = document.getElementById('download-status');
  const btn    = document.getElementById('download-all-btn');

  btn.disabled = true;
  status.textContent = 'Preparing download...';
  status.classList.remove('hidden');

  for (let i = 0; i < allPhotos.length; i++) {
    status.textContent = `Downloading ${i + 1}/${allPhotos.length}...`;
    await quickDownload(allPhotos[i].file_url, allPhotos[i].file_name);
    await new Promise(r => setTimeout(r, 800));
  }

  status.textContent = `All ${allPhotos.length} photos downloaded!`;
  btn.disabled = false;
  setTimeout(() => status.classList.add('hidden'), 4000);
}

// ── Auth ──────────────────────────────────────
function logout() {
  sessionStorage.clear();
  window.location.href = 'login.html';
}
