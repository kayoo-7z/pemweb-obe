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