 // ── DROPDOWN MENU TOGGLE ──
const menuToggle = document.getElementById('menuToggle');
const dropdownMenu = document.getElementById('dropdownMenu');

if (menuToggle && dropdownMenu) {
  menuToggle.addEventListener('click', function (e) {
    e.stopPropagation();
    menuToggle.classList.toggle('open');
    dropdownMenu.classList.toggle('open');
  });

  document.addEventListener('click', function () {
    menuToggle.classList.remove('open');
    dropdownMenu.classList.remove('open');
  });

  dropdownMenu.addEventListener('click', function (e) {
    e.stopPropagation();
  });
}

// Gallery filter removed — hover overlay used instead