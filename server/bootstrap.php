<?php
require_once __DIR__ . '/db.php';

$cfg = require __DIR__ . '/config.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_name($cfg['session_name']);
    session_start();
}

handleCors($cfg['allowed_origins']);

function handleCors(string $allowedOrigins): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowAny = trim($allowedOrigins) === '*';

    if ($allowAny && $origin !== '') {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    } elseif (!$allowAny && $origin !== '') {
        $allowed = array_map('trim', explode(',', $allowedOrigins));
        if (in_array($origin, $allowed, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
        }
    }

    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function jsonResponse(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    if (!is_array($data)) {
        jsonResponse(['ok' => false, 'error' => 'Invalid JSON body'], 400);
    }
    return $data;
}

function currentUser(): ?array
{
    if (empty($_SESSION['uid'])) {
        return null;
    }

    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, username, role, full_name, initials, is_active FROM users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => (int)$_SESSION['uid']]);
    $row = $stmt->fetch();

    if (!$row || (int)$row['is_active'] !== 1) {
        $_SESSION = [];
        session_destroy();
        return null;
    }

    return [
        'id' => (int)$row['id'],
        'user' => $row['username'],
        'role' => $row['role'],
        'name' => $row['full_name'],
        'initials' => $row['initials'],
    ];
}

function requireAuth(): array
{
    $user = currentUser();
    if (!$user) {
        jsonResponse(['ok' => false, 'error' => 'Unauthorized'], 401);
    }
    return $user;
}

function requireAdmin(): array
{
    $user = requireAuth();
    if (($user['role'] ?? '') !== 'admin') {
        jsonResponse(['ok' => false, 'error' => 'Forbidden'], 403);
    }
    return $user;
}

function userPayload(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'user' => $row['username'],
        'role' => $row['role'],
        'name' => $row['full_name'],
        'initials' => $row['initials'],
        'isActive' => (int)$row['is_active'] === 1,
        'createdAt' => $row['created_at'] ?? null,
        'updatedAt' => $row['updated_at'] ?? null,
    ];
}
