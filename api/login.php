<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Allow: POST');
        authError(405, 'METHOD_NOT_ALLOWED', 'Gunakan method POST');
    }

    startSecureSession();

    $body     = readJsonBody();
    $email    = is_string($body['email'] ?? null) ? strtolower(trim($body['email'])) : '';
    $password = is_string($body['password'] ?? null) ? $body['password'] : '';

    if ($email === '' || $password === '') {
        authError(400, 'BAD_REQUEST', 'Email dan password wajib diisi');
    }

    $stmt = db()->prepare('SELECT id, nama, email, password_hash, role FROM users WHERE email = :email');
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    // Pesan generik: tidak membocorkan apakah email terdaftar atau tidak
    if (!$user || !password_verify($password, $user['password_hash'])) {
        authError(401, 'INVALID_CREDENTIALS', 'Email atau password salah');
    }

    session_regenerate_id(true);            // cegah session fixation
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['role']    = $user['role'];
    $_SESSION['csrf']    = bin2hex(random_bytes(32));   // BARU: token baru per login

    authJson(200, [
        'success' => true,
        'message' => 'Login berhasil',
        'data'    => [
            'id'         => (int)$user['id'],
            'nama'       => $user['nama'],
            'email'      => $user['email'],
            'role'       => $user['role'],
            'csrf_token' => $_SESSION['csrf']            // BARU
        ]
    ]);
} catch (Throwable $e) {
    error_log((string)$e);                  // detail hanya ke log server
    authError(500, 'INTERNAL_SERVER_ERROR', 'Terjadi kesalahan pada server');
}