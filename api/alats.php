<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/database.php';

// Helper Response JSON
function jsonResponse(int $statusCode, array $payload): void {
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonSuccess(int $statusCode, array $data = [], string $message = ''): void {
    $response = ['success' => true];
    if ($message !== '') $response['message'] = $message;
    foreach ($data as $key => $val) {
        $response[$key] = $val;
    }
    jsonResponse($statusCode, $response);
}

function jsonError(int $statusCode, string $code, string $message, array $fields = []): void {
    $errorPayload = [
        'success' => false,
        'error'   => [
            'code'    => $code,
            'message' => $message
        ]
    ];
    if (!empty($fields)) {
        $errorPayload['error']['fields'] = $fields;
    }
    jsonResponse($statusCode, $errorPayload);
}

// Global Exception Handler Boundary
try {
    $pdo = db();
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST' && isset($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
        $method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']);
    }

    $idParam = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);

    // ----------------------------------------------------
    // 1. READ (GET Collection & GET Single by ID)
    // ----------------------------------------------------
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            if ($idParam === false || $idParam <= 0) {
                jsonError(400, 'BAD_REQUEST', 'ID alat tidak valid');
            }

            $stmt = $pdo->prepare('SELECT * FROM alat WHERE id = :id');
            $stmt->execute(['id' => $idParam]);
            $alat = $stmt->fetch();

            if (!$alat) {
                jsonError(404, 'NOT_FOUND', 'Data alat tidak ditemukan');
            }

            jsonSuccess(200, ['data' => $alat]);
        }

        $kategori = trim((string)($_GET['kategori'] ?? ''));
        $q        = trim((string)($_GET['q'] ?? ''));
        $page     = filter_var($_GET['page'] ?? 1, FILTER_VALIDATE_INT);
        $limit    = filter_var($_GET['limit'] ?? 10, FILTER_VALIDATE_INT);

        if ($page === false || $page < 1) $page = 1;
        if ($limit === false || $limit < 1 || $limit > 100) $limit = 10;
        $offset = ($page - 1) * $limit;

        $where = [];
        $params = [];

        if ($kategori !== '') {
            $where[] = 'kategori = :kategori';
            $params['kategori'] = $kategori;
        }

        if ($q !== '') {
            $where[] = 'nama LIKE :q';
            $params['q'] = '%' . $q . '%';
        }

        $whereSql = !empty($where) ? ' WHERE ' . implode(' AND ', $where) : '';

        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM alat {$whereSql}");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $sql = "SELECT * FROM alat {$whereSql} ORDER BY id DESC LIMIT :limit OFFSET :offset";
        $stmt = $pdo->prepare($sql);

        foreach ($params as $k => $v) {
            $stmt->bindValue(':' . $k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $data = $stmt->fetchAll();

        jsonSuccess(200, [
            'count'      => count($data),
            'total'      => $total,
            'page'       => $page,
            'total_page' => (int)ceil($total / $limit),
            'data'       => $data
        ]);
    }

    // ----------------------------------------------------
    // 2. CREATE (POST)
    // ----------------------------------------------------
    if ($method === 'POST') {
        $payload = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $nama     = trim((string)($payload['nama'] ?? ''));
        $kategori = trim((string)($payload['kategori'] ?? ''));
        $jumlahRaw = $payload['jumlah'] ?? null;
        $kondisi  = trim((string)($payload['kondisi'] ?? 'Baik'));

        $fields = [];
        if ($nama === '') $fields['nama'] = 'Nama alat wajib diisi';
        if ($kategori === '') $fields['kategori'] = 'Kategori wajib diisi';

        $jumlah = filter_var($jumlahRaw, FILTER_VALIDATE_INT);
        if ($jumlah === false || $jumlah < 0) {
            $fields['jumlah'] = 'Jumlah harus berupa angka integer >= 0';
        }

        if (!empty($fields)) {
            jsonError(422, 'VALIDATION_ERROR', 'Data yang dikirim tidak valid', $fields);
        }

        $stmt = $pdo->prepare('INSERT INTO alat (nama, kategori, jumlah, kondisi) VALUES (:nama, :kategori, :jumlah, :kondisi)');
        $stmt->execute([
            'nama'     => $nama,
            'kategori' => $kategori,
            'jumlah'   => $jumlah,
            'kondisi'  => $kondisi
        ]);

        $newId = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM alat WHERE id = :id');
        $stmt->execute(['id' => $newId]);

        jsonSuccess(201, ['data' => $stmt->fetch()], 'Data alat berhasil ditambahkan');
    }

    // ----------------------------------------------------
    // 3. UPDATE (PUT / PATCH)
    // ----------------------------------------------------
    if ($method === 'PUT' || $method === 'PATCH') {
        if (!isset($_GET['id']) || $idParam === false || $idParam <= 0) {
            jsonError(400, 'BAD_REQUEST', 'ID alat wajib disertakan dan harus valid');
        }

        $checkStmt = $pdo->prepare('SELECT * FROM alat WHERE id = :id');
        $checkStmt->execute(['id' => $idParam]);
        $existing = $checkStmt->fetch();

        if (!$existing) {
            jsonError(404, 'NOT_FOUND', 'Data alat yang akan diperbarui tidak ditemukan');
        }

        $payload = json_decode(file_get_contents('php://input'), true) ?? [];

        $nama     = isset($payload['nama']) ? trim((string)$payload['nama']) : $existing['nama'];
        $kategori = isset($payload['kategori']) ? trim((string)$payload['kategori']) : $existing['kategori'];
        $kondisi  = isset($payload['kondisi']) ? trim((string)$payload['kondisi']) : $existing['kondisi'];
        $jumlah   = isset($payload['jumlah']) ? filter_var($payload['jumlah'], FILTER_VALIDATE_INT) : (int)$existing['jumlah'];

        $fields = [];
        if ($nama === '') $fields['nama'] = 'Nama alat tidak boleh kosong';
        if ($kategori === '') $fields['kategori'] = 'Kategori tidak boleh kosong';
        if ($jumlah === false || $jumlah < 0) $fields['jumlah'] = 'Jumlah harus berupa integer >= 0';

        if (!empty($fields)) {
            jsonError(422, 'VALIDATION_ERROR', 'Data pembaruan tidak valid', $fields);
        }

        $updateStmt = $pdo->prepare('UPDATE alat SET nama = :nama, kategori = :kategori, jumlah = :jumlah, kondisi = :kondisi WHERE id = :id');
        $updateStmt->execute([
            'id'       => $idParam,
            'nama'     => $nama,
            'kategori' => $kategori,
            'jumlah'   => $jumlah,
            'kondisi'  => $kondisi
        ]);

        $checkStmt->execute(['id' => $idParam]);
        jsonSuccess(200, ['data' => $checkStmt->fetch()], 'Data alat berhasil diperbarui');
    }

    // ----------------------------------------------------
    // 4. DELETE
    // ----------------------------------------------------
    if ($method === 'DELETE') {
        if (!isset($_GET['id']) || $idParam === false || $idParam <= 0) {
            jsonError(400, 'BAD_REQUEST', 'ID alat wajib disertakan dan harus valid');
        }

        $checkStmt = $pdo->prepare('SELECT id FROM alat WHERE id = :id');
        $checkStmt->execute(['id' => $idParam]);
        if (!$checkStmt->fetch()) {
            jsonError(404, 'NOT_FOUND', 'Data alat tidak ditemukan atau sudah dihapus');
        }

        $delStmt = $pdo->prepare('DELETE FROM alat WHERE id = :id');
        $delStmt->execute(['id' => $idParam]);

        http_response_code(204);
        exit;
    }

    header('Allow: GET, POST, PUT, PATCH, DELETE');
    jsonError(405, 'METHOD_NOT_ALLOWED', 'Method HTTP tidak didukung');

} catch (Throwable $e) {
    error_log((string)$e);
    jsonError(500, 'INTERNAL_SERVER_ERROR', 'Terjadi kesalahan pada server');
}