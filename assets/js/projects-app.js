import { auth, db } from './firebaseConfig.js';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';
import { isAdminEmail } from './admin-config.js';
import { PROJECTS_SEED } from './projects-seed.js?v=20260908';

const gridEl = document.getElementById('projects-grid');
const searchEl = document.getElementById('projects-search');
const chipsEl = document.getElementById('skill-chips');
const adminBar = document.getElementById('admin-bar');
const adminStatus = document.getElementById('admin-status');
const btnSignIn = document.getElementById('btn-sign-in');
const btnSignOut = document.getElementById('btn-sign-out');
const btnAddProject = document.getElementById('btn-add-project');
const modal = document.getElementById('project-modal');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalTitle = document.getElementById('modal-title');
const form = document.getElementById('project-form');
const formDelete = document.getElementById('form-delete');

let allProjects = [];
let selectedSkills = new Set();
let searchQuery = '';
let currentUser = null;
let editingId = null;
let projectsPageInited = false;

function extraLinks(L) {
  return (Array.isArray(L.extra) ? L.extra : []).filter((item) => item && item.url && item.label);
}

function normalizeLinks(p) {
  const L = p.links && typeof p.links === 'object' ? p.links : {};
  return {
    repo: p.repo || L.repo || '',
    site: p.site || L.site || '',
    demo: p.demo || L.demo || '',
    detail: p.detailUrl || L.detail || L.detailUrl || '',
    extra: extraLinks(L),
  };
}

const SEED_TITLE_ALIASES = {
  'akool — assistant project manager internship': 'akool — assistant technical product manager',
};

function seedTitleKey(title) {
  const key = String(title || '').toLowerCase();
  return SEED_TITLE_ALIASES[key] || key;
}

function isHiddenProject(p) {
  const t = String(p?.title || '').toLowerCase();
  return t.includes('fear elemental');
}

function mergeProjects(remoteList) {
  const remoteByKey = new Map();
  for (const p of remoteList) {
    remoteByKey.set(seedTitleKey(p.title), p);
  }

  const usedRemote = new Set();
  const merged = [];

  for (const s of PROJECTS_SEED) {
    const remote = remoteByKey.get(seedTitleKey(s.title));
    if (remote) {
      usedRemote.add(remote);
      merged.push({ ...s, id: remote.id, _fromFirestore: true });
    } else {
      merged.push({ ...s, _fromSeed: true });
    }
  }

  for (const p of remoteList) {
    if (!usedRemote.has(p) && !isHiddenProject(p)) {
      merged.push({ ...p, _fromFirestore: true });
    }
  }

  merged.sort((a, b) => String(b.sortKey || '').localeCompare(String(a.sortKey || '')));
  return merged.filter((p) => !isHiddenProject(p));
}

function collectAllSkills(projects) {
  const set = new Set();
  projects.forEach((p) => (p.skills || []).forEach((sk) => set.add(sk)));
  return [...set].sort((a, b) => a.localeCompare(b));
}

function projectMatches(p) {
  if (searchQuery) {
    const t = `${p.title} ${p.summary || ''}`.toLowerCase();
    if (!t.includes(searchQuery)) return false;
  }
  if (selectedSkills.size > 0) {
    const sk = new Set(p.skills || []);
    let ok = false;
    selectedSkills.forEach((s) => {
      if (sk.has(s)) ok = true;
    });
    if (!ok) return false;
  }
  return true;
}

