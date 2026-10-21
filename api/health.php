<?php
declare(strict_types=1);

// Set header response agar dibaca sebagai JSON
header('Content-Type: application/json; charset=utf-8');

// Set HTTP Status Code 200 OK
http_response_code(200);

// Kembalikan response JSON (memenuhi Latihan No. 1)
echo json_encode([
    'status'  => 'ok',
    'message' => 'API is running'
], JSON_UNESCAPED_UNICODE);
exit;