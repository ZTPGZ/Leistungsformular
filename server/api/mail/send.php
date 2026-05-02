<?php
require_once dirname(__DIR__, 2) . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    jsonResponse(['ok' => false, 'error' => 'Method not allowed'], 405);
}

$cfg = require dirname(__DIR__, 2) . '/config.php';

$toRaw = trim((string)($_POST['to'] ?? ''));
$subject = trim((string)($_POST['subject'] ?? ''));
$text = trim((string)($_POST['text'] ?? ''));
$docNum = trim((string)($_POST['docNum'] ?? 'Leistungsnachweis'));

if ($toRaw === '' || $subject === '' || $text === '') {
    jsonResponse(['ok' => false, 'error' => 'Missing required fields: to, subject, text'], 400);
}
if (!isset($_FILES['pdf']) || (int)($_FILES['pdf']['error'] ?? 4) !== 0) {
    jsonResponse(['ok' => false, 'error' => 'PDF attachment is required'], 400);
}

$to = array_values(array_filter(array_map('trim', explode(',', $toRaw)), static function ($v) {
    return $v !== '';
}));

if (!$to) {
    jsonResponse(['ok' => false, 'error' => 'No recipients provided'], 400);
}

$invalid = [];
foreach ($to as $mail) {
    if (!filter_var($mail, FILTER_VALIDATE_EMAIL)) {
        $invalid[] = $mail;
    }
}
if ($invalid) {
    jsonResponse(['ok' => false, 'error' => 'Invalid recipient e-mail(s)', 'invalid' => $invalid], 400);
}

$pdfTmp = $_FILES['pdf']['tmp_name'];
$pdfName = basename((string)($_FILES['pdf']['name'] ?? ($docNum . '.pdf')));
$pdfData = @file_get_contents($pdfTmp);
if ($pdfData === false) {
    jsonResponse(['ok' => false, 'error' => 'Cannot read uploaded PDF'], 500);
}

$from = trim((string)($cfg['mail_from'] ?? ''));
$replyTo = trim((string)($cfg['mail_reply_to'] ?? ''));
if ($from === '' || !filter_var($from, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['ok' => false, 'error' => 'mail_from missing/invalid in server/config.php'], 500);
}
if ($replyTo !== '' && !filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['ok' => false, 'error' => 'mail_reply_to invalid in server/config.php'], 500);
}

$boundary = '=_KAMA_' . md5((string)microtime(true));
$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'From: ' . $from;
if ($replyTo !== '') {
    $headers[] = 'Reply-To: ' . $replyTo;
}
$headers[] = 'Content-Type: multipart/mixed; boundary="' . $boundary . '"';

$subjectEncoded = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$textPart = chunk_split(base64_encode($text));
$attachPart = chunk_split(base64_encode($pdfData));

$body = '';
$body .= '--' . $boundary . "\r\n";
$body .= "Content-Type: text/plain; charset=UTF-8\r\n";
$body .= "Content-Transfer-Encoding: base64\r\n\r\n";
$body .= $textPart . "\r\n";
$body .= '--' . $boundary . "\r\n";
$body .= 'Content-Type: application/pdf; name="' . addslashes($pdfName) . "\"\r\n";
$body .= "Content-Transfer-Encoding: base64\r\n";
$body .= 'Content-Disposition: attachment; filename="' . addslashes($pdfName) . "\"\r\n\r\n";
$body .= $attachPart . "\r\n";
$body .= '--' . $boundary . "--\r\n";

$ok = @mail(implode(',', $to), $subjectEncoded, $body, implode("\r\n", $headers));
if (!$ok) {
    jsonResponse(['ok' => false, 'error' => 'Mail transport failed (mail())'], 502);
}

jsonResponse(['ok' => true, 'sentTo' => $to, 'docNum' => $docNum]);
