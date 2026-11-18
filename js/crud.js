// js/crud.js - MODUL 11: CRUD Full-Stack (UI -> API -> DB)
const ENDPOINT = './api/alats.php';
const $ = s => document.querySelector(s);

const el = {
  form: $('#crud-form'), id: $('#crud-id'), nama: $('#crud-nama'),
  kategori: $('#crud-kategori'), jumlah: $('#crud-jumlah'), kondisi: $('#crud-kondisi'),
  submit: $('#crud-submit'), cancel: $('#crud-cancel'), status: $('#crud-status'),
  tbody: $('#crud-tbody'), empty: $('#crud-empty'), loading: $('#crud-loading'),
  search: $('#crud-search'), filter: $('#crud-filter'),
  prev: $('#crud-prev'), next: $('#crud-next'), pageInfo: $('#crud-pageinfo')
};

const state = { page: 1, totalPage: 1, q: '', kategori: '' };
let currentUser = null;
const cache = new Map();

// Helper request: satu fungsi untuk semua method
async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(options.method && options.method !== 'GET' ? { 'X-CSRF-Token': currentUser?.csrf_token ?? '' } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {})
    }
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const err = new Error(payload?.error?.message ?? `HTTP ${response.status}`);
    err.status = response.status;
    err.fields = payload?.error?.fields ?? {};
    throw err;
  }
  return payload;
}

function setStatus(message, type = '') {
  el.status.textContent = message;
  el.status.className = type;
}

function clearErrors() {
  document.querySelectorAll('#crud-form .error').forEach(e => (e.textContent = ''));
  el.form.querySelectorAll('[aria-invalid]').forEach(e => e.removeAttribute('aria-invalid'));
}

function showFieldErrors(fields) {
  let first = null;
  for (const [name, message] of Object.entries(fields)) {
    const msg = document.querySelector(`#crud-error-${name}`);
    const input = document.querySelector(`#crud-${name}`);
    if (msg) msg.textContent = message;
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      first ??= input;
    }
  }
  first?.focus();
}

// READ: GET collection (search + filter + pagination)
async function loadAlat() {
  el.loading.hidden = false;
  try {
    const params = new URLSearchParams({ page: state.page, limit: 5 });
    if (state.q) params.set('q', state.q);
    if (state.kategori) params.set('kategori', state.kategori);

    const res = await apiRequest(`${ENDPOINT}?${params}`);
    state.totalPage = Math.max(res.total_page, 1);
    if (state.page > state.totalPage) {   // mis. halaman terakhir habis setelah delete
      state.page = state.totalPage;
      return loadAlat();
    }
    renderTable(res.data);
    el.pageInfo.textContent = `Halaman ${state.page} dari ${state.totalPage} (${res.total} data)`;
    el.prev.disabled = state.page <= 1;
    el.next.disabled = state.page >= state.totalPage;
  } catch (err) {
    console.error(err);
    el.tbody.replaceChildren();
    if (err.status === 401) {
      document.dispatchEvent(new CustomEvent('auth:expired'));
      return;
    }
    setStatus('Data belum dapat dimuat. Coba lagi.', 'fail');
  } finally {
    el.loading.hidden = true;
  }
}

function renderTable(items) {
  el.tbody.replaceChildren();
  cache.clear();
  el.empty.hidden = items.length > 0;

  items.forEach(item => {
    cache.set(String(item.id), item);
    const tr = document.createElement('tr');
    [item.id, item.nama, item.kategori, item.jumlah, item.kondisi].forEach(v => {
      const td = document.createElement('td');
      td.textContent = v;
      tr.append(td);
    });

    const aksi = document.createElement('td');
    const btnEdit = document.createElement('button');
    btnEdit.type = 'button';
    btnEdit.className = 'btn-detail';
    btnEdit.textContent = 'Edit';
    btnEdit.dataset.action = 'edit';
    btnEdit.dataset.id = item.id;

    const btnHapus = document.createElement('button');
    btnHapus.type = 'button';
    btnHapus.className = 'btn-detail btn-danger';
    btnHapus.textContent = 'Hapus';
    btnHapus.dataset.action = 'delete';
    btnHapus.dataset.id = item.id;

    // UI hanya untuk UX; keputusan akses sebenarnya tetap di server
    if (['admin', 'petugas'].includes(currentUser?.role)) aksi.append(btnEdit);
    if (currentUser?.role === 'admin') aksi.append(btnHapus);
    tr.append(aksi);
    el.tbody.append(tr);
  });
}

function resetForm() {
  el.form.reset();
  el.id.value = '';
  el.submit.textContent = 'Simpan';
  el.cancel.hidden = true;
  clearErrors();
}

// CREATE (POST) dan UPDATE (PUT)
el.form.addEventListener('submit', async e => {
  e.preventDefault();
  clearErrors();

  const body = {
    nama: el.nama.value.trim(),
    kategori: el.kategori.value,
    jumlah: el.jumlah.value === '' ? null : Number(el.jumlah.value),
    kondisi: el.kondisi.value
  };
  const id = el.id.value;

  el.submit.disabled = true;
  setStatus('Menyimpan...');
  try {
    if (id) {
      await apiRequest(`${ENDPOINT}?id=${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) });
      setStatus('Data alat berhasil diperbarui.', 'ok');
    } else {
      await apiRequest(ENDPOINT, { method: 'POST', body: JSON.stringify(body) });
      setStatus('Data alat berhasil ditambahkan.', 'ok');
      state.page = 1;
    }
    resetForm();          // form direset hanya jika sukses
    await loadAlat();     // sinkronkan UI dengan database
  } catch (err) {
    showFieldErrors(err.fields ?? {});   // input dipertahankan saat error
    setStatus(err.message, 'fail');
  } finally {
    el.submit.disabled = false;
  }
});

// Edit & Delete (event delegation)
el.tbody.addEventListener('click', async e => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;

  if (btn.dataset.action === 'edit') {
    const item = cache.get(id);
    if (!item) return;
    clearErrors();
    el.id.value = item.id;
    el.nama.value = item.nama;
    el.kategori.value = item.kategori;
    el.jumlah.value = item.jumlah;
    el.kondisi.value = item.kondisi;
    el.submit.textContent = 'Perbarui';
    el.cancel.hidden = false;
    el.nama.focus();
    el.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  if (btn.dataset.action === 'delete') {
    if (!confirm('Hapus data ini?')) return;
    btn.disabled = true;
    try {
      await apiRequest(`${ENDPOINT}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      setStatus('Data alat berhasil dihapus.', 'ok');
      if (el.id.value === id) resetForm();
      await loadAlat();
    } catch (err) {
      setStatus(err.message, 'fail');
      btn.disabled = false;
    }
  }
});

el.cancel.addEventListener('click', resetForm);

// Search (debounce) + filter + pagination
let timer;
el.search.addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    state.q = el.search.value.trim();
    state.page = 1;
    loadAlat();
  }, 300);
});
el.filter.addEventListener('change', () => {
  state.kategori = el.filter.value;
  state.page = 1;
  loadAlat();
});
el.prev.addEventListener('click', () => { if (state.page > 1) { state.page--; loadAlat(); } });
el.next.addEventListener('click', () => { if (state.page < state.totalPage) { state.page++; loadAlat(); } });

const crudSection = $('#crud-section');
document.addEventListener('auth:change', e => {
  currentUser = e.detail.user;
  crudSection.hidden = !currentUser;
  if (!currentUser) {
    el.tbody.replaceChildren();
    return;
  }
  el.form.hidden = !['admin', 'petugas'].includes(currentUser.role);   // viewer: form disembunyikan
  state.page = 1;
  loadAlat();
});