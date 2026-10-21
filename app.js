'use strict';

/* =========================================================
   Banco de recursos · Prototipo de recursos pedagógicos
   ---------------------------------------------------------
   La autenticación y los permisos son simulados y NO deben
   usarse en producción. Los metadatos viven en localStorage
   y los archivos subidos se guardan en la carpeta uploads/
   mediante el servidor local (server.py).
   ========================================================= */

/* ============================== Constantes ============================== */
const STORAGE_KEY = 'bancoderecursos.data.v1';
const SESSION_KEY = 'bancoderecursos.session.v1';
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB por archivo (el servidor aplica el mismo límite)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LEVELS = {
  bajo: { label: 'Bajo' },
  medio: { label: 'Medio' },
  alto: { label: 'Alto' }
};

const ROLE_META = {
  admin: { label: 'Administrador', plural: 'Administradores', badge: 'badge--role-admin', avatar: 'avatar--admin' },
  psychologist: { label: 'Psicólogo', plural: 'Psicólogos', badge: 'badge--role-psychologist', avatar: 'avatar--psychologist' },
  user: { label: 'Usuario', plural: 'Usuarios', badge: 'badge--role-user', avatar: 'avatar--user' }
};

const SECTION_META = {
  recursos: {
    label: 'Administrar recursos',
    title: 'Administrar recursos',
    context: 'Espacio de administración'
  },
  usuarios: {
    label: 'Administrar usuarios',
    title: 'Administrar usuarios',
    context: 'Espacio de administración'
  },
  'mi-panel': {
    label: 'Mis recursos',
    title: 'Mi panel',
    context: 'Tu espacio personal'
  }
};

const FILE_TYPES = {
  txt: { label: 'Texto', tone: 'txt', abbr: 'TXT' },
  doc: { label: 'Word', tone: 'word', abbr: 'DOC' },
  docx: { label: 'Word', tone: 'word', abbr: 'DOC' },
  xls: { label: 'Excel', tone: 'excel', abbr: 'XLS' },
  xlsx: { label: 'Excel', tone: 'excel', abbr: 'XLS' },
  ppt: { label: 'PowerPoint', tone: 'ppt', abbr: 'PPT' },
  pptx: { label: 'PowerPoint', tone: 'ppt', abbr: 'PPT' },
  pdf: { label: 'PDF', tone: 'pdf', abbr: 'PDF' },
  mp4: { label: 'Video', tone: 'video', abbr: 'MP4' },
  webm: { label: 'Video', tone: 'video', abbr: 'WEBM' },
  mov: { label: 'Video', tone: 'video', abbr: 'MOV' },
  avi: { label: 'Video', tone: 'video', abbr: 'AVI' },
  mkv: { label: 'Video', tone: 'video', abbr: 'MKV' },
  mp3: { label: 'Audio', tone: 'audio', abbr: 'MP3' },
  wav: { label: 'Audio', tone: 'audio', abbr: 'WAV' },
  ogg: { label: 'Audio', tone: 'audio', abbr: 'OGG' },
  m4a: { label: 'Audio', tone: 'audio', abbr: 'M4A' },
  aac: { label: 'Audio', tone: 'audio', abbr: 'AAC' }
};
const ALLOWED_EXTENSIONS = Object.keys(FILE_TYPES);
const ACCEPT_FILES = ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',');

const DEMO_ACCOUNTS = [
  { email: 'admin@bancoderecursos.com', password: 'admin123' },
  { email: 'psicologo@bancoderecursos.com', password: 'psi12345' },
  { email: 'usuario@bancoderecursos.com', password: 'user1234' }
];

/* ============================== Iconos ============================== */
const ICONS = {
  book: '<path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/>',
  users: '<path d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>',
  layers: '<path d="m3.75 6.75 7.5-4.5a1.5 1.5 0 0 1 1.5 0l7.5 4.5a1.5 1.5 0 0 1 0 2.598l-7.5 4.5a1.5 1.5 0 0 1-1.5 0l-7.5-4.5a1.5 1.5 0 0 1 0-2.598Z"/><path d="m3.75 12 7.5 4.5a1.5 1.5 0 0 0 1.5 0l7.5-4.5M3.75 17.25l7.5 4.5a1.5 1.5 0 0 0 1.5 0l7.5-4.5"/>',
  plus: '<path d="M12 4.5v15m7.5-7.5h-15"/>',
  search: '<path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>',
  trash: '<path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>',
  eye: '<path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>',
  pencil: '<path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/>',
  download: '<path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>',
  logout: '<path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"/>',
  menu: '<path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>',
  x: '<path d="M6 18 18 6M6 6l12 12"/>',
  'check-circle': '<path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>',
  alert: '<path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>',
  info: '<path d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/>',
  file: '<path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>',
  calendar: '<path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>',
  'arrow-right': '<path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>',
  home: '<path d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>',
  shield: '<path d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>',
  user: '<path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>',
  upload: '<path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>'
};

function icon(name, className = '') {
  const cls = className ? ` class="${className}"` : '';
  return `<svg${cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ICONS.info}</svg>`;
}

/* ============================== Estado global ============================== */
let state = { users: [], resources: [], lists: [] };
let session = null;

const ui = {
  section: 'recursos',
  resourceTab: 'resources',
  resourceSearch: '',
  listSearch: '',
  resourceLevel: 'all',
  userSearch: '',
  userRole: 'all',
  dashboardSearch: ''
};

/* ============================== Referencias DOM ============================== */
const dom = {
  authView: document.getElementById('auth-view'),
  appView: document.getElementById('app-view'),
  loginPanel: document.getElementById('login-panel'),
  registerPanel: document.getElementById('register-panel'),
  loginForm: document.getElementById('login-form'),
  registerForm: document.getElementById('register-form'),
  loginError: document.getElementById('login-error'),
  registerError: document.getElementById('register-error'),
  sidebar: document.getElementById('sidebar'),
  sidebarNav: document.getElementById('sidebar-nav'),
  sidebarContext: document.getElementById('sidebar-context'),
  sidebarUser: document.getElementById('sidebar-user'),
  topbarSection: document.getElementById('topbar-section'),
  topbarDate: document.getElementById('topbar-date'),
  topbarAvatar: document.getElementById('topbar-avatar'),
  content: document.getElementById('main-content'),
  modal: document.getElementById('app-modal'),
  toastRegion: document.getElementById('toast-region')
};

/* ============================== Utilidades ============================== */
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function formatTopbarDate() {
  const label = new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(new Date());
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

function plural(count, singular, pluralForm) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function currentUser() {
  return state.users.find((user) => user.id === session) || null;
}

function findUser(id) {
  return state.users.find((user) => user.id === id) || null;
}

function findResource(id) {
  return state.resources.find((resource) => resource.id === id) || null;
}

function findList(id) {
  return state.lists.find((list) => list.id === id) || null;
}

function roleLabel(role) {
  return ROLE_META[role]?.label || 'Usuario';
}

function levelLabel(level) {
  return LEVELS[level]?.label || level;
}

function getFileType(filename = '') {
  const ext = String(filename).split('.').pop().toLowerCase();
  return FILE_TYPES[ext] || null;
}

function getFileMeta(file) {
  if (!file) {
    return { label: 'Sin archivo', tone: 'none', abbr: '—', ext: '' };
  }
  const type = getFileType(file.name);
  return {
    label: type?.label || 'Archivo',
    tone: type?.tone || 'none',
    abbr: type?.abbr || 'FILE',
    ext: String(file.name).split('.').pop().toLowerCase()
  };
}

function levelBadge(level) {
  return `<span class="badge badge--${escapeHTML(level)}">${escapeHTML(levelLabel(level))}</span>`;
}

function roleBadge(role) {
  return `<span class="badge ${ROLE_META[role]?.badge || 'badge--neutral'}">${escapeHTML(roleLabel(role))}</span>`;
}

function avatarFor(user, className = '') {
  if (!user) return '';
  return `<span class="avatar ${ROLE_META[user.role]?.avatar || ''} ${className}" aria-hidden="true">${escapeHTML(initials(user.username))}</span>`;
}

function userChip(user) {
  return `<span class="person-chip">${avatarFor(user)}${escapeHTML(user.username)}</span>`;
}

function defaultRoute(role) {
  if (role === 'user') return 'mi-panel';
  return 'recursos';
}

function canManageResources() {
  const user = currentUser();
  return Boolean(user && (user.role === 'admin' || user.role === 'psychologist'));
}

function isAdmin() {
  return currentUser()?.role === 'admin';
}

function canAccessResource(resourceId, user = currentUser()) {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'psychologist') return true;
  return state.lists.some((list) => list.resourceIds.includes(resourceId) && list.assignedUserIds.includes(user.id));
}

function canAccessList(list, user = currentUser()) {
  if (!user || !list) return false;
  if (user.role === 'admin' || user.role === 'psychologist') return true;
  return list.assignedUserIds.includes(user.id);
}

function isDownloadable(resource) {
  return Boolean(resource?.file?.url || resource?.file?.dataUrl);
}

function sortedByName(items) {
  return [...items].sort((a, b) => a.username.localeCompare(b.username, 'es'));
}

/* ============================== Almacenamiento ============================== */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.users) || !Array.isArray(parsed.resources) || !Array.isArray(parsed.lists)) {
      return null;
    }
    parsed.users = parsed.users.filter((user) => user && typeof user === 'object');
    parsed.resources = parsed.resources.filter((resource) => resource && typeof resource === 'object');
    parsed.lists = parsed.lists.filter((list) => list && typeof list === 'object');
    parsed.users.forEach((user) => {
      user.role = ROLE_META[user.role] ? user.role : 'user';
    });
    parsed.lists.forEach((list) => {
      if (!Array.isArray(list.resourceIds)) list.resourceIds = [];
      if (!Array.isArray(list.assignedUserIds)) list.assignedUserIds = [];
    });
    return parsed;
  } catch (error) {
    console.warn('No se pudo leer localStorage:', error);
    return null;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    const quota = error?.name === 'QuotaExceededError' || error?.name === 'NS_ERROR_DOM_QUOTA_REACHED';
    showToast(
      quota
        ? 'No hay espacio suficiente en el navegador. Usa un archivo más pequeño o elimina recursos.'
        : 'No se pudieron guardar los cambios en este navegador.',
      'error'
    );
    return false;
  }
}

function commit(change) {
  const snapshot = JSON.stringify(state);
  change();
  if (saveState()) return true;
  state = JSON.parse(snapshot);
  return false;
}

function saveSession(userId) {
  session = userId;
  try {
    localStorage.setItem(SESSION_KEY, userId);
  } catch (error) {
    console.warn('No se pudo guardar la sesión:', error);
  }
}

function clearSession() {
  session = null;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.warn('No se pudo limpiar la sesión:', error);
  }
}

