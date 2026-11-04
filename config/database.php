<?php
require dirname(__DIR__) . '/vendor/autoload.php';

try {
    $dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__));
    $dotenv->load();
} catch (Exception $e) {
    // Pengamanan jika .env tidak terbaca
}

function envRequired(string $key): string {
    $value = $_ENV[$key] ?? $_SERVER[$key] ?? '';
    if ($value === '') {
        throw new RuntimeException("Konfigurasi {$key} belum diisi pada .env");
    }
    return $value;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;

    $host = $_ENV['DB_HOST'] ?? '127.0.0.1';
    $name = $_ENV['DB_NAME'] ?? 'pemweb_obe';
    $user = $_ENV['DB_USER'] ?? 'root';
    $pass = $_ENV['DB_PASS'] ?? '';

    $dsn = "mysql:host={$host};dbname={$name};charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}