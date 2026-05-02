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

$name = trim((string)($body['name'] ?? ''));
$initials = strtoupper(trim((string)($body['initials'] ?? '')));
$role = strtolower(trim((string)($body['role'] ?? 'employee')));
$isActive = isset($body['isActive']) ? ((bool)$body['isActive'] ? 1 : 0) : null;
$newPassword = (string)($body['password'] ?? '');

if (!in_array($role, ['admin', 'employee'], true)) {
    $role = 'employee';
}
if ($name === '' || $initials === '') {
    jsonResponse(['ok' => false, 'error' => 'name and initials are required'], 400);
}
if ($newPassword !== '' && strlen($newPassword) < 8) {
    jsonResponse(['ok' => false, 'error' => 'New password must be at least 8 characters'], 400);
}

$pdo = db();
$sel = $pdo->prepare('SELECT id, role FROM users WHERE id = :id LIMIT 1');
$sel->execute(['id' => $id]);
$target = $sel->fetch();
if (!$target) {
    jsonResponse(['ok' => false, 'error' => 'User not found'], 404);
}

if ((int)$admin['id'] === $id && $isActive === 0) {
    jsonResponse(['ok' => false, 'error' => 'You cannot deactivate your own account'], 400);
}

$fields = [
    'role = :role',
    'full_name = :name',
    'initials = :initials',
];
$params = [
    'id' => $id,
    'role' => $role,
    'name' => $name,
    'initials' => $initials,
];

if ($isActive !== null) {
    $fields[] = 'is_active = :active';
    $params['active'] = $isActive;
}
if ($newPassword !== '') {
    $fields[] = 'password_hash = :pwd';
    $params['pwd'] = password_hash($newPassword, PASSWORD_DEFAULT);
}

$sql = 'UPDATE users SET ' . implode(', ', $fields) . ', updated_at = CURRENT_TIMESTAMP WHERE id = :id';
$upd = $pdo->prepare($sql);
$upd->execute($params);

$out = $pdo->prepare('SELECT id, username, role, full_name, initials, is_active, created_at, updated_at FROM users WHERE id = :id LIMIT 1');
$out->execute(['id' => $id]);
$row = $out->fetch();

jsonResponse(['ok' => true, 'user' => userPayload($row)]);
