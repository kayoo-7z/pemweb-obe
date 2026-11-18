<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        header('Allow: GET');
        authError(405, 'METHOD_NOT_ALLOWED', 'Gunakan method GET');
    }

    $userId = requireLogin();

    // Hanya kolom aman: TIDAK memilih password_hash
    $stmt = db()->prepare('SELECT id, nama, email, role FROM users WHERE id = :id');
    $stmt->execute(['id' => $userId]);
    $user = $stmt->fetch();

    if (!$user) {   // akun sudah dihapus tapi sesi masih ada
        $_SESSION = [];
        session_destroy();
        authError(401, 'UNAUTHENTICATED', 'Sesi tidak valid, silakan login ulang');
    }

    $user['csrf_token'] = csrfToken();   // supaya halaman yang di-refresh tetap dapat token
    authJson(200, ['success' => true, 'data' => $user]);
} catch (Throwable $e) {
    error_log((string)$e);
    authError(500, 'INTERNAL_SERVER_ERROR', 'Terjadi kesalahan pada server');
}