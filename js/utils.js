// js/utils.js

// Langkah 6: Fungsi statistik ringkasan inventaris
export function ringkasInventaris(data) {
  // Error handling dasar: validasi tipe data
  if (!Array.isArray(data)) {
    throw new TypeError('Data harus berupa array!');
  }

  return {
    jenisAlat: data.length,
    totalUnit: data.reduce((sum, item) => sum + item.jumlah, 0),
    perluCek: data.filter(item => item.kondisi !== 'Baik').length
  };
}

// Latihan 1: Filter berdasarkan lokasi laboratorium
export function filterBerdasarkanLokasi(data, lokasi) {
  if (!Array.isArray(data)) throw new TypeError('Data harus berupa array');
  return data.filter(item => item.lokasi.toLowerCase() === lokasi.toLowerCase());
}

// Latihan 2: Cari alat berdasarkan ID menggunakan find
export function cariAlatBerdasarkanId(data, id) {
  if (!Array.isArray(data)) throw new TypeError('Data harus berupa array');
  const hasil = data.find(item => item.id === id);
  if (!hasil) {
    throw new Error(`Alat dengan ID ${id} tidak ditemukan.`);
  }
  return hasil;
}

// Latihan 3: Format ringkasan alat menggunakan Destructuring & Template Literal
export function formatRingkasanAlat(item) {
  if (!item) return 'Data alat tidak valid.';
  
  // Destructuring object
  const { id, nama, kategori, jumlah, kondisi, lokasi } = item;
  
  // Template literal
  return `[ID: ${id}] ${nama} (${kategori}) | Jumlah: ${jumlah} unit | Kondisi: ${kondisi} | Lokasi: ${lokasi}`;
}