function renderProjects() {
  if (!gridEl) return;
  const list = allProjects.filter(projectMatches);
  gridEl.innerHTML =
    list.length === 0
      ? '<p class="lead">No projects match these filters.</p>'
      : '';

  list.forEach((p) => {
    const card = document.createElement('article');
    card.className = 'project-card';

    const links = normalizeLinks(p);
    const linkBits = [];
    if (links.repo) linkBits.push(`<a href="${escapeHtml(links.repo)}" target="_blank" rel="noopener">Repo</a>`);
    if (links.site) linkBits.push(`<a href="${escapeHtml(links.site)}" target="_blank" rel="noopener">Site</a>`);
    if (links.demo) linkBits.push(`<a href="${escapeHtml(links.demo)}" target="_blank" rel="noopener">Demo</a>`);
    links.extra.forEach((item) => {
      linkBits.push(
        `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.label)}</a>`
      );
    });
    if (links.detail) linkBits.push(`<a href="${window.sitePath(links.detail)}">Details</a>`);

    const skills = (p.skills || []).map((s) => `<span class="project-skill-tag">${escapeHtml(s)}</span>`).join('');

    const adminHint =
      currentUser && isAdminEmail(currentUser.email) && p._fromFirestore && p.id
        ? `<button type="button" class="btn secondary edit-remote" data-id="${escapeHtml(p.id)}" style="margin-top:0.5rem;font-size:0.8rem;">Edit</button>`
        : '';

    card.innerHTML = `
      <h3>${escapeHtml(p.title)}</h3>
      <div class="project-meta">${escapeHtml(p.period || '')} · ${escapeHtml(p.kind || '')}</div>
      <p style="flex:1;font-size:0.95rem;">${escapeHtml(p.summary || '')}</p>
      <div class="project-skills">${skills}</div>
      <div class="project-links">${linkBits.join('')}</div>
      ${adminHint}
    `;

    const editBtn = card.querySelector('.edit-remote');
    if (editBtn) editBtn.addEventListener('click', () => openEditModal(p));

    gridEl.appendChild(card);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSkillChips() {
  if (!chipsEl) return;
  const skills = collectAllSkills(allProjects);
  chipsEl.innerHTML = '';
  skills.forEach((sk) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'skill-chip' + (selectedSkills.has(sk) ? ' active' : '');
    b.textContent = sk;
    b.addEventListener('click', () => {
      if (selectedSkills.has(sk)) selectedSkills.delete(sk);
      else selectedSkills.add(sk);
      renderSkillChips();
      renderProjects();
    });
    chipsEl.appendChild(b);
  });
}

function openModalAdd() {
  editingId = null;
  modalTitle.textContent = 'Add project';
  form.reset();
  formDelete.classList.add('hidden');
  modalBackdrop.classList.add('open');
  modalBackdrop.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modalBackdrop.classList.remove('open');
  modalBackdrop.setAttribute('aria-hidden', 'true');
  editingId = null;
}

function openEditModal(p) {
  editingId = p.id;
  modalTitle.textContent = 'Edit project';
  form.reset();
  formDelete.classList.remove('hidden');
  document.getElementById('pf-title').value = p.title || '';
  document.getElementById('pf-summary').value = p.summary || '';
  document.getElementById('pf-skills').value = (p.skills || []).join(', ');
  document.getElementById('pf-kind').value = p.kind || 'build';
  document.getElementById('pf-period').value = p.period || '';
  document.getElementById('pf-sort').value = p.sortKey || '';
  document.getElementById('pf-featured').checked = !!p.featured;
  const L = normalizeLinks(p);
  document.getElementById('pf-repo').value = L.repo || '';
  document.getElementById('pf-site').value = L.site || '';
  document.getElementById('pf-demo').value = L.demo || '';
  document.getElementById('pf-detail').value = L.detail || '';
  modalBackdrop.classList.add('open');
  modalBackdrop.setAttribute('aria-hidden', 'false');
}

async function loadRemoteProjects() {
  try {
    const snap = await getDocs(collection(db, 'projects'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('Firestore projects read failed', e);
    return [];
  }
}

async function refresh() {
  const remote = await loadRemoteProjects();
  allProjects = mergeProjects(remote);
  renderSkillChips();
  renderProjects();
}

function updateAdminUi() {
  if (!adminBar) return;
  const ok = currentUser && isAdminEmail(currentUser.email);
  adminBar.classList.remove('hidden');
  if (!currentUser) {
    adminStatus.textContent = 'Sign in with Google to add or edit portfolio entries (admin only).';
    btnSignIn?.classList.remove('hidden');
    btnSignOut?.classList.add('hidden');
    btnAddProject?.classList.add('hidden');
    return;
  }
  if (!ok) {
    adminStatus.textContent = `Signed in as ${currentUser.email} — this account cannot edit projects.`;
    btnSignIn?.classList.add('hidden');
    btnSignOut?.classList.remove('hidden');
    btnAddProject?.classList.add('hidden');
    return;
  }
  adminStatus.textContent = `Signed in as ${currentUser.email}.`;
  btnSignIn?.classList.add('hidden');
  btnSignOut?.classList.remove('hidden');
  btnAddProject?.classList.remove('hidden');
}

function parseSkills(raw) {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function submitForm(e) {
  e.preventDefault();
  if (!currentUser || !isAdminEmail(currentUser.email)) return;

  const title = document.getElementById('pf-title').value.trim();
  const summary = document.getElementById('pf-summary').value.trim();
  const skills = parseSkills(document.getElementById('pf-skills').value);
  const kind = document.getElementById('pf-kind').value;
  const period = document.getElementById('pf-period').value.trim();
  const sortKey = document.getElementById('pf-sort').value.trim() || '1970-01-01';
  const featured = document.getElementById('pf-featured').checked;
  const repo = document.getElementById('pf-repo').value.trim();
  const site = document.getElementById('pf-site').value.trim();
  const demo = document.getElementById('pf-demo').value.trim();
  const detailUrl = document.getElementById('pf-detail').value.trim();

  const links = {};
  if (repo) links.repo = repo;
  if (site) links.site = site;
  if (demo) links.demo = demo;
  if (detailUrl) links.detail = detailUrl;

  const payload = {
    title,
    summary,
    skills,
    kind,
    period,
    sortKey,
    featured,
    links: Object.keys(links).length ? links : {},
    updatedAt: serverTimestamp(),
  };

  try {
    if (editingId) {
      await updateDoc(doc(db, 'projects', editingId), payload);
    } else {
      await addDoc(collection(db, 'projects'), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
    closeModal();
    await refresh();
  } catch (err) {
    console.error(err);
    alert('Could not save. Check Firestore rules and that you are using the allowlisted Google account.');
  }
}

async function deleteProject() {
  if (!editingId || !currentUser || !isAdminEmail(currentUser.email)) return;
  if (!confirm('Delete this project from the database?')) return;
  try {
    await deleteDoc(doc(db, 'projects', editingId));
    closeModal();
    await refresh();
  } catch (err) {
    console.error(err);
    alert('Delete failed.');
  }
}

function initProjectsPage() {
  if (!gridEl || projectsPageInited) return;
  projectsPageInited = true;

  searchEl?.addEventListener('input', () => {
    searchQuery = (searchEl.value || '').toLowerCase().trim();
    renderProjects();
  });

  modalBackdrop?.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  form?.addEventListener('submit', submitForm);
  formDelete?.addEventListener('click', deleteProject);

  btnAddProject?.addEventListener('click', () => openModalAdd());

  const provider = new GoogleAuthProvider();
  btnSignIn?.addEventListener('click', async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
    }
  });

  btnSignOut?.addEventListener('click', () => signOut(auth));

  document.getElementById('modal-close')?.addEventListener('click', closeModal);

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    updateAdminUi();
    refresh();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjectsPage);
} else {
  initProjectsPage();
}