/* ============================== Contraseñas ============================== */
async function hashPassword(password) {
  const text = `bancoderecursos::${password}`;
  if (window.crypto?.subtle) {
    const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return `sha256:${Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
  }
  // Respaldo simple para navegadores sin Web Crypto (prototipo, no producción).
  return `fallback:${btoa(unescape(encodeURIComponent(text)))}`;
}

async function verifyPassword(password, storedHash) {
  const computed = await hashPassword(password);
  return computed === storedHash;
}

/* ============================== Datos de prueba ============================== */
function makeTextFile(name, content) {
  const bytes = new TextEncoder().encode(content);
  return {
    name,
    type: 'text/plain',
    size: bytes.length,
    blob: new Blob([bytes], { type: 'text/plain' })
  };
}

function makeToneWavFile(name, seconds = 1.4) {
  const sampleRate = 16000;
  const totalSamples = Math.floor(sampleRate * seconds);
  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);
  const writeString = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + totalSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, totalSamples * 2, true);

  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / totalSamples;
    const envelope = Math.sin(Math.PI * t);
    const wave = Math.sin(2 * Math.PI * 392 * i / sampleRate) * 0.72
      + Math.sin(2 * Math.PI * 587.33 * i / sampleRate) * 0.28;
    const sample = Math.max(-1, Math.min(1, wave * 0.13 * envelope));
    view.setInt16(44 + i * 2, Math.round(sample * 0x7fff), true);
  }

  const bytes = new Uint8Array(buffer);
  return {
    name,
    type: 'audio/wav',
    size: bytes.length,
    blob: new Blob([bytes], { type: 'audio/wav' })
  };
}

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function createSeedState() {
  const users = await Promise.all([
    {
      id: 'usr_admin',
      username: 'Valentina Ríos',
      email: 'admin@bancoderecursos.com',
      password: 'admin123',
      role: 'admin',
      createdAt: daysAgo(52)
    },
    {
      id: 'usr_psych',
      username: 'Mateo Herrera',
      email: 'psicologo@bancoderecursos.com',
      password: 'psi12345',
      role: 'psychologist',
      createdAt: daysAgo(44)
    },
    {
      id: 'usr_lucia',
      username: 'Lucía Fernández',
      email: 'usuario@bancoderecursos.com',
      password: 'user1234',
      role: 'user',
      createdAt: daysAgo(31)
    },
    {
      id: 'usr_diego',
      username: 'Diego Salas',
      email: 'diego@bancoderecursos.com',
      password: 'user1234',
      role: 'user',
      createdAt: daysAgo(23)
    },
    {
      id: 'usr_camila',
      username: 'Camila Vega',
      email: 'camila@bancoderecursos.com',
      password: 'user1234',
      role: 'user',
      createdAt: daysAgo(16)
    }
  ].map(async (user) => ({
    ...user,
    passwordHash: await hashPassword(user.password),
    password: undefined
  })));

  const resources = [
    {
      id: 'res_respiracion',
      name: 'Guía de respiración consciente',
      description: 'Secuencia breve de ejercicios de respiración para regular la ansiedad antes de una evaluación o una situación demandante.',
      level: 'bajo',
      file: makeTextFile(
        'guia-respiracion-consciente.txt',
        `GUÍA DE RESPIRACIÓN CONSCIENTE\n\nObjetivo\nAcompañar al estudiante en la regulación del nerviosismo mediante una pausa breve y guiada.\n\nEjercicio 4-4-6\n1. Inhala por la nariz durante 4 segundos.\n2. Mantén el aire durante 4 segundos.\n3. Exhala lentamente por la boca durante 6 segundos.\n4. Repite el ciclo 5 veces.\n\nSugerencias para el acompañamiento\n- Ofrece un espacio tranquilo y sin interrupciones.\n- Ajusta los tiempos al ritmo de la persona.\n- Cierra la práctica preguntando cómo se siente.\n`
      ),
      createdAt: daysAgo(19),
      createdBy: 'usr_psych'
    },
    {
      id: 'res_atencion',
      name: 'Fichas de atención sostenida',
      description: 'Actividades graduadas para practicar la atención sostenida y la discriminación visual en sesiones de 10 a 15 minutos.',
      level: 'medio',
      file: makeTextFile(
        'fichas-atencion-sostenida.txt',
        `FICHAS DE ATENCIÓN SOSTENIDA\n\nMaterial para sesiones individuales o pequeños grupos.\n\nFicha 1 · Símbolos repetidos\nMarca durante un minuto todos los símbolos iguales al modelo. Luego revisa los aciertos y los omisiones.\n\nFicha 2 · Secuencia de colores\nObserva la secuencia durante 20 segundos y reprodúcela sin mirar.\n\nFicha 3 · Cambio de regla\nClasifica las tarjetas por color; al sonar la señal, clasifícalas por forma.\n\nRegistro\nAnota la fecha, la duración, los aciertos y cómo se sintió la persona.\n`
      ),
      createdAt: daysAgo(16),
      createdBy: 'usr_psych'
    },
    {
      id: 'res_emociones',
      name: 'Cuaderno de emociones',
      description: 'Plantilla semanal para reconocer emociones, identificar detonantes y registrar estrategias de regulación que funcionaron.',
      level: 'bajo',
      file: makeTextFile(
        'cuaderno-de-emociones.txt',
        `CUADERNO DE EMOCIONES\n\nFecha: ____________________\n\n1. ¿Qué emoción apareció con más fuerza hoy?\n\n2. ¿Qué situación la acompañó?\n\n3. ¿Cómo la sentí en el cuerpo?\n\n4. ¿Qué hice para sentirme mejor?\n\n5. ¿Qué quiero probar mañana?\n\nRecordatorio: todas las emociones cumplen una función. Observarlas sin juzgarlas también es una forma de cuidado.\n`
      ),
      createdAt: daysAgo(14),
      createdBy: 'usr_admin'
    },
    {
      id: 'res_evaluacion',
      name: 'Evaluación de funciones ejecutivas',
      description: 'Instrumento de apoyo para observar planificación, inhibición y flexibilidad cognitiva en contextos educativos. Requiere acompañamiento profesional.',
      level: 'alto',
      file: makeTextFile(
        'evaluacion-funciones-ejecutivas.txt',
        `EVALUACIÓN DE FUNCIONES EJECUTIVAS\n\nUso exclusivo de equipos de orientación.\n\nDimensiones a observar\n- Planificación: organización de pasos y anticipación de consecuencias.\n- Inhibición: capacidad de frenar una respuesta automática.\n- Flexibilidad: ajuste ante cambios de regla o contexto.\n- Memoria de trabajo: retención y manipulación de información breve.\n\nRegistro de evidencias\nDescribe situaciones observadas, fecha, contexto y apoyos entregados. Complementa con entrevistas y documentos del centro.\n\nEste material es una guía de observación y no reemplaza una evaluación psicopedagógica integral.\n`
      ),
      createdAt: daysAgo(12),
      createdBy: 'usr_psych'
    },
    {
      id: 'res_rutina',
      name: 'Rutina visual para el aula',
      description: 'Tarjetas ilustradas con los momentos de la jornada escolar para anticipar cambios y favorecer la autorregulación.',
      level: 'bajo',
      file: makeTextFile(
        'rutina-visual-aula.txt',
        `RUTINA VISUAL PARA EL AULA\n\nMomentos sugeridos\n- Llegada y saludo\n- Asamblea\n- Trabajo individual\n- Pausa activa\n- Almuerzo\n- Trabajo en grupos\n- Cierre y despedida\n\nSugerencias\n1. Revisa la secuencia al inicio de la jornada.\n2. Mueve una pinza o imán a medida que avanza el día.\n3. Anticipa los cambios con una tarjeta especial.\n4. Mantén un tamaño de letra e iconos accesibles.\n`
      ),
      createdAt: daysAgo(9),
      createdBy: 'usr_admin'
    },
    {
      id: 'res_inclusion',
      name: 'Presentación: inclusión y diversidad',
      description: 'Presentación para sensibilizar al equipo docente sobre barreras de aprendizaje, apoyos universales y diseño para todas las personas.',
      level: 'alto',
      file: null,
      createdAt: daysAgo(6),
      createdBy: 'usr_admin'
    },
    {
      id: 'res_audio',
      name: 'Audio guiado: pausa activa',
      description: 'Pista breve de demostración para acompañar una pausa de regulación. Puede reproducirse antes de una actividad que requiera concentración.',
      level: 'medio',
      file: makeToneWavFile('pausa-activa-demostracion.wav'),
      createdAt: daysAgo(4),
      createdBy: 'usr_psych'
    }
  ];

  // Los archivos de demostración también se guardan en uploads/ con un id único.
  await Promise.all(
    resources.map(async (resource) => {
      if (!resource.file?.blob) return;
      try {
        resource.file = await uploadFile(resource.file.blob, resource.file.name);
      } catch (error) {
        console.warn(`No se pudo guardar el archivo de prueba "${resource.file.name}":`, error);
        resource.file = null;
      }
    })
  );

  const lists = [
    {
      id: 'list_regulacion',
      name: 'Kit de regulación emocional',
      description: 'Recursos para acompañar momentos de ansiedad, cambios de rutina y reconocimiento emocional.',
      resourceIds: ['res_respiracion', 'res_emociones', 'res_rutina', 'res_inclusion', 'res_audio'],
      assignedUserIds: ['usr_lucia', 'usr_diego'],
      createdAt: daysAgo(8),
      createdBy: 'usr_psych'
    },
    {
      id: 'list_estimulacion',
      name: 'Estimulación cognitiva',
      description: 'Actividades seleccionadas para trabajar atención y funciones ejecutivas de forma progresiva.',
      resourceIds: ['res_atencion', 'res_evaluacion'],
      assignedUserIds: ['usr_lucia'],
      createdAt: daysAgo(5),
      createdBy: 'usr_psych'
    },
    {
      id: 'list_aula',
      name: 'Acompañamiento en el aula',
      description: 'Material de apoyo para anticipar rutinas y promover entornos escolares inclusivos.',
      resourceIds: ['res_rutina', 'res_inclusion'],
      assignedUserIds: ['usr_diego', 'usr_camila'],
      createdAt: daysAgo(2),
      createdBy: 'usr_admin'
    }
  ];

  return {
    users,
    resources,
    lists,
    meta: { version: 1, seededAt: new Date().toISOString() }
  };
}

/* ============================== Inicialización ============================== */
async function init() {
  bindEvents();

  const loaded = loadState();
  if (loaded) {
    state = loaded;
  } else {
    state = await createSeedState();
    saveState();
  }

  let storedSession = null;
  try {
    storedSession = localStorage.getItem(SESSION_KEY);
  } catch (error) {
    storedSession = null;
  }

  if (storedSession && state.users.some((user) => user.id === storedSession)) {
    session = storedSession;
  } else {
    session = null;
    if (storedSession) clearSession();
  }

  renderRoute();
}

/* ============================== Enrutamiento ============================== */
function routeFromHash() {
  return window.location.hash.replace(/^#\/?/, '').trim();
}

function go(route) {
  const target = `#/${route}`;
  if (window.location.hash === target) {
    renderRoute();
  } else {
    window.location.hash = target;
  }
}

function replaceRoute(route) {
  const target = `#/${route}`;
  if (window.location.hash !== target) {
    window.history.replaceState(null, '', target);
  }
  renderRoute();
}

function renderRoute() {
  const route = routeFromHash();

  if (!session) {
    if (route !== 'login' && route !== 'registro') {
      window.history.replaceState(null, '', '#/login');
      renderAuth('login');
      return;
    }
    renderAuth(route === 'registro' ? 'register' : 'login');
    return;
  }

  const user = currentUser();
  if (!user) {
    clearSession();
    replaceRoute('login');
    return;
  }

  if (!route || route === 'login' || route === 'registro') {
    replaceRoute(defaultRoute(user.role));
    return;
  }

  const allowed = user.role === 'admin'
    ? ['recursos', 'usuarios']
    : user.role === 'psychologist'
      ? ['recursos']
      : ['mi-panel'];

  if (!allowed.includes(route)) {
    replaceRoute(defaultRoute(user.role));
    return;
  }

  renderApp(route);
}

function renderAuth(mode = 'login') {
  dom.authView.hidden = false;
  dom.appView.hidden = true;
  dom.loginPanel.hidden = mode !== 'login';
  dom.registerPanel.hidden = mode !== 'register';
  document.body.classList.remove('sidebar-open', 'modal-open');
  dom.appView.classList.remove('sidebar-open');
  resetPasswordVisibility();
  document.title = mode === 'login' ? 'Iniciar sesión · Banco de recursos' : 'Crear cuenta · Banco de recursos';
}

function resetPasswordVisibility() {
  document.querySelectorAll('[data-toggle-password]').forEach((button) => {
    const input = document.getElementById(button.dataset.togglePassword);
    if (input instanceof HTMLInputElement) input.type = 'password';
    button.textContent = 'Ver';
    button.setAttribute('aria-label', 'Mostrar contraseña');
    button.setAttribute('aria-pressed', 'false');
  });
}

function renderApp(section) {
  const user = currentUser();
  if (!user) {
    replaceRoute('login');
    return;
  }

  ui.section = section;
  dom.authView.hidden = true;
  dom.appView.hidden = false;
  closeSidebar(false);

  document.title = `${SECTION_META[section]?.title || 'Panel'} · Banco de recursos`;

  renderSidebar(user);
  renderTopbar(user, section);

  if (section === 'recursos') {
    renderResourcesPage();
  } else if (section === 'usuarios') {
    renderUsersPage();
  } else {
    renderUserDashboard();
  }

  window.scrollTo({ top: 0, behavior: 'auto' });
}

/* ============================== Navegación e interfaz ============================== */
function renderSidebar(user) {
  const navItems = [];

  if (user.role === 'admin') {
    navItems.push({ id: 'recursos', label: 'Administrar recursos', icon: 'book', count: state.resources.length });
    navItems.push({ id: 'usuarios', label: 'Administrar usuarios', icon: 'users', count: state.users.length });
  } else if (user.role === 'psychologist') {
    navItems.push({ id: 'recursos', label: 'Administrar recursos', icon: 'book', count: state.resources.length });
  } else {
    const assigned = state.lists.filter((list) => list.assignedUserIds.includes(user.id)).length;
    navItems.push({ id: 'mi-panel', label: 'Mis recursos', icon: 'home', count: assigned });
  }

  dom.sidebarContext.textContent = SECTION_META[ui.section]?.context || 'Espacio de trabajo';

  dom.sidebarNav.innerHTML = navItems.map((item) => {
    const active = ui.section === item.id;
    return `
      <button type="button" class="nav-item ${active ? 'is-active' : ''}" data-action="navigate" data-section="${item.id}" ${active ? 'aria-current="page"' : ''}>
        ${icon(item.icon)}
        <span>${escapeHTML(item.label)}</span>
        <span class="nav-count" aria-hidden="true">${item.count}</span>
      </button>
    `;
  }).join('');

  dom.sidebarUser.innerHTML = `
    ${avatarFor(user)}
    <div class="sidebar-user-copy">
      <p class="sidebar-user-name">${escapeHTML(user.username)}</p>
      <p class="sidebar-user-email">${escapeHTML(user.email)}</p>
    </div>
    <span class="badge ${ROLE_META[user.role].badge}" title="Rol: ${escapeHTML(roleLabel(user.role))}">${escapeHTML(roleLabel(user.role))}</span>
  `;
}

function renderTopbar(user, section) {
  dom.topbarSection.textContent = SECTION_META[section]?.label || 'Panel';
  dom.topbarDate.textContent = formatTopbarDate();
  dom.topbarAvatar.textContent = initials(user.username);
  dom.topbarAvatar.title = `${user.username} · ${roleLabel(user.role)}`;
}

function closeSidebar(restoreFocus = false) {
  dom.appView.classList.remove('sidebar-open');
  document.body.classList.remove('sidebar-open');
  if (restoreFocus) {
    dom.appView.querySelector('[data-action="open-sidebar"]')?.focus();
  }
}

function logout() {
  clearSession();
  closeSidebar(false);
  closeModal();
  dom.loginForm.reset();
  dom.registerForm.reset();
  clearAuthErrors(dom.loginForm);
  clearAuthErrors(dom.registerForm);
  if (window.location.hash === '#/login') {
    renderRoute();
  } else {
    window.location.hash = '#/login';
  }
  showToast('Sesión cerrada. ¡Hasta pronto!', 'info');
}

/* ============================== Página: administrar recursos ============================== */
function renderResourcesPage() {
  if (currentUser()) renderSidebar(currentUser());
  const resourceCount = state.resources.length;
  const listCount = state.lists.length;
  const assignmentCount = state.lists.reduce((total, list) => total + list.assignedUserIds.length, 0);
  const highCount = state.resources.filter((resource) => resource.level === 'alto').length;
  const activeTab = ui.resourceTab === 'lists' ? 'lists' : 'resources';
  const isResourcesTab = activeTab === 'resources';
  const searchValue = isResourcesTab ? ui.resourceSearch : ui.listSearch;

  dom.content.innerHTML = `
    <section class="page" aria-labelledby="page-title">
      <header class="page-header">
        <div class="page-heading">
          <p class="eyebrow">Biblioteca pedagógica</p>
          <h1 id="page-title">Administrar recursos</h1>
          <p class="page-subtitle">Organiza el material del equipo, crea listas a medida y compártelas con las personas que las necesitan.</p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-secondary" data-action="new-list">
            ${icon('layers')} Nueva lista
          </button>
          <button type="button" class="btn btn-primary" data-action="new-resource">
            ${icon('plus')} Nuevo recurso
          </button>
        </div>
      </header>

      <div class="stats-grid">
        ${statCard('book', 'teal', 'Recursos', resourceCount, 'Material registrado')}
        ${statCard('layers', 'violet', 'Listas', listCount, 'Colecciones creadas')}
        ${statCard('users', 'blue', 'Asignaciones', assignmentCount, 'Vínculos lista–usuario')}
        ${statCard('alert', 'red', 'Nivel alto', highCount, 'Requieren acompañamiento')}
      </div>

      <div class="panel">
        <div class="panel-toolbar">
          <div class="segmented" role="tablist" aria-label="Vistas de la biblioteca">
            <button type="button" role="tab" aria-selected="${isResourcesTab}" data-action="switch-resource-tab" data-tab="resources">
              ${icon('book')} Recursos
            </button>
            <button type="button" role="tab" aria-selected="${!isResourcesTab}" data-action="switch-resource-tab" data-tab="lists">
              ${icon('layers')} Listas
            </button>
          </div>
          <div class="toolbar-filters">
            <label class="search-box">
              <span class="sr-only">${isResourcesTab ? 'Buscar recursos' : 'Buscar listas'}</span>
              ${icon('search')}
              <input id="library-search" type="search" value="${escapeHTML(searchValue)}" placeholder="${isResourcesTab ? 'Buscar recursos…' : 'Buscar listas…'}" autocomplete="off">
            </label>
            ${isResourcesTab ? `
              <select id="resource-level-filter" class="filter-select" aria-label="Filtrar recursos por nivel">
                <option value="all" ${ui.resourceLevel === 'all' ? 'selected' : ''}>Todos los niveles</option>
                <option value="bajo" ${ui.resourceLevel === 'bajo' ? 'selected' : ''}>Nivel bajo</option>
                <option value="medio" ${ui.resourceLevel === 'medio' ? 'selected' : ''}>Nivel medio</option>
                <option value="alto" ${ui.resourceLevel === 'alto' ? 'selected' : ''}>Nivel alto</option>
              </select>
            ` : ''}
          </div>
        </div>
        <div id="library-region">${isResourcesTab ? renderResourceTable() : renderListTable()}</div>
        <div class="panel-footnote">
          ${icon('info')}
          <span data-upload-usage>${isResourcesTab ? 'Los archivos se guardan en la carpeta uploads del servidor. Tamaño máximo: 25 MB por archivo.' : 'Asigna cada lista a las personas que deben verla en su panel.'}</span>
        </div>
      </div>
    </section>
  `;

  if (isResourcesTab) refreshUploadUsage();
}

async function refreshUploadUsage() {
  const target = dom.content.querySelector('[data-upload-usage]');
  if (!target) return;
  try {
    const response = await fetch('/api/usage', { headers: { Accept: 'application/json' } });
    if (!response.ok) return;
    const usage = await response.json();
    if (!target.isConnected) return;
    const used = formatBytes(usage.usedBytes);
    const limit = formatBytes(usage.limitBytes);
    const percent = usage.limitBytes > 0
      ? Math.round((usage.usedBytes / usage.limitBytes) * 100)
      : 0;
    target.textContent = `uploads: ${used} de ${limit} usados (${percent} %) · máx. ${formatBytes(MAX_FILE_SIZE)} por archivo.`;
  } catch (error) {
    // Si el servidor no está disponible, se conserva el texto por defecto.
  }
}

function statCard(iconName, tone, label, value, hint) {
  return `
    <article class="stat-card">
      <span class="stat-icon stat-icon--${tone}" aria-hidden="true">${icon(iconName)}</span>
      <div class="stat-copy">
        <p class="stat-label">${escapeHTML(label)}</p>
        <p class="stat-value">${escapeHTML(String(value))}</p>
        <p class="stat-hint">${escapeHTML(hint)}</p>
      </div>
    </article>
  `;
}

function emptyState({ iconName = 'book', title, text, action = '', compact = false }) {
  return `
    <div class="empty-state ${compact ? 'empty-state--compact' : ''}">
      <span class="empty-icon" aria-hidden="true">${icon(iconName)}</span>
      <h3>${escapeHTML(title)}</h3>
      <p>${escapeHTML(text)}</p>
      ${action}
    </div>
  `;
}

function renderLibraryRegion() {
  const region = document.getElementById('library-region');
  if (!region) return;
  region.innerHTML = ui.resourceTab === 'lists' ? renderListTable() : renderResourceTable();
}

function renderResourceTable() {
  if (!state.resources.length) {
    return emptyState({
      iconName: 'book',
      title: 'Aún no hay recursos',
      text: 'Crea el primer recurso pedagógico para empezar a construir la biblioteca del equipo.',
      action: '<button type="button" class="btn btn-primary" data-action="new-resource">' + icon('plus') + ' Crear primer recurso</button>'
    });
  }

  const term = normalize(ui.resourceSearch);
  const level = ui.resourceLevel;
  const filtered = state.resources
    .filter((resource) => level === 'all' || resource.level === level)
    .filter((resource) => {
      if (!term) return true;
      const creator = findUser(resource.createdBy);
      return [resource.name, resource.description, resource.file?.name, creator?.username]
        .some((value) => normalize(value).includes(term));
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!filtered.length) {
    return emptyState({
      iconName: 'search',
      title: 'No encontramos coincidencias',
      text: 'Prueba con otro término de búsqueda o cambia el filtro de nivel.',
      action: '<button type="button" class="btn btn-secondary" data-action="clear-resource-filters">Limpiar filtros</button>',
      compact: true
    });
  }

  const rows = filtered.map((resource) => {
    const meta = getFileMeta(resource.file);
    const creator = findUser(resource.createdBy);
    const canDownload = isDownloadable(resource);
    return `
      <tr>
        <td data-label="Recurso">
          <div class="item-cell">
            <span class="file-tile file-tile--${meta.tone}" aria-hidden="true">${meta.tone === 'none' ? icon('file') : escapeHTML(meta.abbr)}</span>
            <div class="item-copy">
              <button type="button" class="item-title-button" data-action="view-resource" data-id="${escapeHTML(resource.id)}">${escapeHTML(resource.name)}</button>
              <p class="item-sub" title="${escapeHTML(resource.description)}">${escapeHTML(resource.description)}</p>
            </div>
          </div>
        </td>
        <td data-label="Nivel">${levelBadge(resource.level)}</td>
        <td data-label="Archivo">${fileCell(resource)}</td>
        <td data-label="Creado">
          <span class="cell-muted" title="Creado por ${escapeHTML(creator?.username || 'un usuario eliminado')}">${formatDate(resource.createdAt)}</span>
        </td>
        <td class="actions" data-label="Acciones">
          <div class="row-actions">
            <button type="button" class="row-action" data-action="view-resource" data-id="${escapeHTML(resource.id)}" title="Ver detalle" aria-label="Ver detalle de ${escapeHTML(resource.name)}">${icon('eye')}</button>
            <button type="button" class="row-action" data-action="edit-resource" data-id="${escapeHTML(resource.id)}" title="Editar recurso" aria-label="Editar ${escapeHTML(resource.name)}">${icon('pencil')}</button>
            <button type="button" class="row-action row-action--download" data-action="download-resource" data-id="${escapeHTML(resource.id)}" title="${canDownload ? 'Descargar archivo' : 'Sin archivo adjunto'}" aria-label="Descargar archivo de ${escapeHTML(resource.name)}" ${canDownload ? '' : 'disabled'}>${icon('download')}</button>
            <button type="button" class="row-action row-action--danger" data-action="delete-resource" data-id="${escapeHTML(resource.id)}" title="Eliminar recurso" aria-label="Eliminar ${escapeHTML(resource.name)}">${icon('trash')}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th scope="col">Recurso</th>
            <th scope="col">Nivel</th>
            <th scope="col">Archivo</th>
            <th scope="col">Creado</th>
            <th scope="col"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function fileCell(resource) {
  if (!resource.file) return '<span class="no-file">Sin archivo</span>';
  return `
    <span class="file-chip" title="${escapeHTML(resource.file.name)}">
      ${icon('file')}
      <span class="file-chip-name">${escapeHTML(resource.file.name)}</span>
      <span class="file-chip-size">${formatBytes(resource.file.size)}</span>
    </span>
  `;
}

function renderListTable() {
  if (!state.lists.length) {
    return emptyState({
      iconName: 'layers',
      title: 'Aún no hay listas',
      text: 'Agrupa varios recursos en una lista y asígnala a uno o más usuarios.',
      action: '<button type="button" class="btn btn-primary" data-action="new-list">' + icon('plus') + ' Crear primera lista</button>'
    });
  }

  const term = normalize(ui.listSearch);
  const filtered = state.lists
    .filter((list) => {
      if (!term) return true;
      const users = list.assignedUserIds.map(findUser).filter(Boolean);
      const resources = list.resourceIds.map(findResource).filter(Boolean);
      return [list.name, list.description, ...users.map((user) => `${user.username} ${user.email}`), ...resources.map((resource) => resource.name)]
        .some((value) => normalize(value).includes(term));
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!filtered.length) {
    return emptyState({
      iconName: 'search',
      title: 'No encontramos listas',
      text: 'Prueba con otro término de búsqueda o crea una nueva lista de recursos.',
      action: '<button type="button" class="btn btn-secondary" data-action="clear-resource-filters">Limpiar búsqueda</button>',
      compact: true
    });
  }

  const rows = filtered.map((list) => {
    const users = list.assignedUserIds.map(findUser).filter(Boolean);
    const count = list.resourceIds.length;
    return `
      <tr>
        <td data-label="Lista">
          <div class="item-cell">
            <span class="list-tile" aria-hidden="true">${icon('layers')}</span>
            <div class="item-copy">
              <button type="button" class="item-title-button" data-action="view-list" data-id="${escapeHTML(list.id)}">${escapeHTML(list.name)}</button>
              <p class="item-sub" title="${escapeHTML(list.description || '')}">${escapeHTML(list.description || 'Sin descripción')}</p>
            </div>
          </div>
        </td>
        <td data-label="Recursos"><span class="count-chip">${plural(count, 'recurso', 'recursos')}</span></td>
        <td data-label="Asignada a">${assignedCell(users)}</td>
        <td data-label="Creada"><span class="cell-muted">${formatDate(list.createdAt)}</span></td>
        <td class="actions" data-label="Acciones">
          <div class="row-actions">
            <button type="button" class="row-action" data-action="view-list" data-id="${escapeHTML(list.id)}" title="Ver lista" aria-label="Ver lista ${escapeHTML(list.name)}">${icon('eye')}</button>
            <button type="button" class="row-action" data-action="edit-list" data-id="${escapeHTML(list.id)}" title="Editar y asignar" aria-label="Editar y asignar ${escapeHTML(list.name)}">${icon('pencil')}</button>
            <button type="button" class="row-action row-action--danger" data-action="delete-list" data-id="${escapeHTML(list.id)}" title="Eliminar lista" aria-label="Eliminar lista ${escapeHTML(list.name)}">${icon('trash')}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th scope="col">Lista</th>
            <th scope="col">Recursos</th>
            <th scope="col">Asignada a</th>
            <th scope="col">Creada</th>
            <th scope="col"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function assignedCell(users) {
  if (!users.length) {
    return '<span class="badge badge--neutral">Sin asignar</span>';
  }
  const allNames = users.map((user) => user.username).join(', ');
  const shortNames = users.slice(0, 2).map((user) => user.username.split(/\s+/)[0]).join(', ');
  const rest = users.length > 2 ? ` +${users.length - 2}` : '';
  return `
    <div class="assigned-cell" title="Asignada a ${escapeHTML(allNames)}">
      <div class="avatar-stack" aria-hidden="true">
        ${users.slice(0, 3).map((user) => avatarFor(user)).join('')}
        ${users.length > 3 ? `<span class="avatar-stack-more">+${users.length - 3}</span>` : ''}
      </div>
      <span class="assigned-names">${escapeHTML(shortNames + rest)}</span>
    </div>
  `;
}

/* ============================== Página: administrar usuarios ============================== */
function renderUsersPage() {
  if (currentUser()) renderSidebar(currentUser());
  if (!isAdmin()) {
    showToast('No tienes permisos para administrar usuarios.', 'error');
    go(defaultRoute(currentUser()?.role));
    return;
  }

  const admins = state.users.filter((user) => user.role === 'admin').length;
  const psychs = state.users.filter((user) => user.role === 'psychologist').length;
  const users = state.users.filter((user) => user.role === 'user').length;

  dom.content.innerHTML = `
    <section class="page" aria-labelledby="page-title">
      <header class="page-header">
        <div class="page-heading">
          <p class="eyebrow">Equipo y accesos</p>
          <h1 id="page-title">Administrar usuarios</h1>
          <p class="page-subtitle">Gestiona las cuentas de la aplicación, sus roles y el acceso a los recursos compartidos.</p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-primary" data-action="new-user">
            ${icon('plus')} Nuevo usuario
          </button>
        </div>
      </header>

      <div class="stats-grid">
        ${statCard('users', 'teal', 'Cuentas totales', state.users.length, 'Usuarios registrados')}
        ${statCard('shield', 'violet', 'Administradores', admins, 'Acceso completo')}
        ${statCard('user', 'blue', 'Psicólogos', psychs, 'Gestión de recursos')}
        ${statCard('book', 'amber', 'Usuarios', users, 'Consulta de listas asignadas')}
      </div>

      <div class="panel">
        <div class="panel-toolbar">
          <div class="section-title-row">
            <strong>Cuentas registradas</strong>
            <span class="section-count">${state.users.length}</span>
          </div>
          <div class="toolbar-filters">
            <label class="search-box">
              <span class="sr-only">Buscar usuarios</span>
              ${icon('search')}
              <input id="users-search" type="search" value="${escapeHTML(ui.userSearch)}" placeholder="Buscar por nombre o correo…" autocomplete="off">
            </label>
            <select id="users-role-filter" class="filter-select" aria-label="Filtrar usuarios por rol">
              <option value="all" ${ui.userRole === 'all' ? 'selected' : ''}>Todos los roles</option>
              <option value="admin" ${ui.userRole === 'admin' ? 'selected' : ''}>Administradores</option>
              <option value="psychologist" ${ui.userRole === 'psychologist' ? 'selected' : ''}>Psicólogos</option>
              <option value="user" ${ui.userRole === 'user' ? 'selected' : ''}>Usuarios</option>
            </select>
          </div>
        </div>
        <div id="users-region">${getUsersTableHtml()}</div>
        <div class="panel-footnote">
          ${icon('shield')}
          <span>Los cambios de rol se guardan al instante. No puedes eliminar tu propia cuenta ni cambiar tu propio rol.</span>
        </div>
      </div>
    </section>
  `;
}

function renderUsersRegion() {
  const region = document.getElementById('users-region');
  if (!region) return;
  region.innerHTML = getUsersTableHtml();
}

function getUsersTableHtml() {
  const me = currentUser();
  const term = normalize(ui.userSearch);
  const role = ui.userRole;
  const filtered = state.users
    .filter((user) => role === 'all' || user.role === role)
    .filter((user) => !term || normalize(`${user.username} ${user.email}`).includes(term))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  if (!filtered.length) {
    return emptyState({
      iconName: 'search',
      title: 'No encontramos usuarios',
      text: 'Prueba con otro nombre, correo o rol.',
      action: '<button type="button" class="btn btn-secondary" data-action="clear-user-filters">Limpiar filtros</button>',
      compact: true
    });
  }

  const adminCount = state.users.filter((user) => user.role === 'admin').length;

  const rows = filtered.map((user) => {
    const isSelf = user.id === me.id;
    const isLastAdmin = user.role === 'admin' && adminCount <= 1;
    const protectedUser = isSelf || isLastAdmin;
    return `
      <tr>
        <td data-label="Usuario">
          <div class="user-cell">
            ${avatarFor(user)}
            <div class="item-copy">
              <div class="user-name-row">
                <span class="item-title" title="${escapeHTML(user.username)}">${escapeHTML(user.username)}</span>
                ${isSelf ? '<span class="self-chip">Tú</span>' : ''}
              </div>
            </div>
          </div>
        </td>
        <td data-label="Correo"><span class="cell-muted">${escapeHTML(user.email)}</span></td>
        <td data-label="Rol">
          <select class="role-select" data-role-select data-user-id="${escapeHTML(user.id)}" aria-label="Rol de ${escapeHTML(user.username)}" ${isSelf ? 'disabled' : ''} title="${isSelf ? 'No puedes cambiar tu propio rol' : 'Cambiar rol'}">
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
            <option value="psychologist" ${user.role === 'psychologist' ? 'selected' : ''}>Psicólogo</option>
            <option value="user" ${user.role === 'user' ? 'selected' : ''}>Usuario</option>
          </select>
        </td>
        <td data-label="Alta"><span class="cell-muted">${formatDate(user.createdAt)}</span></td>
        <td class="actions" data-label="Acciones">
          <div class="row-actions">
            <button type="button" class="row-action row-action--danger" data-action="delete-user" data-id="${escapeHTML(user.id)}" title="${isSelf ? 'No puedes eliminar tu propia cuenta' : isLastAdmin ? 'Debe existir al menos un administrador' : 'Eliminar usuario'}" aria-label="Eliminar a ${escapeHTML(user.username)}" ${protectedUser ? 'disabled' : ''}>${icon('trash')}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th scope="col">Usuario</th>
            <th scope="col">Correo</th>
            <th scope="col">Rol</th>
            <th scope="col">Alta</th>
            <th scope="col"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

/* ============================== Página: panel del usuario ============================== */
function getDashboardData() {
  const user = currentUser();
  if (!user) return { lists: [], resources: [], memberships: new Map() };

  const lists = state.lists
    .filter((list) => list.assignedUserIds.includes(user.id))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const resourceMap = new Map();
  const memberships = new Map();

  lists.forEach((list) => {
    list.resourceIds.forEach((resourceId) => {
      const resource = findResource(resourceId);
      if (!resource) return;
      if (!resourceMap.has(resourceId)) resourceMap.set(resourceId, resource);
      memberships.set(resourceId, (memberships.get(resourceId) || 0) + 1);
    });
  });

  const resources = Array.from(resourceMap.values())
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  return { lists, resources, memberships };
}

function renderUserDashboard() {
  const user = currentUser();
  if (!user) return;
  renderSidebar(user);

  const { lists, resources } = getDashboardData();
  const files = resources.filter(isDownloadable).length;
  const firstName = user.username.split(/\s+/)[0] || user.username;

  const listsSection = lists.length
    ? `
      <section class="section-block" aria-labelledby="my-lists-title">
        <div class="section-heading">
          <div class="section-title-row">
            <h2 id="my-lists-title">Mis listas</h2>
            <span class="section-count">${lists.length}</span>
          </div>
        </div>
        <div class="list-grid">
          ${lists.map(renderListCard).join('')}
        </div>
      </section>
    `
    : '';

  const resourcesSection = lists.length
    ? `
      <section class="section-block" aria-labelledby="my-resources-title">
        <div class="section-heading">
          <div class="section-title-row">
            <h2 id="my-resources-title">Recursos disponibles</h2>
            <span class="section-count">${resources.length}</span>
          </div>
          <label class="search-box">
            <span class="sr-only">Buscar en mis recursos</span>
            ${icon('search')}
            <input id="dashboard-search" type="search" value="${escapeHTML(ui.dashboardSearch)}" placeholder="Buscar en mis recursos…" autocomplete="off">
          </label>
        </div>
        <div id="user-resources-region">${renderUserResourceCards(resources, getDashboardData().memberships)}</div>
      </section>
    `
    : `
      <div class="panel">
        ${emptyState({
          iconName: 'layers',
          title: 'Aún no tienes recursos asignados',
          text: 'Cuando un administrador o psicólogo te asigne una lista, sus recursos aparecerán aquí.',
          action: ''
        })}
      </div>
    `;

  dom.content.innerHTML = `
    <section class="page" aria-labelledby="page-title">
      <div class="welcome-banner">
        <div class="welcome-copy">
          <p class="eyebrow">Tu espacio</p>
          <h1 id="page-title">Hola, ${escapeHTML(firstName)}</h1>
          <p>Aquí encontrarás los recursos y listas que tu equipo preparó para acompañarte.</p>
        </div>
        <div class="welcome-stats" aria-label="Resumen de tus recursos">
          <div class="welcome-stat">
            <p class="welcome-stat-value">${lists.length}</p>
            <p class="welcome-stat-label">${lists.length === 1 ? 'Lista asignada' : 'Listas asignadas'}</p>
          </div>
          <div class="welcome-stat">
            <p class="welcome-stat-value">${resources.length}</p>
            <p class="welcome-stat-label">${resources.length === 1 ? 'Recurso' : 'Recursos'}</p>
          </div>
          <div class="welcome-stat">
            <p class="welcome-stat-value">${files}</p>
            <p class="welcome-stat-label">${files === 1 ? 'Archivo' : 'Archivos'}</p>
          </div>
        </div>
      </div>
      ${listsSection}
      ${resourcesSection}
    </section>
  `;
}

function renderListCard(list) {
  const resources = list.resourceIds.map(findResource).filter(Boolean);
  const counts = { bajo: 0, medio: 0, alto: 0 };
  resources.forEach((resource) => {
    if (counts[resource.level] !== undefined) counts[resource.level] += 1;
  });
  const levelChips = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([level, count]) => `<span class="level-dot level-dot--${level}">${escapeHTML(levelLabel(level))} · ${count}</span>`)
    .join('');

  return `
    <article class="list-card">
      <div class="list-card-top">
        <span class="list-card-icon" aria-hidden="true">${icon('layers')}</span>
        <span class="count-chip">${plural(resources.length, 'recurso', 'recursos')}</span>
      </div>
      <h3>${escapeHTML(list.name)}</h3>
      <p class="list-card-desc">${escapeHTML(list.description || 'Una selección de recursos preparada para ti.')}</p>
      <div class="level-dots">${levelChips || '<span class="level-dot">Sin recursos</span>'}</div>
      <div class="list-card-footer">
        <span class="card-date">${icon('calendar')} ${formatDate(list.createdAt)}</span>
        <button type="button" class="btn btn-secondary btn-sm" data-action="view-list" data-id="${escapeHTML(list.id)}">
          ${icon('eye')} Abrir lista
        </button>
      </div>
    </article>
  `;
}

function renderUserResourceCards(resources = null, memberships = null) {
  const data = resources && memberships ? { resources, memberships } : getDashboardData();
  const term = normalize(ui.dashboardSearch);
  const filtered = data.resources.filter((resource) => {
    if (!term) return true;
    return normalize(`${resource.name} ${resource.description}`).includes(term);
  });

  if (!filtered.length) {
    return emptyState({
      iconName: 'search',
      title: 'No encontramos recursos',
      text: 'Prueba con otro término de búsqueda.',
      action: ui.dashboardSearch
        ? '<button type="button" class="btn btn-secondary" data-action="clear-dashboard-search">Limpiar búsqueda</button>'
        : '',
      compact: true
    });
  }

  return `
    <div class="resource-grid">
      ${filtered.map((resource) => renderResourceCard(resource, data.memberships.get(resource.id) || 1)).join('')}
    </div>
  `;
}

function renderResourceCard(resource, membershipCount) {
  const meta = getFileMeta(resource.file);
  const downloadable = isDownloadable(resource);
  return `
    <article class="resource-card">
      <div class="resource-card-top">
        <span class="resource-file-icon resource-file-icon--${meta.tone}" aria-hidden="true">${meta.tone === 'none' ? icon('file') : escapeHTML(meta.abbr)}</span>
        ${levelBadge(resource.level)}
      </div>
      <h3>${escapeHTML(resource.name)}</h3>
      <p class="resource-card-desc">${escapeHTML(resource.description)}</p>
      <div class="resource-card-meta">
        <span class="in-list-chip">En ${plural(membershipCount, 'lista', 'listas')}</span>
        ${resource.file ? `<span class="in-list-chip">${escapeHTML(meta.label)}</span>` : ''}
      </div>
      <div class="resource-card-file ${resource.file ? '' : 'resource-card-file--empty'}">
        ${icon('file')}
        <span>${resource.file ? `${escapeHTML(resource.file.name)} · ${formatBytes(resource.file.size)}` : 'Sin archivo adjunto'}</span>
      </div>
      <div class="resource-card-actions">
        ${downloadable ? `
          <button type="button" class="btn btn-secondary btn-sm" data-action="open-resource" data-id="${escapeHTML(resource.id)}">
            ${icon('eye')} Abrir
          </button>
          <button type="button" class="btn btn-primary btn-sm" data-action="download-resource" data-id="${escapeHTML(resource.id)}">
            ${icon('download')} Descargar
          </button>
        ` : `
          <button type="button" class="btn btn-secondary btn-sm" disabled>Sin archivo</button>
        `}
      </div>
    </article>
  `;
}

function renderUserResources() {
  const region = document.getElementById('user-resources-region');
  if (!region) return;
  region.innerHTML = renderUserResourceCards();
}

/* ============================== Modales ============================== */
function openModal({ title, subtitle = '', body, size = 'md', headerIcon = null, initialFocus = null }) {
  dom.modal.className = `modal modal--${size}`;
  dom.modal.innerHTML = `
    <div class="modal-card">
      <header class="modal-header">
        <div class="modal-heading">
          ${headerIcon ? `<span class="modal-icon" aria-hidden="true">${icon(headerIcon)}</span>` : ''}
          <div>
            <h2 id="modal-title">${escapeHTML(title)}</h2>
            ${subtitle ? `<p>${escapeHTML(subtitle)}</p>` : ''}
          </div>
        </div>
        <button type="button" class="icon-btn" data-action="close-modal" aria-label="Cerrar ventana">${icon('x')}</button>
      </header>
      <div class="modal-body">${body}</div>
    </div>
  `;

  if (!dom.modal.open) dom.modal.showModal();
  document.body.classList.add('modal-open');

  if (initialFocus) {
    window.setTimeout(() => dom.modal.querySelector(initialFocus)?.focus(), 20);
  }
}

function closeModal() {
  if (dom.modal.open) dom.modal.close();
}

function confirmAction({ title, message, hint = '', confirmLabel = 'Eliminar', danger = true, initialFocus = '[data-confirm-no]' }) {
  return new Promise((resolve) => {
    openModal({
      title,
      subtitle: 'Esta acción requiere confirmación',
      size: 'sm',
      body: `
        <div class="confirm-body">
          <span class="confirm-icon" aria-hidden="true">${icon('alert')}</span>
          <p>${escapeHTML(message)}</p>
          ${hint ? `<p class="confirm-hint">${escapeHTML(hint)}</p>` : ''}
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" data-confirm-no>Cancelar</button>
            <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm-yes>${escapeHTML(confirmLabel)}</button>
          </div>
        </div>
      `
    });

    const finish = (value) => {
      if (dom.modal.open) dom.modal.close();
      resolve(value);
    };

    dom.modal.querySelector('[data-confirm-yes]')?.addEventListener('click', () => finish(true), { once: true });
    dom.modal.querySelector('[data-confirm-no]')?.addEventListener('click', () => finish(false), { once: true });
    dom.modal.addEventListener('close', () => resolve(false), { once: true });

    if (initialFocus) {
      window.setTimeout(() => dom.modal.querySelector(initialFocus)?.focus(), 20);
    }
  });
}

/* ============================== Formulario: recurso ============================== */
function openResourceForm(resourceId = null) {
  if (!canManageResources()) {
    showToast('No tienes permisos para modificar recursos.', 'error');
    return;
  }

  const resource = resourceId ? findResource(resourceId) : null;
  if (resourceId && !resource) {
    showToast('El recurso ya no existe.', 'error');
    return;
  }

  const levelOptions = Object.entries(LEVELS).map(([value, meta]) => (
    `<option value="${value}" ${(resource?.level || 'bajo') === value ? 'selected' : ''}>${escapeHTML(meta.label)}</option>`
  )).join('');

  openModal({
    title: resource ? 'Editar recurso' : 'Nuevo recurso',
    subtitle: resource ? 'Actualiza la información o el archivo del recurso.' : 'Registra el material que formará parte de la biblioteca.',
    size: 'md',
    headerIcon: 'book',
    initialFocus: '#resource-name',
    body: `
      <form data-form="resource" data-id="${escapeHTML(resource?.id || '')}" novalidate>
        <div class="form-grid">
          <div class="field">
            <label for="resource-name">Nombre del recurso</label>
            <input id="resource-name" name="name" type="text" maxlength="100" value="${escapeHTML(resource?.name || '')}" placeholder="Ej. Guía de respiración consciente" aria-describedby="resource-name-error">
            <p class="field-error" data-error-for="name" hidden></p>
          </div>

          <div class="field">
            <label for="resource-description">Descripción</label>
            <textarea id="resource-description" name="description" maxlength="650" placeholder="Describe brevemente el objetivo y el uso del recurso…" aria-describedby="resource-description-error">${escapeHTML(resource?.description || '')}</textarea>
            <p class="field-error" data-error-for="description" hidden></p>
          </div>

          <div class="form-row">
            <div class="field">
              <label for="resource-level">Nivel del recurso</label>
              <select id="resource-level" name="level" aria-describedby="resource-level-error">
                ${levelOptions}
              </select>
              <p class="field-error" data-error-for="level" hidden></p>
            </div>
            <div class="field upload-field">
              <label for="resource-file">Archivo adjunto</label>
              <input id="resource-file" name="file" type="file" accept="${ACCEPT_FILES}" data-file-input aria-describedby="resource-file-hint resource-file-error">
              <p class="field-hint" id="resource-file-hint">TXT, Word, Excel, PowerPoint, PDF, video o audio · máx. 25 MB.</p>
              <p class="field-hint" data-file-info hidden></p>
              <p class="field-error" data-error-for="file" hidden></p>
            </div>
          </div>

          ${resource?.file ? `
            <div class="existing-file">
              <span class="file-tile file-tile--${getFileMeta(resource.file).tone}" aria-hidden="true">${escapeHTML(getFileMeta(resource.file).abbr)}</span>
              <div class="existing-file-copy">
                <p class="existing-file-name">${escapeHTML(resource.file.name)}</p>
                <p class="existing-file-meta">Archivo actual · ${formatBytes(resource.file.size)}</p>
              </div>
              <label class="checkbox-inline">
                <input type="checkbox" name="removeFile" value="1">
                Quitar archivo
              </label>
            </div>
          ` : ''}
        </div>

        <p class="form-alert form-error" data-form-alert hidden></p>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" data-action="close-modal">Cancelar</button>
          <button type="submit" class="btn btn-primary">${icon('check-circle')} ${resource ? 'Guardar cambios' : 'Crear recurso'}</button>
        </div>
      </form>
    `
  });
}

async function handleResourceSubmit(form) {
  if (!canManageResources()) {
    showToast('No tienes permisos para guardar recursos.', 'error');
    return;
  }

  clearModalErrors(form);
  const editingId = form.dataset.id;
  const existing = editingId ? findResource(editingId) : null;
  const name = form.elements.name.value.trim();
  const description = form.elements.description.value.trim();
  const level = form.elements.level.value;
  const fileInput = form.elements.file;
  const chosenFile = fileInput.files?.[0] || null;
  const removeFile = Boolean(form.elements.removeFile?.checked);
  let valid = true;
  let firstInvalid = null;

  if (!name) {
    setModalFieldError(form, 'name', 'El nombre del recurso es obligatorio.');
    valid = false;
    firstInvalid = firstInvalid || form.elements.name;
  } else if (name.length < 3) {
    setModalFieldError(form, 'name', 'Usa al menos 3 caracteres.');
    valid = false;
    firstInvalid = firstInvalid || form.elements.name;
  }

  if (!description) {
    setModalFieldError(form, 'description', 'La descripción es obligatoria.');
    valid = false;
    firstInvalid = firstInvalid || form.elements.description;
  } else if (description.length < 5) {
    setModalFieldError(form, 'description', 'La descripción es demasiado corta.');
    valid = false;
    firstInvalid = firstInvalid || form.elements.description;
  }

  if (!LEVELS[level]) {
    setModalFieldError(form, 'level', 'Selecciona un nivel válido.');
    valid = false;
    firstInvalid = firstInvalid || form.elements.level;
  }

  if (chosenFile) {
    const ext = chosenFile.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setModalFieldError(form, 'file', 'Formato no permitido. Usa TXT, Word, Excel, PowerPoint, PDF, video o audio.');
      valid = false;
      firstInvalid = firstInvalid || fileInput;
    } else if (chosenFile.size > MAX_FILE_SIZE) {
      setModalFieldError(form, 'file', 'El archivo supera 25 MB. Elige uno más pequeño.');
      valid = false;
      firstInvalid = firstInvalid || fileInput;
    }
  }

  if (!valid) {
    firstInvalid?.focus();
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  setBusy(submitButton, true, 'Guardando…');

  let file = existing?.file || null;
  const previousFile = file;
  if (removeFile) file = null;

  if (chosenFile) {
    try {
      file = await uploadFile(chosenFile);
    } catch (error) {
      setModalFieldError(
        form,
        'file',
        error?.message || 'No se pudo subir el archivo. Inténtalo de nuevo.'
      );
      setBusy(submitButton, false);
      fileInput.focus();
      return;
    }
  }

  let saved = false;
  if (existing) {
    saved = commit(() => {
      existing.name = name;
      existing.description = description;
      existing.level = level;
      existing.file = file;
      existing.updatedAt = new Date().toISOString();
    });
  } else {
    const resource = {
      id: uid('res'),
      name,
      description,
      level,
      file,
      createdAt: new Date().toISOString(),
      createdBy: currentUser().id
    };
    saved = commit(() => {
      state.resources.push(resource);
    });
  }

  setBusy(submitButton, false);

  if (!saved) {
    if (chosenFile && file && file !== previousFile) {
      deleteUploadedFile(file);
    }
    showModalAlert(form, 'No se pudo guardar el recurso. Revisa el espacio disponible en el navegador.');
    return;
  }

  if (previousFile && previousFile !== file) {
    deleteUploadedFile(previousFile);
  }

  closeModal();
  ui.resourceTab = 'resources';
  showToast(existing ? 'Recurso actualizado correctamente.' : 'Recurso creado correctamente.', 'success');
  renderResourcesPage();
}

async function uploadFile(file, originalName = file.name) {
  let response;
  try {
    response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(originalName),
        'X-File-Type': file.type || 'application/octet-stream'
      },
      body: file
    });
  } catch (error) {
    throw new Error('No se pudo conectar con el servidor. Inicia el servidor con "python3 server.py".');
  }

  if (!response.ok) {
    let message = 'No se pudo subir el archivo.';
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch (error) {
      // La respuesta no era JSON; se conserva el mensaje genérico.
    }
    throw new Error(message);
  }

  return response.json();
}

function deleteUploadedFile(file) {
  if (!file?.storedName) return;
  fetch(`/api/files/${encodeURIComponent(file.storedName)}`, { method: 'DELETE' }).catch((error) => {
    console.warn('No se pudo eliminar el archivo del servidor:', error);
  });
}

/* ============================== Formulario: lista ============================== */
function openListForm(listId = null) {
  if (!canManageResources()) {
    showToast('No tienes permisos para crear listas.', 'error');
    return;
  }

  const list = listId ? findList(listId) : null;
  if (listId && !list) {
    showToast('La lista ya no existe.', 'error');
    return;
  }

  if (!state.resources.length) {
    showToast('Primero crea al menos un recurso para armar una lista.', 'info');
    openModal({
      title: 'Crea un recurso primero',
      subtitle: 'Las listas se construyen con recursos existentes',
      size: 'sm',
      headerIcon: 'book',
      body: `
        ${emptyState({
          iconName: 'book',
          title: 'La biblioteca está vacía',
          text: 'Registra tu primer recurso pedagógico y luego podrás agruparlo en una lista.',
          action: '<button type="button" class="btn btn-primary" data-action="new-resource">' + icon('plus') + ' Crear recurso</button>',
          compact: true
        })}
      `
    });
    return;
  }

  const selectedResources = new Set(list?.resourceIds || []);
  const selectedUsers = new Set(list?.assignedUserIds || []);
  const resources = [...state.resources].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const assignableUsers = sortedByName(state.users.filter((user) => user.role === 'user'));
  const currentRole = currentUser()?.role;

  const resourcesChecklist = resources.map((resource) => `
    <label class="check-card">
      <input type="checkbox" name="resourceIds" value="${escapeHTML(resource.id)}" ${selectedResources.has(resource.id) ? 'checked' : ''}>
      <span class="check-copy">
        <strong>${escapeHTML(resource.name)}</strong>
        <small>Nivel ${escapeHTML(levelLabel(resource.level).toLowerCase())} · ${resource.file ? escapeHTML(resource.file.name) : 'Sin archivo'}</small>
      </span>
    </label>
  `).join('');

  const usersChecklist = assignableUsers.length
    ? assignableUsers.map((user) => `
        <label class="check-card">
          <input type="checkbox" name="assignedUserIds" value="${escapeHTML(user.id)}" ${selectedUsers.has(user.id) ? 'checked' : ''}>
          <span class="check-copy">
            <strong>${escapeHTML(user.username)}</strong>
            <small>${escapeHTML(user.email)}</small>
          </span>
        </label>
      `).join('')
    : `
      <p class="checklist-empty">
        ${currentRole === 'admin'
          ? 'Aún no hay usuarios con rol Usuario. Créalos desde “Administrar usuarios”.'
          : 'Aún no hay usuarios con rol Usuario. Pide a un administrador que cree una cuenta.'}
      </p>
    `;

  openModal({
    title: list ? 'Editar lista' : 'Nueva lista',
    subtitle: list ? 'Actualiza los recursos y las personas asignadas.' : 'Selecciona recursos y decide a quién compartirlos.',
    size: 'lg',
    headerIcon: 'layers',
    initialFocus: '#list-name',
    body: `
      <form data-form="list" data-id="${escapeHTML(list?.id || '')}" novalidate>
        <div class="form-grid">
          <div class="field">
            <label for="list-name">Nombre de la lista</label>
            <input id="list-name" name="name" type="text" maxlength="100" value="${escapeHTML(list?.name || '')}" placeholder="Ej. Kit de regulación emocional" aria-describedby="list-name-error">
            <p class="field-error" data-error-for="name" hidden></p>
          </div>

          <div class="field">
            <label for="list-description">Descripción <span class="field-hint">(opcional)</span></label>
            <textarea id="list-description" name="description" maxlength="500" placeholder="¿Para qué momento o necesidad está pensada esta lista?">${escapeHTML(list?.description || '')}</textarea>
          </div>

          <fieldset class="check-fieldset">
            <legend>Recursos de la lista <span class="legend-hint">Selecciona al menos uno</span></legend>
            <div class="checklist">${resourcesChecklist}</div>
            <p class="field-error checklist-error" data-error-for="resourceIds" hidden></p>
          </fieldset>

          <fieldset class="check-fieldset">
            <legend>Asignar a usuarios <span class="legend-hint">Puedes hacerlo ahora o más tarde</span></legend>
            <div class="checklist checklist--two-col">${usersChecklist}</div>
            <p class="field-error checklist-error" data-error-for="assignedUserIds" hidden></p>
          </fieldset>
        </div>

        <p class="form-alert form-error" data-form-alert hidden></p>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" data-action="close-modal">Cancelar</button>
          <button type="submit" class="btn btn-primary">${icon('check-circle')} ${list ? 'Guardar cambios' : 'Crear lista'}</button>
        </div>
      </form>
    `
  });
}

function handleListSubmit(form) {
  if (!canManageResources()) {
    showToast('No tienes permisos para guardar listas.', 'error');
    return;
  }

  clearModalErrors(form);
  const editingId = form.dataset.id;
  const existing = editingId ? findList(editingId) : null;
  const name = form.elements.name.value.trim();
  const description = form.elements.description.value.trim();
  const resourceIds = Array.from(form.querySelectorAll('input[name="resourceIds"]:checked')).map((input) => input.value);
  const assignedUserIds = Array.from(form.querySelectorAll('input[name="assignedUserIds"]:checked')).map((input) => input.value);

  let valid = true;
  let firstInvalid = null;

  if (!name) {
    setModalFieldError(form, 'name', 'El nombre de la lista es obligatorio.');
    valid = false;
    firstInvalid = firstInvalid || form.elements.name;
  } else if (name.length < 3) {
    setModalFieldError(form, 'name', 'Usa al menos 3 caracteres.');
    valid = false;
    firstInvalid = firstInvalid || form.elements.name;
  }

  if (!resourceIds.length) {
    setModalFieldError(form, 'resourceIds', 'Selecciona al menos un recurso para la lista.');
    valid = false;
    firstInvalid = firstInvalid || form.querySelector('input[name="resourceIds"]');
  }

  // Solo se conservan asignaciones a cuentas que siguen existiendo con rol Usuario.
  const validUserIds = assignedUserIds.filter((id) => state.users.some((user) => user.id === id && user.role === 'user'));

  if (!valid) {
    firstInvalid?.focus();
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  setBusy(submitButton, true, 'Guardando…');

  let saved = false;
  if (existing) {
    saved = commit(() => {
      existing.name = name;
      existing.description = description;
      existing.resourceIds = resourceIds;
      existing.assignedUserIds = validUserIds;
      existing.updatedAt = new Date().toISOString();
    });
  } else {
    const list = {
      id: uid('list'),
      name,
      description,
      resourceIds,
      assignedUserIds: validUserIds,
      createdAt: new Date().toISOString(),
      createdBy: currentUser().id
    };
    saved = commit(() => {
      state.lists.push(list);
    });
  }

  setBusy(submitButton, false);

  if (!saved) {
    showModalAlert(form, 'No se pudo guardar la lista. Inténtalo de nuevo.');
    return;
  }

  closeModal();
  ui.resourceTab = 'lists';
  showToast(existing ? 'Lista actualizada y asignaciones guardadas.' : 'Lista creada correctamente.', 'success');
  renderResourcesPage();
}

/* ============================== Formulario: usuario ============================== */
function openUserForm() {
  if (!isAdmin()) {
    showToast('No tienes permisos para crear usuarios.', 'error');
    return;
  }

  openModal({
    title: 'Nuevo usuario',
    subtitle: 'Crea una cuenta y define su nivel de acceso.',
    size: 'md',
    headerIcon: 'users',
    initialFocus: '#user-name',
    body: `
      <form data-form="user" novalidate>
        <div class="form-grid">
          <div class="field">
            <label for="user-name">Nombre completo</label>
            <input id="user-name" name="username" type="text" maxlength="80" placeholder="Ej. Ana Martínez" aria-describedby="user-name-error">
            <p class="field-error" data-error-for="username" hidden></p>
          </div>

          <div class="field">
            <label for="user-email">Correo electrónico</label>
            <input id="user-email" name="email" type="email" inputmode="email" autocomplete="off" placeholder="persona@correo.com" aria-describedby="user-email-error">
            <p class="field-error" data-error-for="email" hidden></p>
          </div>

          <div class="field">
            <label for="user-password">Contraseña</label>
            <input id="user-password" name="password" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres" aria-describedby="user-password-error">
            <p class="field-hint">La persona podrá iniciar sesión con este correo y contraseña.</p>
            <p class="field-error" data-error-for="password" hidden></p>
          </div>

          <div class="field">
            <span class="field-label" id="user-role-label">Rol de la cuenta</span>
            <div class="role-options" role="radiogroup" aria-labelledby="user-role-label">
              <label class="role-option">
                <input type="radio" name="role" value="user" checked>
                <span><strong>Usuario</strong><small>Consulta sus listas asignadas.</small></span>
              </label>
              <label class="role-option">
                <input type="radio" name="role" value="psychologist">
                <span><strong>Psicólogo</strong><small>Gestiona recursos y listas.</small></span>
              </label>
              <label class="role-option">
                <input type="radio" name="role" value="admin">
                <span><strong>Administrador</strong><small>Acceso completo al sistema.</small></span>
              </label>
            </div>
          </div>
        </div>

        <p class="form-alert form-error" data-form-alert hidden></p>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" data-action="close-modal">Cancelar</button>
          <button type="submit" class="btn btn-primary">${icon('plus')} Crear usuario</button>
        </div>
      </form>
    `
  });
}

async function handleUserSubmit(form) {
  if (!isAdmin()) {
    showToast('No tienes permisos para crear usuarios.', 'error');
    return;
  }

  clearModalErrors(form);
  const username = form.elements.username.value.trim();
  const email = form.elements.email.value.trim().toLowerCase();
  const password = form.elements.password.value;
  const role = form.querySelector('input[name="role"]:checked')?.value || 'user';
  let valid = true;
  let firstInvalid = null;

  if (!username) {
    setModalFieldError(form, 'username', 'El nombre es obligatorio.');
    valid = false;
    firstInvalid = firstInvalid || form.elements.username;
  } else if (username.length < 2) {
    setModalFieldError(form, 'username', 'Usa al menos 2 caracteres.');
    valid = false;
    firstInvalid = firstInvalid || form.elements.username;
  }

  if (!email) {
    setModalFieldError(form, 'email', 'El correo electrónico es obligatorio.');
    valid = false;
    firstInvalid = firstInvalid || form.elements.email;
  } else if (!EMAIL_RE.test(email)) {
    setModalFieldError(form, 'email', 'Ingresa un correo electrónico válido.');
    valid = false;
    firstInvalid = firstInvalid || form.elements.email;
  } else if (state.users.some((user) => user.email.toLowerCase() === email)) {
    setModalFieldError(form, 'email', 'Ya existe una cuenta con este correo.');
    valid = false;
    firstInvalid = firstInvalid || form.elements.email;
  }

  if (!password) {
    setModalFieldError(form, 'password', 'La contraseña es obligatoria.');
    valid = false;
    firstInvalid = firstInvalid || form.elements.password;
  } else if (password.length < 6) {
    setModalFieldError(form, 'password', 'La contraseña debe tener al menos 6 caracteres.');
    valid = false;
    firstInvalid = firstInvalid || form.elements.password;
  }

  if (!ROLE_META[role]) {
    showModalAlert(form, 'Selecciona un rol válido.');
    valid = false;
  }

  if (!valid) {
    firstInvalid?.focus();
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  setBusy(submitButton, true, 'Creando…');

  const passwordHash = await hashPassword(password);
  const newUser = {
    id: uid('usr'),
    username,
    email,
    passwordHash,
    role,
    createdAt: new Date().toISOString()
  };

  const saved = commit(() => {
    state.users.push(newUser);
  });

  setBusy(submitButton, false);

  if (!saved) {
    showModalAlert(form, 'No se pudo crear el usuario. Inténtalo de nuevo.');
    return;
  }

  closeModal();
  showToast(`Usuario ${username} creado como ${roleLabel(role).toLowerCase()}.`, 'success');
  renderUsersPage();
}

/* ============================== Vistas de detalle ============================== */
function openResourceView(resourceId) {
  if (!canManageResources()) {
    showToast('No tienes permisos para ver esta información.', 'error');
    return;
  }

  const resource = findResource(resourceId);
  if (!resource) {
    showToast('El recurso ya no existe.', 'error');
    return;
  }

  const meta = getFileMeta(resource.file);
  const creator = findUser(resource.createdBy);
  const downloadable = isDownloadable(resource);

  openModal({
    title: resource.name,
    subtitle: 'Detalle del recurso',
    size: 'md',
    headerIcon: 'book',
    body: `
      <div class="detail-meta">
        ${levelBadge(resource.level)}
        <span class="meta-chip">${icon('file')} ${escapeHTML(meta.label)}</span>
        <span class="meta-chip">${icon('calendar')} ${formatDate(resource.createdAt)}</span>
        <span class="meta-chip">${icon('user')} ${escapeHTML(creator?.username || 'Usuario eliminado')}</span>
      </div>
      <div class="detail-description">${escapeHTML(resource.description)}</div>
      ${resource.file ? `
        <div class="detail-file">
          <span class="file-tile file-tile--${meta.tone}" aria-hidden="true">${escapeHTML(meta.abbr)}</span>
          <div class="detail-file-copy">
            <p class="detail-file-name">${escapeHTML(resource.file.name)}</p>
            <p class="detail-file-meta">${escapeHTML(meta.label)} · ${formatBytes(resource.file.size)}</p>
          </div>
          <div class="detail-file-actions">
            <button type="button" class="btn btn-secondary btn-sm" data-action="open-resource" data-id="${escapeHTML(resource.id)}" ${downloadable ? '' : 'disabled'}>${icon('eye')} Abrir</button>
            <button type="button" class="btn btn-primary btn-sm" data-action="download-resource" data-id="${escapeHTML(resource.id)}" ${downloadable ? '' : 'disabled'}>${icon('download')} Descargar</button>
          </div>
        </div>
      ` : `
        <div class="detail-file">
          <span class="file-tile file-tile--none" aria-hidden="true">${icon('file')}</span>
          <div class="detail-file-copy">
            <p class="detail-file-name">Sin archivo adjunto</p>
            <p class="detail-file-meta">Este recurso solo contiene información descriptiva.</p>
          </div>
        </div>
      `}
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" data-action="close-modal">Cerrar</button>
        <button type="button" class="btn btn-primary" data-action="edit-resource" data-id="${escapeHTML(resource.id)}">${icon('pencil')} Editar recurso</button>
      </div>
    `
  });
}

function openListView(listId) {
  const list = findList(listId);
  const user = currentUser();
  if (!list) {
    showToast('La lista ya no existe.', 'error');
    return;
  }
  if (!canAccessList(list, user)) {
    showToast('No tienes acceso a esta lista.', 'error');
    return;
  }

  const canManage = canManageResources();
  const resources = list.resourceIds.map(findResource).filter(Boolean);
  const assignedUsers = list.assignedUserIds.map(findUser).filter(Boolean);
  const resourceItems = resources.length
    ? resources.map(resourceMini).join('')
    : '<p class="detail-empty">Esta lista todavía no tiene recursos.</p>';

  openModal({
    title: list.name,
    subtitle: canManage ? 'Lista de recursos y asignaciones' : 'Lista de recursos compartida contigo',
    size: 'lg',
    headerIcon: 'layers',
    body: `
      <div class="detail-meta">
        <span class="meta-chip">${icon('layers')} ${plural(resources.length, 'recurso', 'recursos')}</span>
        <span class="meta-chip">${icon('calendar')} ${formatDate(list.createdAt)}</span>
        ${canManage ? `<span class="meta-chip">${icon('users')} ${plural(assignedUsers.length, 'persona asignada', 'personas asignadas')}</span>` : ''}
      </div>
      ${list.description ? `<div class="detail-description">${escapeHTML(list.description)}</div>` : ''}
      <div class="detail-section">
        <div class="detail-section-head">
          <h3>Recursos incluidos</h3>
          <span>${resources.length}</span>
        </div>
        <div class="resource-mini-list">${resourceItems}</div>
      </div>
      ${canManage ? `
        <div class="detail-section">
          <div class="detail-section-head">
            <h3>Asignada a</h3>
            <span>${assignedUsers.length}</span>
          </div>
          ${assignedUsers.length
            ? `<div class="assigned-chips">${assignedUsers.map(userChip).join('')}</div>`
            : '<p class="detail-empty">Esta lista aún no está asignada a ningún usuario.</p>'}
        </div>
      ` : ''}
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" data-action="close-modal">Cerrar</button>
        ${canManage ? `<button type="button" class="btn btn-primary" data-action="edit-list" data-id="${escapeHTML(list.id)}">${icon('pencil')} Editar y asignar</button>` : ''}
      </div>
    `
  });
}

function resourceMini(resource) {
  const meta = getFileMeta(resource.file);
  const downloadable = isDownloadable(resource);
  return `
    <div class="resource-mini">
      <span class="file-tile file-tile--${meta.tone}" aria-hidden="true">${meta.tone === 'none' ? icon('file') : escapeHTML(meta.abbr)}</span>
      <div class="resource-mini-copy">
        <p class="resource-mini-title">${escapeHTML(resource.name)}</p>
        <div class="resource-mini-sub">
          ${levelBadge(resource.level)}
          <span>${resource.file ? escapeHTML(resource.file.name) : 'Sin archivo'}</span>
        </div>
      </div>
      <div class="resource-mini-actions">
        <button type="button" class="row-action" data-action="open-resource" data-id="${escapeHTML(resource.id)}" title="${downloadable ? 'Abrir archivo' : 'Sin archivo adjunto'}" aria-label="Abrir ${escapeHTML(resource.name)}" ${downloadable ? '' : 'disabled'}>${icon('eye')}</button>
        <button type="button" class="row-action row-action--download" data-action="download-resource" data-id="${escapeHTML(resource.id)}" title="${downloadable ? 'Descargar archivo' : 'Sin archivo adjunto'}" aria-label="Descargar ${escapeHTML(resource.name)}" ${downloadable ? '' : 'disabled'}>${icon('download')}</button>
      </div>
    </div>
  `;
}

/* ============================== Archivos ============================== */
function fileToBlob(file) {
  // Compatibilidad con estados antiguos que guardaban el archivo como data URL.
  if (!file?.dataUrl) return null;
  try {
    const [header, data] = file.dataUrl.split(',');
    const mime = header.match(/^data:([^;]+)/)?.[1] || file.type || 'application/octet-stream';
    if (header.includes(';base64')) {
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    }
    return new Blob([decodeURIComponent(data)], { type: mime });
  } catch (error) {
    console.warn('No se pudo convertir el archivo:', error);
    return null;
  }
}

function resolveFileUrl(file) {
  if (file?.url) return { url: file.url, revoke: false };
  const blob = fileToBlob(file);
  if (!blob) return null;
  return { url: URL.createObjectURL(blob), revoke: true };
}

function openResourceFile(resourceId) {
  const resource = findResource(resourceId);
  if (!resource || !canAccessResource(resourceId)) {
    showToast('No tienes acceso a este archivo.', 'error');
    return;
  }
  if (!isDownloadable(resource)) {
    showToast('Este recurso no tiene un archivo descargable.', 'info');
    return;
  }
  const resolved = resolveFileUrl(resource.file);
  if (!resolved) {
    showToast('No se pudo abrir el archivo.', 'error');
    return;
  }
  const link = document.createElement('a');
  link.href = resolved.url;
  link.target = '_blank';
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  if (resolved.revoke) {
    window.setTimeout(() => URL.revokeObjectURL(resolved.url), 60000);
  }
}

function downloadResource(resourceId) {
  const resource = findResource(resourceId);
  if (!resource || !canAccessResource(resourceId)) {
    showToast('No tienes acceso a este archivo.', 'error');
    return;
  }
  if (!isDownloadable(resource)) {
    showToast('Este recurso no tiene un archivo descargable.', 'info');
    return;
  }
  const resolved = resolveFileUrl(resource.file);
  if (!resolved) {
    showToast('No se pudo descargar el archivo.', 'error');
    return;
  }
  const link = document.createElement('a');
  link.href = resolved.url;
  link.download = resource.file.name || 'recurso';
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  if (resolved.revoke) {
    window.setTimeout(() => URL.revokeObjectURL(resolved.url), 60000);
  }
  showToast(`Descarga iniciada: ${resource.file.name}`, 'success');
}

/* ============================== Eliminaciones ============================== */
async function requestDeleteResource(resourceId) {
  if (!canManageResources()) {
    showToast('No tienes permisos para eliminar recursos.', 'error');
    return;
  }
  const resource = findResource(resourceId);
  if (!resource) return;

  const affected = state.lists.filter((list) => list.resourceIds.includes(resourceId));
  const hint = affected.length
    ? `También se quitará de ${plural(affected.length, 'lista', 'listas')}: ${affected.map((list) => list.name).join(', ')}.`
    : '';

  const confirmed = await confirmAction({
    title: 'Eliminar recurso',
    message: `¿Seguro que deseas eliminar “${resource.name}”? Esta acción no se puede deshacer.`,
    hint,
    confirmLabel: 'Sí, eliminar'
  });

  if (!confirmed) return;

  const file = resource.file;
  const saved = commit(() => {
    state.resources = state.resources.filter((item) => item.id !== resourceId);
    state.lists.forEach((list) => {
      list.resourceIds = list.resourceIds.filter((id) => id !== resourceId);
    });
  });

  if (saved) {
    deleteUploadedFile(file);
    showToast('Recurso eliminado correctamente.', 'success');
    renderResourcesPage();
  }
}

async function requestDeleteList(listId) {
  if (!canManageResources()) {
    showToast('No tienes permisos para eliminar listas.', 'error');
    return;
  }
  const list = findList(listId);
  if (!list) return;

  const confirmed = await confirmAction({
    title: 'Eliminar lista',
    message: `¿Seguro que deseas eliminar la lista “${list.name}”? Los recursos seguirán disponibles en la biblioteca.`,
    confirmLabel: 'Sí, eliminar'
  });

  if (!confirmed) return;

  const saved = commit(() => {
    state.lists = state.lists.filter((item) => item.id !== listId);
  });

  if (saved) {
    showToast('Lista eliminada correctamente.', 'success');
    renderResourcesPage();
  }
}

async function requestDeleteUser(userId) {
  if (!isAdmin()) {
    showToast('No tienes permisos para eliminar usuarios.', 'error');
    return;
  }

  const user = findUser(userId);
  const me = currentUser();
  if (!user) return;

  if (user.id === me.id) {
    showToast('No puedes eliminar tu propia cuenta.', 'error');
    return;
  }

  const adminCount = state.users.filter((item) => item.role === 'admin').length;
  if (user.role === 'admin' && adminCount <= 1) {
    showToast('Debe existir al menos un administrador en la aplicación.', 'error');
    return;
  }

  const assignments = state.lists.filter((list) => list.assignedUserIds.includes(user.id)).length;
  const hint = assignments
    ? `La persona se quitará de ${plural(assignments, 'lista asignada', 'listas asignadas')}.`
    : '';

  const confirmed = await confirmAction({
    title: 'Eliminar usuario',
    message: `¿Seguro que deseas eliminar la cuenta de ${user.username} (${user.email})? Esta acción no se puede deshacer.`,
    hint,
    confirmLabel: 'Sí, eliminar'
  });

  if (!confirmed) return;

  const saved = commit(() => {
    state.users = state.users.filter((item) => item.id !== userId);
    state.lists.forEach((list) => {
      list.assignedUserIds = list.assignedUserIds.filter((id) => id !== userId);
    });
  });

  if (saved) {
    showToast('Usuario eliminado correctamente.', 'success');
    renderUsersPage();
  }
}

async function changeUserRole(select) {
  if (!isAdmin()) {
    showToast('No tienes permisos para cambiar roles.', 'error');
    go(defaultRoute(currentUser()?.role));
    return;
  }

  const user = findUser(select.dataset.userId);
  if (!user) return;

  const newRole = select.value;
  const me = currentUser();

  if (user.id === me.id) {
    select.value = user.role;
    showToast('No puedes cambiar tu propio rol.', 'error');
    return;
  }

  if (!ROLE_META[newRole]) {
    select.value = user.role;
    return;
  }

  const adminCount = state.users.filter((item) => item.role === 'admin').length;
  if (user.role === 'admin' && newRole !== 'admin' && adminCount <= 1) {
    select.value = user.role;
    showToast('Debe existir al menos un administrador en la aplicación.', 'error');
    return;
  }

  if (user.role === newRole) return;

  const previousRole = user.role;
  const removesAssignments = newRole !== 'user';

  const saved = commit(() => {
    user.role = newRole;
    if (removesAssignments) {
      state.lists.forEach((list) => {
        list.assignedUserIds = list.assignedUserIds.filter((id) => id !== user.id);
      });
    }
  });

  if (!saved) {
    select.value = previousRole;
    return;
  }

  showToast(
    removesAssignments
      ? `Rol actualizado a ${roleLabel(newRole).toLowerCase()}. Se quitaron sus listas asignadas.`
      : `Rol actualizado a ${roleLabel(newRole).toLowerCase()}.`,
    'success'
  );
  renderUsersPage();
}

/* ============================== Autenticación ============================== */
function getFieldError(fieldId) {
  return document.getElementById(`${fieldId}-error`);
}

function setAuthFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const error = getFieldError(fieldId);
  if (!input) return;
  if (message) {
    input.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
  } else {
    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    if (error) {
      error.textContent = '';
      error.hidden = true;
    }
  }
}

function clearAuthErrors(form) {
  form.querySelectorAll('.field-error').forEach((error) => {
    error.textContent = '';
    error.hidden = true;
  });
  form.querySelectorAll('input').forEach((input) => {
    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
  });
  const alert = form.querySelector('.form-alert');
  if (alert) {
    alert.textContent = '';
    alert.hidden = true;
  }
}

function focusFirstInvalid(form) {
  form.querySelector('.is-invalid')?.focus();
}

function showAuthAlert(form, message) {
  const alert = form.querySelector('.form-alert');
  if (!alert) return;
  alert.textContent = message;
  alert.hidden = false;
}

function setBusy(button, busy, label = 'Guardando…') {
  if (!button) return;
  if (busy) {
    if (!button.dataset.originalHtml) button.dataset.originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner" aria-hidden="true"></span>${escapeHTML(label)}`;
  } else {
    button.disabled = false;
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
      delete button.dataset.originalHtml;
    }
  }
}

async function handleLogin(form) {
  clearAuthErrors(form);
  const email = form.elements.email.value.trim().toLowerCase();
  const password = form.elements.password.value;
  let valid = true;

  if (!email) {
    setAuthFieldError('login-email', 'Ingresa tu correo electrónico.');
    valid = false;
  } else if (!EMAIL_RE.test(email)) {
    setAuthFieldError('login-email', 'Ingresa un correo electrónico válido.');
    valid = false;
  }

  if (!password) {
    setAuthFieldError('login-password', 'Ingresa tu contraseña.');
    valid = false;
  }

  if (!valid) {
    focusFirstInvalid(form);
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  setBusy(submitButton, true, 'Ingresando…');

  try {
    const user = state.users.find((item) => item.email.toLowerCase() === email);
    const passwordOk = user ? await verifyPassword(password, user.passwordHash) : false;

    if (!user || !passwordOk) {
      showAuthAlert(form, 'Correo o contraseña incorrectos. Revisa tus datos e inténtalo de nuevo.');
      form.elements.password.focus();
      form.elements.password.select();
      return;
    }

    saveSession(user.id);
    form.elements.password.value = '';
    showToast(`Bienvenido/a, ${user.username.split(/\s+/)[0]}.`, 'success');
    go(defaultRoute(user.role));
  } finally {
    setBusy(submitButton, false);
  }
}

async function handleRegister(form) {
  clearAuthErrors(form);
  const username = form.elements.username.value.trim();
  const email = form.elements.email.value.trim().toLowerCase();
  const password = form.elements.password.value;
  const confirmPassword = form.elements.confirmPassword.value;
  let valid = true;

  if (!username) {
    setAuthFieldError('register-username', 'Ingresa tu nombre completo.');
    valid = false;
  } else if (username.length < 2) {
    setAuthFieldError('register-username', 'El nombre debe tener al menos 2 caracteres.');
    valid = false;
  }

  if (!email) {
    setAuthFieldError('register-email', 'Ingresa tu correo electrónico.');
    valid = false;
  } else if (!EMAIL_RE.test(email)) {
    setAuthFieldError('register-email', 'Ingresa un correo electrónico válido.');
    valid = false;
  } else if (state.users.some((user) => user.email.toLowerCase() === email)) {
    setAuthFieldError('register-email', 'Ya existe una cuenta registrada con este correo.');
    valid = false;
  }

  if (!password) {
    setAuthFieldError('register-password', 'Crea una contraseña.');
    valid = false;
  } else if (password.length < 6) {
    setAuthFieldError('register-password', 'La contraseña debe tener al menos 6 caracteres.');
    valid = false;
  }

  if (!confirmPassword) {
    setAuthFieldError('register-confirm', 'Repite tu contraseña.');
    valid = false;
  } else if (password !== confirmPassword) {
    setAuthFieldError('register-confirm', 'Las contraseñas no coinciden.');
    valid = false;
  }

  if (!valid) {
    focusFirstInvalid(form);
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  setBusy(submitButton, true, 'Creando cuenta…');

  try {
    const passwordHash = await hashPassword(password);
    const newUser = {
      id: uid('usr'),
      username,
      email,
      passwordHash,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    const saved = commit(() => {
      state.users.push(newUser);
    });

    if (!saved) {
      showAuthAlert(form, 'No se pudo crear la cuenta. Inténtalo de nuevo.');
      return;
    }

    saveSession(newUser.id);
    form.reset();
    showToast('Cuenta creada. Te damos la bienvenida a Banco de recursos.', 'success');
    go('mi-panel');
  } finally {
    setBusy(submitButton, false);
  }
}

/* ============================== Utilidades de formularios ============================== */
function clearModalErrors(form) {
  form.querySelectorAll('.field-error').forEach((error) => {
    error.textContent = '';
    error.hidden = true;
  });
  form.querySelectorAll('.is-invalid').forEach((input) => {
    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
  });
  const alert = form.querySelector('[data-form-alert]');
  if (alert) {
    alert.textContent = '';
    alert.hidden = true;
  }
}

function setModalFieldError(form, name, message) {
  const input = form.querySelector(`[name="${name}"]`);
  const error = form.querySelector(`[data-error-for="${name}"]`);
  if (input instanceof HTMLElement) {
    if (message) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
    }
  }
  if (error) {
    error.textContent = message;
    error.hidden = !message;
  }
}

function showModalAlert(form, message) {
  const alert = form.querySelector('[data-form-alert]');
  if (!alert) return;
  alert.textContent = message;
  alert.hidden = false;
}

/* ============================== Toasts ============================== */
function showToast(message, type = 'success') {
  const iconName = type === 'error' ? 'alert' : type === 'info' ? 'info' : 'check-circle';
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icon(iconName)}</span>
    <p>${escapeHTML(message)}</p>
    <button type="button" class="toast-close" aria-label="Cerrar notificación">${icon('x')}</button>
  `;
  dom.toastRegion.appendChild(toast);

  window.requestAnimationFrame(() => toast.classList.add('is-visible'));

  const remove = () => {
    toast.classList.remove('is-visible');
    window.setTimeout(() => toast.remove(), 220);
  };

  toast.querySelector('.toast-close')?.addEventListener('click', remove);
  window.setTimeout(remove, 4800);
}

/* ============================== Eventos ============================== */
function bindEvents() {
  document.addEventListener('click', (event) => {
    handleGlobalClick(event).catch((error) => {
      console.error(error);
      showToast('Ocurrió un error inesperado. Inténtalo de nuevo.', 'error');
    });
  });

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    if (form.id === 'login-form') {
      event.preventDefault();
      if (form.dataset.submitting === '1') return;
      form.dataset.submitting = '1';
      handleLogin(form)
        .catch((error) => {
          console.error(error);
          showAuthAlert(form, 'No se pudo iniciar sesión. Inténtalo de nuevo.');
        })
        .finally(() => { delete form.dataset.submitting; });
      return;
    }

    if (form.id === 'register-form') {
      event.preventDefault();
      if (form.dataset.submitting === '1') return;
      form.dataset.submitting = '1';
      handleRegister(form)
        .catch((error) => {
          console.error(error);
          showAuthAlert(form, 'No se pudo crear la cuenta. Inténtalo de nuevo.');
        })
        .finally(() => { delete form.dataset.submitting; });
      return;
    }

    if (form.dataset.form === 'resource') {
      event.preventDefault();
      if (form.dataset.submitting === '1') return;
      form.dataset.submitting = '1';
      handleResourceSubmit(form)
        .catch((error) => {
          console.error(error);
          showModalAlert(form, 'Ocurrió un error al guardar el recurso.');
        })
        .finally(() => { delete form.dataset.submitting; });
      return;
    }

    if (form.dataset.form === 'list') {
      event.preventDefault();
      handleListSubmit(form);
      return;
    }

    if (form.dataset.form === 'user') {
      event.preventDefault();
      if (form.dataset.submitting === '1') return;
      form.dataset.submitting = '1';
      handleUserSubmit(form)
        .catch((error) => {
          console.error(error);
          showModalAlert(form, 'Ocurrió un error al crear el usuario.');
        })
        .finally(() => { delete form.dataset.submitting; });
    }
  });

  document.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    if (target.id === 'library-search') {
      if (ui.resourceTab === 'lists') {
        ui.listSearch = target.value;
      } else {
        ui.resourceSearch = target.value;
      }
      renderLibraryRegion();
      return;
    }

    if (target.id === 'users-search') {
      ui.userSearch = target.value;
      renderUsersRegion();
      return;
    }

    if (target.id === 'dashboard-search') {
      ui.dashboardSearch = target.value;
      renderUserResources();
      return;
    }

    if (target.id && ['login-email', 'login-password', 'register-username', 'register-email', 'register-password', 'register-confirm'].includes(target.id)) {
      setAuthFieldError(target.id, '');
      const form = target.closest('form');
      const alert = form?.querySelector('.form-alert');
      if (alert) {
        alert.textContent = '';
        alert.hidden = true;
      }
    }

    const form = target.closest('form');
    if (form?.closest('#app-modal') && target.name) {
      setModalFieldError(form, target.name, '');
    }
  });

  document.addEventListener('change', (event) => {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      if (target.id === 'resource-level-filter') {
        ui.resourceLevel = target.value;
        renderLibraryRegion();
        return;
      }

      if (target.id === 'users-role-filter') {
        ui.userRole = target.value;
        renderUsersRegion();
        return;
      }

      if (target.matches('[data-role-select]')) {
        changeUserRole(target);
        return;
      }
    }

    if (target instanceof HTMLInputElement) {
      if (target.matches('[data-file-input]')) {
        const form = target.closest('form');
        const info = form?.querySelector('[data-file-info]');
        const file = target.files?.[0];
        if (info) {
          if (file) {
            info.textContent = `${file.name} · ${formatBytes(file.size)}`;
            info.hidden = false;
          } else {
            info.textContent = '';
            info.hidden = true;
          }
        }
        if (form) setModalFieldError(form, 'file', '');
        return;
      }

      if (target.type === 'checkbox') {
        const form = target.closest('form');
        if (form?.closest('#app-modal') && target.name) {
          setModalFieldError(form, target.name, '');
        }
      }
    }

    if (target instanceof HTMLInputElement && target.type === 'radio') {
      const form = target.closest('form');
      if (form) {
        form.querySelectorAll('.role-option').forEach((option) => {
          option.classList.toggle('is-selected', option.querySelector('input')?.checked);
        });
      }
    }
  });

  window.addEventListener('hashchange', renderRoute);

  dom.modal.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
  });

  dom.modal.addEventListener('click', (event) => {
    if (event.target === dom.modal) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && dom.appView.classList.contains('sidebar-open') && !dom.modal.open) {
      closeSidebar(true);
    }
  });
}

async function handleGlobalClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const demo = target.closest('[data-demo-email]');
  if (demo) {
    if (!dom.registerPanel.hidden) {
      go('login');
      return;
    }
    if (!dom.loginForm.elements.email || !dom.loginForm.elements.password) return;
    clearAuthErrors(dom.loginForm);
    dom.loginForm.elements.email.value = demo.dataset.demoEmail || '';
    dom.loginForm.elements.password.value = demo.dataset.demoPassword || '';
    dom.loginForm.requestSubmit();
    return;
  }

  const passwordToggle = target.closest('[data-toggle-password]');
  if (passwordToggle) {
    const input = document.getElementById(passwordToggle.dataset.togglePassword);
    if (!(input instanceof HTMLInputElement)) return;
    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    passwordToggle.textContent = showing ? 'Ver' : 'Ocultar';
    passwordToggle.setAttribute('aria-label', showing ? 'Mostrar contraseña' : 'Ocultar contraseña');
    passwordToggle.setAttribute('aria-pressed', String(!showing));
    input.focus();
    return;
  }

  const authSwitch = target.closest('[data-auth-target]');
  if (authSwitch) {
    go(authSwitch.dataset.authTarget === 'register' ? 'registro' : 'login');
    return;
  }

  const actionElement = target.closest('[data-action]');
  if (!actionElement) return;
  await handleAction(actionElement);
}

async function handleAction(element) {
  const action = element.dataset.action;
  const id = element.dataset.id;

  switch (action) {
    case 'logout':
      logout();
      break;

    case 'open-sidebar':
      dom.appView.classList.add('sidebar-open');
      document.body.classList.add('sidebar-open');
      window.setTimeout(() => dom.sidebar.querySelector('[data-action="close-sidebar"]')?.focus(), 20);
      break;

    case 'close-sidebar':
      closeSidebar(true);
      break;

    case 'navigate': {
      const section = element.dataset.section;
      if (!section) return;
      closeSidebar(false);
      if (ui.section === section) {
        renderApp(section);
      } else {
        go(section);
      }
      break;
    }

    case 'switch-resource-tab':
      ui.resourceTab = element.dataset.tab === 'lists' ? 'lists' : 'resources';
      renderResourcesPage();
      break;

    case 'new-resource':
      openResourceForm();
      break;

    case 'edit-resource':
      openResourceForm(id);
      break;

    case 'view-resource':
      openResourceView(id);
      break;

    case 'delete-resource':
      await requestDeleteResource(id);
      break;

    case 'download-resource':
      downloadResource(id);
      break;

    case 'open-resource':
      openResourceFile(id);
      break;

    case 'new-list':
      openListForm();
      break;

    case 'edit-list':
      openListForm(id);
      break;

    case 'view-list':
      openListView(id);
      break;

    case 'delete-list':
      await requestDeleteList(id);
      break;

    case 'new-user':
      openUserForm();
      break;

    case 'delete-user':
      await requestDeleteUser(id);
      break;

    case 'close-modal':
      closeModal();
      break;

    case 'clear-resource-filters':
      ui.resourceSearch = '';
      ui.listSearch = '';
      ui.resourceLevel = 'all';
      renderResourcesPage();
      break;

    case 'clear-user-filters':
      ui.userSearch = '';
      ui.userRole = 'all';
      renderUsersPage();
      break;

    case 'clear-dashboard-search':
      ui.dashboardSearch = '';
      renderUserDashboard();
      break;

    default:
      break;
  }
}

/* ============================== Arranque ============================== */
init().catch((error) => {
  console.error('Error al iniciar Banco de recursos:', error);
  showToast('No se pudo iniciar la aplicación. Recarga la página.', 'error');
});
