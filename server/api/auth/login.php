<?php
require_once dirname(__DIR__, 2) . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    jsonResponse(['ok' => false, 'error' => 'Method not allowed'], 405);
}

$body = readJsonBody();
$username = strtolower(trim((string)($body['username'] ?? '')));
$password = (string)($body['password'] ?? '');

if ($username === '' || $password === '') {
    jsonResponse(['ok' => false, 'error' => 'Username and password are required'], 400);
}

$pdo = db();
$stmt = $pdo->prepare('SELECT id, username, password_hash, role, full_name, initials, is_active FROM users WHERE username = :u LIMIT 1');
$stmt->execute(['u' => $username]);
$row = $stmt->fetch();

if (!$row || (int)$row['is_active'] !== 1 || !password_verify($password, $row['password_hash'])) {
    jsonResponse(['ok' => false, 'error' => 'Invalid credentials'], 401);
}

session_regenerate_id(true);
$_SESSION['uid'] = (int)$row['id'];

jsonResponse([
    'ok' => true,
    'user' => [
        'id' => (int)$row['id'],
        'user' => $row['username'],
        'role' => $row['role'],
        'name' => $row['full_name'],
        'initials' => $row['initials'],
    ],
]);
