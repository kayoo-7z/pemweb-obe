<?php
declare(strict_types=1);

// Response JSON seragam untuk semua endpoint auth
function authJson(int $status, array $payload): void {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function authError(int $status, string $code, string $message, array $fields = []): void {
    $error = ['code' => $code, 'message' => $message];
    if (!empty($fields)) $error['fields'] = $fields;
    authJson($status, ['success' => false, 'error' => $error]);
}

function readJsonBody(): array {
    $data = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($data) ? $data : [];
}

// Poin 3: cookie session HttpOnly + SameSite=Lax + Secure (hanya saat HTTPS)
function startSecureSession(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $isHttps = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

// Poin 4: 401 bila belum login
function requireLogin(): int {
    startSecureSession();
    if (empty($_SESSION['user_id'])) {
        authError(401, 'UNAUTHENTICATED', 'Silakan login terlebih dahulu');
    }
    return (int)$_SESSION['user_id'];
}

// Poin 4: 403 bila sudah login tetapi role tidak berhak
function requireRole(array $roles): void {
    requireLogin();
    if (!in_array($_SESSION['role'] ?? '', $roles, true)) {
        authError(403, 'FORBIDDEN', 'Akses ditolak: peran Anda tidak memiliki izin untuk aksi ini');
    }
}