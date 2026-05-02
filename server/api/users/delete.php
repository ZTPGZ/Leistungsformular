<?php
require_once dirname(__DIR__, 2) . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    jsonResponse(['ok' => false, 'error' => 'Method not allowed'], 405);
}

$admin = requireAdmin();
$body = readJsonBody();
$id = (int)($body['id'] ?? 0);

if ($id <= 0) {
    jsonResponse(['ok' => false, 'error' => 'id is required'], 400);
}
if ((int)$admin['id'] === $id) {
    jsonResponse(['ok' => false, 'error' => 'You cannot delete your own account'], 400);
}

$pdo = db();
$upd = $pdo->prepare('UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
$upd->execute(['id' => $id]);

jsonResponse(['ok' => true]);
