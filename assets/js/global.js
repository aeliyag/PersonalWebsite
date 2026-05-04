function applyWinterFromStorage() {
  if (localStorage.getItem('siteWinter') === '1') {
    document.body.classList.add('site-winter');
  }
}

function updateWinterLabel() {
  const btn = document.getElementById('winter-toggle');
  if (!btn) return;
  btn.textContent = document.body.classList.contains('site-winter') ? 'Disable snow' : 'Winter mode';
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('#winter-toggle');
  if (!btn) return;
  const next = !document.body.classList.contains('site-winter');
  if (next) {
    document.body.classList.add('site-winter');
    localStorage.setItem('siteWinter', '1');
  } else {
    document.body.classList.remove('site-winter');
    localStorage.removeItem('siteWinter');
  }
  window.location.reload();
});

applyWinterFromStorage();

function pollWinterLabel() {
  let n = 0;
  const t = setInterval(() => {
    updateWinterLabel();
    if (document.getElementById('winter-toggle') || ++n > 50) clearInterval(t);
  }, 120);
}

document.addEventListener('DOMContentLoaded', pollWinterLabel);
