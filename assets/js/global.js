function sitePrefix() {
  const script = document.querySelector('script[src*="global.js"]');
  if (script?.src) {
    const resolved = new URL(script.src, window.location.href);
    return resolved.pathname.replace(/assets\/js\/global\.js$/, '');
  }
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (location.hostname.endsWith('github.io') && parts.length) {
    return '/' + parts[0] + '/';
  }
  return '/';
}

function sitePath(path) {
  if (!path || path.startsWith('#') || /^https?:\/\//.test(path)) return path;
  return sitePrefix() + path.replace(/^\//, '');
}

async function loadPartial(rootPath, targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const res = await fetch(sitePath(rootPath));
  if (!res.ok) {
    console.warn('Could not load', rootPath, res.status);
    return;
  }
  let html = await res.text();
  html = html.replace(
    /(\s(?:href|src)=["'])\/([^"']+)(["'])/g,
    (_, pre, p, post) => pre + sitePath('/' + p) + post
  );
  el.innerHTML = html;
  updateWinterLabel();
}

function fixRootPaths(root = document) {
  root.querySelectorAll('[href^="/"], [src^="/"]').forEach((el) => {
    const attr = el.hasAttribute('href') ? 'href' : 'src';
    const val = el.getAttribute(attr);
    if (val && !val.startsWith('//')) el.setAttribute(attr, sitePath(val));
  });
}

window.sitePath = sitePath;
window.loadPartial = loadPartial;
window.fixRootPaths = fixRootPaths;

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

document.addEventListener('DOMContentLoaded', () => {
  fixRootPaths();
  pollWinterLabel();
});
