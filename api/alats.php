<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

// Data Dummy Inventaris Lab
$inventarisLab = [
    ['id' => 1, 'nama' => 'Arduino Uno R3', 'kategori' => 'Hardware', 'kondisi' => 'Baik', 'jumlah' => 10],
    ['id' => 2, 'nama' => 'Oscilloscope Digital', 'kategori' => 'Hardware', 'kondisi' => 'Baik', 'jumlah' => 2],
    ['id' => 3, 'nama' => 'Router Cisco', 'kategori' => 'Jaringan', 'kondisi' => 'Perlu Cek', 'jumlah' => 5],
    ['id' => 4, 'nama' => 'Multimeter Digital', 'kategori' => 'Hardware', 'kondisi' => 'Baik', 'jumlah' => 8],
    ['id' => 5, 'nama' => 'Crimping Tool', 'kategori' => 'Jaringan', 'kondisi' => 'Rusak', 'jumlah' => 15],
];

// --- GET METHOD ---
if ($method === 'GET') {
    $hasil = $inventarisLab;

    // Filter Query Parameter (?kondisi=Baik)
    if (isset($_GET['kondisi']) && $_GET['kondisi'] !== '') {
        $kondisi = $_GET['kondisi'];
        $hasil = array_values(array_filter($hasil, fn($item) => strtolower($item['kondisi']) === strtolower($kondisi)));
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'count'   => count($hasil),
        'data'    => $hasil
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// --- POST METHOD ---
if ($method === 'POST') {
    try {
        $payload = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        http_response_code(400); // 400 Bad Request
        echo json_encode(['error' => 'Format JSON tidak valid']);
        exit;
    }

    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode(['error' => 'Body JSON harus berupa object']);
        exit;
    }

    $nama = trim((string)($payload['nama'] ?? ''));
    $jumlah = filter_var($payload['jumlah'] ?? null, FILTER_VALIDATE_INT);

    // Validasi aturan bisnis: Nama wajib diisi, max 100 karakter, jumlah angka >= 0
    if ($nama === '' || strlen($nama) > 100 || $jumlah === false || $jumlah < 0) {
        http_response_code(422); // 422 Unprocessable Content
        echo json_encode([
            'error' => 'Data tidak valid. Nama wajib diisi (maks 100 karakter) dan jumlah harus angka >= 0.'
        ]);
        exit;
    }

    http_response_code(201); // 201 Created
    echo json_encode([
        'message' => 'Data berhasil diterima',
        'data'    => compact('nama', 'jumlah')
    ]);
    exit;
}

// --- JIKA METHOD TIDAK DIDUKUNG (DELETE/PUT dll) ---
header('Allow: GET, POST');
http_response_code(405); // 405 Method Not Allowed
echo json_encode(['error' => 'Method tidak diizinkan']);
exit;