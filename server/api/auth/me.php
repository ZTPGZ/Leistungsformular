<?php
require_once dirname(__DIR__, 2) . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    jsonResponse(['ok' => false, 'error' => 'Method not allowed'], 405);
}

$user = currentUser();
if (!$user) {
    jsonResponse(['ok' => false, 'error' => 'Not logged in'], 401);
}

jsonResponse(['ok' => true, 'user' => $user]);
