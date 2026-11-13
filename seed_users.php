<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Script ini hanya boleh dijalankan dari terminal.');
}

require_once __DIR__ . '/config/database.php';

$akun = [
    ['Admin Lab',   'admin@ubt.ac.id',   'Admin#12345',   'admin'],
    ['Petugas Lab', 'petugas@ubt.ac.id', 'Petugas#12345', 'petugas'],
    ['Viewer Lab',  'viewer@ubt.ac.id',  'Viewer#12345',  'viewer'],
];

$pdo  = db();
$stmt = $pdo->prepare(
    'INSERT INTO users (nama, email, password_hash, role) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE nama = VALUES(nama), password_hash = VALUES(password_hash), role = VALUES(role)'
);

foreach ($akun as [$nama, $email, $password, $role]) {
    $stmt->execute([$nama, $email, password_hash($password, PASSWORD_DEFAULT), $role]);
    echo "OK: {$email} ({$role})\n";
}