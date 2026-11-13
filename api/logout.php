<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/auth.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Allow: POST');
        authError(405, 'METHOD_NOT_ALLOWED', 'Gunakan method POST');
    }

    startSecureSession();
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires'  => time() - 42000,
            'path'     => $params['path'],
            'domain'   => $params['domain'],
            'secure'   => (bool)$params['secure'],
            'httponly' => (bool)$params['httponly'],
            'samesite' => $params['samesite'] ?? 'Lax',
        ]);
    }
    session_destroy();

    authJson(200, ['success' => true, 'message' => 'Logout berhasil']);
} catch (Throwable $e) {
    error_log((string)$e);
    authError(500, 'INTERNAL_SERVER_ERROR', 'Terjadi kesalahan pada server');
}