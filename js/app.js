// js/app.js

import { 
  ringkasInventaris, 
  filterBerdasarkanLokasi, 
  cariAlatBerdasarkanId, 
  formatRingkasanAlat 
} from './utils.js';

// 1. Data Inventaris Laboratorium
const inventarisLab = [
  { id: 1, nama: 'Arduino Uno R3', kategori: 'Mikrokontroler', jumlah: 10, kondisi: 'Baik', lokasi: 'Lab Hardware' },
  { id: 2, nama: 'Oscilloscope Digital', kategori: 'Pengukuran', jumlah: 2, kondisi: 'Baik', lokasi: 'Lab Hardware' },
  { id: 3, nama: 'Router Cisco', kategori: 'Jaringan', jumlah: 5, kondisi: 'Perlu Cek', lokasi: 'Lab Jaringan' },
  { id: 4, nama: 'Multimeter Digital', kategori: 'Pengukuran', jumlah: 8, kondisi: 'Baik', lokasi: 'Lab Hardware' },
  { id: 5, nama: 'Crimping Tool', kategori: 'Jaringan', jumlah: 15, kondisi: 'Rusak', lokasi: 'Lab Jaringan' }
];

// --- MODUL 5: DOM, EVENT, WEB STORAGE ---

// Selector DOM
const daftar = document.querySelector('#daftar-alat');
const tombolFilter = document.querySelectorAll('[data-filter]');
const themeButton = document.querySelector('#theme-button');
const searchInput = document.querySelector('#search-input');
const limitSelect = document.querySelector('#page-limit');

// Variable state sementara
let dataAktif = [...inventarisLab];

// 2. Fungsi Render DOM Aman (Praktikum Poin 2 & Latihan Poin 2)
function renderItems(items) {
  daftar.replaceChildren(); // Bersihkan container

  // Ambil limit dari localStorage/select (Latihan Poin 3)
  const limit = parseInt(limitSelect.value, 10);
  const itemsTampil = items.slice(0, limit);

  itemsTampil.forEach(item => {
    const article = document.createElement('article');
    article.className = 'card';

    const title = document.createElement('h3');
    title.textContent = item.nama;

    const info = document.createElement('p');
    info.textContent = `${item.kategori} | ${item.lokasi} - ${item.jumlah} unit (${item.kondisi})`;

    // Tombol Detail untuk Event Delegation (Latihan Poin 2)
    const btnDetail = document.createElement('button');
    btnDetail.className = 'btn-detail';
    btnDetail.textContent = 'Detail';
    btnDetail.dataset.id = item.id;

    article.append(title, info, btnDetail);
    daftar.append(article);
  });
}

// 3. Filter Kondisi (Praktikum Poin 3 & 4)
tombolFilter.forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    dataAktif = filter === 'Semua' 
      ? inventarisLab 
      : inventarisLab.filter(item => item.kondisi === filter);
    
    renderItems(dataAktif);
  });
});

// 4. Pencarian Real-time event 'input' (Latihan Poin 1)
searchInput.addEventListener('input', (e) => {
  const keyword = e.target.value.toLowerCase();
  const hasilCari = dataAktif.filter(item => 
    item.nama.toLowerCase().includes(keyword)
  );
  renderItems(hasilCari);
});

// 5. Event Delegation untuk Tombol Detail (Latihan Poin 2)
daftar.addEventListener('click', (e) => {
  const btnDetail = e.target.closest('.btn-detail');
  if (btnDetail) {
    const id = parseInt(btnDetail.dataset.id, 10);
    const item = cariAlatBerdasarkanId(inventarisLab, id);
    alert(formatRingkasanAlat(item));
  }
});

// 6. Theme Preference localStorage (Praktikum Poin 5 & 6)
const savedTheme = localStorage.getItem('theme') ?? 'light';
document.documentElement.dataset.theme = savedTheme;

themeButton.addEventListener('click', () => {
  const currentTheme = document.documentElement.dataset.theme;
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem('theme', nextTheme);
});

// 7. Simpan Limit Items di localStorage (Latihan Poin 3)
const savedLimit = localStorage.getItem('pageLimit') ?? '5';
limitSelect.value = savedLimit;

limitSelect.addEventListener('change', (e) => {
  localStorage.setItem('pageLimit', e.target.value);
  renderItems(dataAktif);
});

