<?php
require_once dirname(__DIR__, 2) . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    jsonResponse(['ok' => false, 'error' => 'Method not allowed'], 405);
}

requireAdmin();

$pdo = db();
$rows = $pdo->query('SELECT id, username, role, full_name, initials, is_active, created_at, updated_at FROM users ORDER BY username ASC')->fetchAll();

$users = array_map('userPayload', $rows ?: []);
jsonResponse(['ok' => true, 'users' => $users]);
