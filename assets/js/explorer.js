/**
 * File-explorer metaphor for the home page: spotlight + parallax on items.
 */
const ROOT = [
  {
    id: 'projects',
    type: 'folder',
    icon: '📁',
    label: 'projects',
    href: '/projects.html',
    preview: 'Skill‑filterable work, hackathons, leadership, and builds.',
  },
  {
    id: 'timeline',
    type: 'folder',
    icon: '📂',
    label: 'timeline',
    href: '/personalprojects/projecttimeline.html',
    preview: 'Chronological view of coursework and milestones.',
  },
  {
    id: 'resume',
    type: 'file',
    icon: '📄',
    label: 'resume.pdf',
    href: '/assets/docs/aeliya-grover-resume.pdf',
    preview: 'PDF résumé — download or open in a new tab.',
  },
  {
    id: 'toova-recap',
    type: 'file',
    icon: '📝',
    label: 'toova-winter-recap.pdf',
    href: '/assets/docs/toova-winter-quarter-recap.pdf',
    preview: 'Winter quarter recap for Toova.',
  },
  {
    id: 'blog',
    type: 'folder',
    icon: '✍️',
    label: 'blog',
    href: '/blog.html',
    preview: 'Notes, journals, and longer writing.',
  },
  {
    id: 'contact',
    type: 'folder',
    icon: '✉️',
    label: 'contact',
    href: '/contact.html',
    preview: 'Email, socials, and newsletter signup.',
  },
  {
    id: 'about',
    type: 'folder',
    icon: '👤',
    label: 'about.txt',
    href: '#about-intro',
    preview: 'Quick bio — scrolls to intro below the explorer.',
  },
];

function qs(sel) {
  return document.querySelector(sel);
}

function initExplorer() {
  const root = qs('#file-explorer');
  if (!root || initExplorer._done) return;
  initExplorer._done = true;

  const glow = qs('.explorer-glow');
  const grid = qs('#explorer-items');
  const previewTitle = qs('#preview-title');
  const previewBody = qs('#preview-body');
  const previewLink = qs('#preview-link');
  const tree = qs('#explorer-tree');

  const treeRoots = ['~', 'portfolio'];
  tree.innerHTML = treeRoots
    .map((t, i) => {
      const active = i === treeRoots.length - 1 ? ' active' : '';
      return `<div class="tree-item${active}" data-tree="${t}">${t === '~' ? '~' : '/' + t}</div>`;
    })
    .join('');

  function setPreview(item) {
    previewTitle.textContent = item.label;
    previewBody.textContent = item.preview;
    if (item.href.startsWith('#')) {
      previewLink.href = item.href;
      previewLink.textContent = 'Jump to section';
    } else {
      previewLink.href = item.href;
      previewLink.textContent = item.type === 'file' ? 'Open' : 'Enter';
    }
  }

  ROOT.forEach((item) => {
    const el = document.createElement('div');
    el.className = 'explorer-item';
    el.setAttribute('role', 'link');
    el.tabIndex = 0;
    el.innerHTML = `
      <div class="explorer-item-icon">${item.icon}</div>
      <div class="explorer-item-name">${item.label}</div>
      <div class="explorer-item kind">${item.type}</div>
    `;

    const open = () => {
      if (item.href.startsWith('#')) {
        const target = document.querySelector(item.href);
        target?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      window.location.href = item.href;
    };

    el.addEventListener('click', open);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });

    el.addEventListener('mouseenter', () => setPreview(item));

    grid.appendChild(el);
  });

  setPreview(ROOT[0]);

  root.addEventListener('mousemove', (e) => {
    const r = root.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    root.style.setProperty('--mx', `${x}%`);
    root.style.setProperty('--my', `${y}%`);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    grid.querySelectorAll('.explorer-item').forEach((el) => {
      const er = el.getBoundingClientRect();
      const cx = er.left + er.width / 2;
      const cy = er.top + er.height / 2;
      const dx = (e.clientX - cx) * 0.012;
      const dy = (e.clientY - cy) * 0.012;
      el.style.setProperty('--parallax-x', `${dx}px`);
      el.style.setProperty('--parallax-y', `${dy}px`);
    });
  });

  root.addEventListener('mouseleave', () => {
    grid.querySelectorAll('.explorer-item').forEach((el) => {
      el.style.setProperty('--parallax-x', '0px');
      el.style.setProperty('--parallax-y', '0px');
    });
  });
}

document.addEventListener('DOMContentLoaded', initExplorer);
if (document.readyState !== 'loading') initExplorer();
