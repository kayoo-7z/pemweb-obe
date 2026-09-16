// js/app.js

// Langkah 8: Import fungsi dari utils.js
import { 
  ringkasInventaris, 
  filterBerdasarkanLokasi, 
  cariAlatBerdasarkanId, 
  formatRingkasanAlat 
} from './utils.js';

// Langkah 2 & Latihan 1: Array of Objects Inventaris Laboratorium
const inventarisLab = [
  { id: 1, nama: 'Arduino Uno R3', kategori: 'Mikrokontroler', jumlah: 10, kondisi: 'Baik', lokasi: 'Lab Hardware' },
  { id: 2, nama: 'Oscilloscope Digital', kategori: 'Pengukuran', jumlah: 2, kondisi: 'Baik', lokasi: 'Lab Hardware' },
  { id: 3, nama: 'Router Cisco', kategori: 'Jaringan', jumlah: 5, kondisi: 'Perlu Cek', lokasi: 'Lab Jaringan' },
  { id: 4, nama: 'Multimeter Digital', kategori: 'Pengukuran', jumlah: 8, kondisi: 'Baik', lokasi: 'Lab Hardware' },
  { id: 5, nama: 'Crimping Tool', kategori: 'Jaringan', jumlah: 15, kondisi: 'Rusak', lokasi: 'Lab Jaringan' }
];

console.log('=== DATA INVENTARIS LABORATORIUM ===');
console.table(inventarisLab);

// Langkah 3: Filter alat kondisi "Baik"
const alatBaik = inventarisLab.filter(item => item.kondisi === 'Baik');
console.log('=== ALAT KONDISI BAIK (filter) ===');
console.table(alatBaik);

// Langkah 4: Map untuk menghasilkan array nama alat
const namaAlat = inventarisLab.map(({ nama }) => nama);
console.log('=== DAFTAR NAMA ALAT (map) ===');
console.log(namaAlat);

// Langkah 5: Reduce untuk menghitung total jumlah unit alat
const totalUnit = inventarisLab.reduce((total, item) => total + item.jumlah, 0);
console.log('=== TOTAL UNIT ALAT (reduce) ===');
console.log(`Total unit peralatan di lab: ${totalUnit} unit`);

// Langkah 6: Panggil fungsi ringkasan statistik dengan Try-Catch
console.log('=== STATISTIK INVENTARIS ===');
try {
  const statistik = ringkasInventaris(inventarisLab);
  console.log(statistik);
} catch (error) {
  console.error('Gagal menghitung statistik:', error.message);
}

// --- SOAL LATIHAN ---

// Latihan 1: Filter alat pada lokasi tertentu
console.log('=== LATIHAN 1: ALAT DI LAB HARDWARE ===');
const alatLabHardware = filterBerdasarkanLokasi(inventarisLab, 'Lab Hardware');
console.table(alatLabHardware);

// Latihan 2 & 3: Find alat berdasarkan ID + Destructuring & Template Literal
console.log('=== LATIHAN 2 & 3: CARI ALAT ID = 2 & FORMAT STRING ===');
try {
  const alatDitemukan = cariAlatBerdasarkanId(inventarisLab, 2);
  console.log('Objek Ditemukan:', alatDitemukan);
  console.log('String Ringkasan:', formatRingkasanAlat(alatDitemukan));
} catch (error) {
  console.error('Error saat mencari alat:', error.message);
}