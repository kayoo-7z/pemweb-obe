<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Allow: POST');
        authError(405, 'METHOD_NOT_ALLOWED', 'Gunakan method POST');
    }

    $body     = readJsonBody();
    $nama     = is_string($body['nama'] ?? null) ? trim($body['nama']) : '';
    $email    = is_string($body['email'] ?? null) ? strtolower(trim($body['email'])) : '';
    $password = is_string($body['password'] ?? null) ? $body['password'] : '';

    $fields = [];
    if (mb_strlen($nama) < 3 || mb_strlen($nama) > 100) $fields['nama'] = 'Nama harus 3-100 karakter';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190) $fields['email'] = 'Format email tidak valid';
    if (strlen($password) < 8 || strlen($password) > 72) $fields['password'] = 'Password harus 8-72 karakter';
    if (!empty($fields)) {
        authError(422, 'VALIDATION_ERROR', 'Data pendaftaran tidak valid', $fields);
    }

    $pdo = db();
    $cek = $pdo->prepare('SELECT id FROM users WHERE email = :email');
    $cek->execute(['email' => $email]);
    if ($cek->fetch()) {
        authError(409, 'CONFLICT', 'Email sudah terdaftar');
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $ins = $pdo->prepare('INSERT INTO users (nama, email, password_hash, role) VALUES (:nama, :email, :hash, :role)');
    $ins->execute(['nama' => $nama, 'email' => $email, 'hash' => $hash, 'role' => 'viewer']);

    authJson(201, [
        'success' => true,
        'message' => 'Akun berhasil dibuat. Silakan login.',
        'data'    => ['id' => (int)$pdo->lastInsertId(), 'nama' => $nama, 'email' => $email, 'role' => 'viewer']
    ]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {   // email unik bentrok (race condition)
        authError(409, 'CONFLICT', 'Email sudah terdaftar');
    }
    error_log((string)$e);
    authError(500, 'INTERNAL_SERVER_ERROR', 'Terjadi kesalahan pada server');
} catch (Throwable $e) {
    error_log((string)$e);
    authError(500, 'INTERNAL_SERVER_ERROR', 'Terjadi kesalahan pada server');
}