// Render awal saat halaman pertama kali dimuat
renderItems(dataAktif);

// --- MODUL 6: FORM, VALIDASI, ACCESSIBILITY ---

const formAlat = document.querySelector('#form-alat');
const formStatus = document.querySelector('#form-status');
const errorSummary = document.querySelector('#error-summary');
const previewBox = document.querySelector('#preview-data');
const previewList = document.querySelector('#preview-list');
const tanggalInput = document.querySelector('#tanggal');

const KATEGORI_VALID = ['Mikrokontroler', 'Pengukuran', 'Jaringan'];
const KONDISI_VALID = ['Baik', 'Perlu Cek', 'Rusak'];

// Tanggal hari ini format YYYY-MM-DD (pakai waktu lokal, bukan UTC)
function todayString() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

// Batasi date picker sampai hari ini (bantuan UI; validasi tetap di JS)
tanggalInput.max = todayString();

// Input handling: bersihkan & normalisasi sebelum divalidasi
function normalisasiData(formData) {
  return {
    nama: String(formData.get('nama') ?? '').trim().replace(/\s+/g, ' '),
    kategori: String(formData.get('kategori') ?? '').trim(),
    jumlah: String(formData.get('jumlah') ?? '').trim(),
    kondisi: String(formData.get('kondisi') ?? '').trim(),
    tanggal: String(formData.get('tanggal') ?? '').trim(),
    catatan: String(formData.get('catatan') ?? '').trim(),
    setuju: formData.has('setuju')
  };
}

// validateForm(formData) -> object errors (urutan key = urutan field di form)
function validateForm(formData) {
  const errors = {};
  const d = normalisasiData(formData);

  // Aturan 1: nama (kosong / terlalu pendek / karakter tidak valid)
  if (d.nama === '') {
    errors.nama = 'Nama alat wajib diisi.';
  } else if (d.nama.length < 3) {
    errors.nama = 'Nama alat minimal 3 karakter.';
  } else if (!/^[\p{L}\p{N}\s.\-\/()]+$/u.test(d.nama)) {
    errors.nama = 'Nama alat hanya boleh berisi huruf, angka, spasi, titik, tanda hubung, atau garis miring.';
  }

  // Aturan 2: kategori (kosong / bukan dari pilihan)
  if (d.kategori === '') {
    errors.kategori = 'Pilih salah satu kategori alat.';
  } else if (!KATEGORI_VALID.includes(d.kategori)) {
    errors.kategori = 'Kategori tidak valid. Pilih dari daftar yang tersedia.';
  }

  // Aturan 3: jumlah (kosong / bukan bilangan bulat / negatif / kebesaran)
  const jumlah = Number(d.jumlah);
  if (d.jumlah === '') {
    errors.jumlah = 'Jumlah wajib diisi.';
  } else if (!Number.isInteger(jumlah)) {
    errors.jumlah = 'Jumlah harus berupa bilangan bulat, contoh: 5.';
  } else if (jumlah < 0) {
    errors.jumlah = 'Jumlah tidak boleh kurang dari 0.';
  } else if (jumlah > 1000) {
    errors.jumlah = 'Jumlah maksimal 1000 unit.';
  }

  // Aturan 4: kondisi (kosong / bukan dari pilihan)
  if (d.kondisi === '') {
    errors.kondisi = 'Pilih kondisi alat.';
  } else if (!KONDISI_VALID.includes(d.kondisi)) {
    errors.kondisi = 'Kondisi tidak valid. Pilih dari daftar yang tersedia.';
  }

  // Aturan 5: tanggal perolehan (kosong / format salah / melebihi hari ini)
  if (d.tanggal === '') {
    errors.tanggal = 'Tanggal perolehan wajib diisi.';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(d.tanggal) || Number.isNaN(Date.parse(d.tanggal))) {
    errors.tanggal = 'Format tanggal tidak valid. Gunakan format tahun-bulan-tanggal.';
  } else if (d.tanggal > todayString()) {
    errors.tanggal = 'Tanggal perolehan tidak boleh melebihi hari ini.';
  }

  // Aturan 6: catatan opsional, maks 200 karakter
  if (d.catatan.length > 200) {
    errors.catatan = `Catatan maksimal 200 karakter (sekarang ${d.catatan.length}).`;
  }

  // Aturan 7: persetujuan wajib dicentang
  if (!d.setuju) {
    errors.setuju = 'Centang pernyataan ini sebelum melanjutkan.';
  }

  return errors;
}

