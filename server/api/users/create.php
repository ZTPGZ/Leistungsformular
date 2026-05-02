<?php
require_once dirname(__DIR__, 2) . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    jsonResponse(['ok' => false, 'error' => 'Method not allowed'], 405);
}

$pdo = db();
$count = (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();

if ($count > 0) {
    requireAdmin();
}

$body = readJsonBody();

$username = strtolower(trim((string)($body['username'] ?? '')));
$password = (string)($body['password'] ?? '');
$role = strtolower(trim((string)($body['role'] ?? 'employee')));
$name = trim((string)($body['name'] ?? ''));
$initials = strtoupper(trim((string)($body['initials'] ?? '')));

if ($username === '' || $password === '' || $name === '' || $initials === '') {
    jsonResponse(['ok' => false, 'error' => 'username, password, name and initials are required'], 400);
}
if (!preg_match('/^[a-z0-9._-]{3,60}$/', $username)) {
    jsonResponse(['ok' => false, 'error' => 'Invalid username format'], 400);
}
if (strlen($password) < 8) {
    jsonResponse(['ok' => false, 'error' => 'Password must be at least 8 characters'], 400);
}
if (!in_array($role, ['admin', 'employee'], true)) {
    $role = 'employee';
}

if ($count === 0) {
    // Bootstrap mode: first account is always admin.
    $role = 'admin';
}

$exists = $pdo->prepare('SELECT id FROM users WHERE username = :u LIMIT 1');
$exists->execute(['u' => $username]);
if ($exists->fetch()) {
    jsonResponse(['ok' => false, 'error' => 'Username already exists'], 409);
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO users (username, password_hash, role, full_name, initials, is_active) VALUES (:u, :p, :r, :n, :i, 1)');
$stmt->execute([
    'u' => $username,
    'p' => $hash,
    'r' => $role,
    'n' => $name,
    'i' => $initials,
]);

$id = (int)$pdo->lastInsertId();
$sel = $pdo->prepare('SELECT id, username, role, full_name, initials, is_active, created_at, updated_at FROM users WHERE id = :id LIMIT 1');
$sel->execute(['id' => $id]);
$row = $sel->fetch();

jsonResponse(['ok' => true, 'user' => userPayload($row)], 201);