const LABEL_FIELD = {
  nama: 'Nama alat', kategori: 'Kategori', jumlah: 'Jumlah',
  kondisi: 'Kondisi', tanggal: 'Tanggal perolehan',
  catatan: 'Catatan', setuju: 'Persetujuan'
};

function resetErrors() {
  formAlat.querySelectorAll('.error').forEach(el => (el.textContent = ''));
  formAlat.querySelectorAll('[aria-invalid="true"]').forEach(el => el.removeAttribute('aria-invalid'));
  errorSummary.replaceChildren();
  errorSummary.hidden = true;
  formStatus.className = '';
}

function renderErrors(errors) {
  // Pesan error dekat field + aria-invalid
  for (const [field, message] of Object.entries(errors)) {
    document.querySelector(`#error-${field}`).textContent = message;
    formAlat.elements[field]?.setAttribute('aria-invalid', 'true');
  }

  // Error summary di atas form (aman: pakai textContent)
  const judul = document.createElement('strong');
  judul.textContent = `Terdapat ${Object.keys(errors).length} kesalahan pada formulir:`;
  const ul = document.createElement('ul');
  for (const [field, message] of Object.entries(errors)) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${field}`;
    a.textContent = `${LABEL_FIELD[field]}: ${message}`;
    li.append(a);
    ul.append(li);
  }
  errorSummary.append(judul, ul);
  errorSummary.hidden = false;
}

function tampilkanPreview(formData) {
  const d = normalisasiData(formData);
  const tampil = {
    'Nama alat': d.nama,
    'Kategori': d.kategori,
    'Jumlah': `${Number(d.jumlah)} unit`,
    'Kondisi': d.kondisi,
    'Tanggal perolehan': d.tanggal,
    'Catatan': d.catatan || '-'
  };
  previewList.replaceChildren();
  for (const [k, v] of Object.entries(tampil)) {
    const dt = document.createElement('dt');
    dt.textContent = k;
    const dd = document.createElement('dd');
    dd.textContent = v;
    previewList.append(dt, dd);
  }
  previewBox.hidden = false;
}

formAlat.addEventListener('submit', event => {
  event.preventDefault();
  resetErrors();
  previewBox.hidden = true;

  const formData = new FormData(formAlat);
  const errors = validateForm(formData);

  if (Object.keys(errors).length > 0) {
    renderErrors(errors);
    const firstField = Object.keys(errors)[0];
    formAlat.elements[firstField]?.focus();       // fokus ke error pertama
    formStatus.textContent = 'Periksa kembali data yang belum valid.';
    formStatus.className = 'fail';
    return;
  }

  // Valid: tampilkan preview, JANGAN kirim ke server dulu
  tampilkanPreview(formData);
  formStatus.textContent = 'Data valid dan siap dikirim.';
  formStatus.className = 'ok';
});

// UX: error di sebuah field hilang begitu user mulai memperbaikinya
formAlat.addEventListener('input', e => {
  const field = e.target.name;
  if (!field) return;
  const err = document.querySelector(`#error-${field}`);
  if (err) err.textContent = '';
  e.target.removeAttribute('aria-invalid');
});

// Draft form (non-sensitif) - PPT hal. 14
const DRAFT_KEY = 'alatFormDraft';

formAlat.addEventListener('input', () => {
  const data = Object.fromEntries(new FormData(formAlat));
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
});

const rawDraft = localStorage.getItem(DRAFT_KEY);
if (rawDraft) {
  try {
    const draft = JSON.parse(rawDraft);
    for (const [name, value] of Object.entries(draft)) {
      const el = formAlat.elements[name];
      if (!el) continue;
      if (el.type === 'checkbox') el.checked = true; else el.value = value;
    }
  } catch { localStorage.removeItem(DRAFT_KEY); }
}

formAlat.addEventListener('submit', () => {
  if (formStatus.classList.contains('ok')) localStorage.removeItem(DRAFT_KEY);
});

// --- MODUL 7: WEB API, FETCH, JSON, ASYNC/AWAIT ---

// Ubah ke true bila internet lab bermasalah / API publik down
const USE_LOCAL_DATA = false;
const API_URL = 'https://jsonplaceholder.typicode.com/users';
const LOCAL_URL = './data/users.json';

const apiOutput = document.querySelector('#api-output');
const apiMessage = document.querySelector('#api-message');
const apiSpinner = document.querySelector('#api-spinner');
const apiError = document.querySelector('#api-error');
const apiErrorText = document.querySelector('#api-error-text');
const apiRetry = document.querySelector('#api-retry');
const apiReload = document.querySelector('#api-reload');
const apiSearch = document.querySelector('#api-search');
const apiEmpty = document.querySelector('#api-empty');
const apiStats = document.querySelector('#api-stats');
const statTotal = document.querySelector('#stat-total');
const statShown = document.querySelector('#stat-shown');
const statSource = document.querySelector('#stat-source');

// Data asli disimpan di sini; search memfilter dari array ini (tanpa request ulang)
let semuaUser = [];

function setApiLoading(isLoading) {
  apiSpinner.hidden = !isLoading;
  apiOutput.setAttribute('aria-busy', String(isLoading));
  apiReload.disabled = isLoading;
  apiRetry.disabled = isLoading;
  if (isLoading) apiMessage.textContent = 'Memuat data...';
}

// Render aman: pakai createElement + textContent (bukan innerHTML)
function renderUsers(items) {
  apiOutput.replaceChildren();

  items.forEach(user => {
    const card = document.createElement('article');
    card.className = 'card';

    const nama = document.createElement('h3');
    nama.textContent = user.name;

    const email = document.createElement('p');
    email.textContent = `Email: ${user.email}`;

    const info = document.createElement('p');
    info.textContent = `${user.company?.name ?? '-'} | ${user.address?.city ?? '-'}`;

    card.append(nama, email, info);
    apiOutput.append(card);
  });

  // Empty state: bedakan "data memang kosong" vs "hasil search kosong"
  if (items.length === 0) {
    apiEmpty.textContent = semuaUser.length === 0
      ? 'Belum ada data untuk ditampilkan.'
      : 'Tidak ada data yang cocok dengan pencarian.';
    apiEmpty.hidden = false;
  } else {
    apiEmpty.hidden = true;
  }

  // Ringkasan dashboard
  statTotal.textContent = semuaUser.length;
  statShown.textContent = items.length;
  statSource.textContent = USE_LOCAL_DATA ? 'File lokal' : 'API publik';
  apiStats.hidden = false;
}

async function loadUsers() {
  const endpoint = USE_LOCAL_DATA ? LOCAL_URL : API_URL;

  setApiLoading(true);
  apiError.hidden = true;
  apiEmpty.hidden = true;

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' }
    });

    // Urutan berpikir: 1) cek status, 2) baca body, 3) render
    console.log('Status:', response.status, '| ok:', response.ok);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Format JSON tidak sesuai');

    semuaUser = data;
    apiSearch.disabled = false;
    renderUsers(semuaUser);
    apiMessage.textContent = `Berhasil memuat ${data.length} data.`;
  } catch (error) {
    // Detail teknis hanya ke Console, pengguna hanya lihat pesan ramah
    console.error(error);
    semuaUser = [];
    apiOutput.replaceChildren();
    apiStats.hidden = true;
    apiSearch.disabled = true;
    apiMessage.textContent = '';
    apiErrorText.textContent = 'Data belum dapat dimuat. Periksa koneksi, lalu coba lagi.';
    apiError.hidden = false;
  } finally {
    setApiLoading(false);   // loading berhenti apa pun hasilnya
  }
}

// Latihan 1: tombol retry & muat ulang
apiRetry.addEventListener('click', loadUsers);
apiReload.addEventListener('click', () => {
  apiSearch.value = '';
  loadUsers();
});

// Latihan 2: filter dari data yang sudah ada, TANPA memanggil API
apiSearch.addEventListener('input', e => {
  const keyword = e.target.value.trim().toLowerCase();
  const hasil = semuaUser.filter(user =>
    user.name.toLowerCase().includes(keyword) ||
    user.email.toLowerCase().includes(keyword)
  );
  renderUsers(hasil);
});

// Jalankan saat halaman dimuat
loadUsers();