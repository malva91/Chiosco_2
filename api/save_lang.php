<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Token');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  echo json_encode(['ok' => true]);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
  exit;
}

// Token check
$token = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
if (!defined('ADMIN_TOKEN') || !hash_equals((string)ADMIN_TOKEN, (string)$token)) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'Unauthorized']);
  exit;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);

$lang = strtolower(trim((string)($payload['lang'] ?? '')));
$data = $payload['data'] ?? null;

if ($lang === '' || !is_array($data)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Invalid payload']);
  exit;
}

// Allow only simple lang codes: en, fr, de, es, pt, etc. (2-5 chars)
if (!preg_match('/^[a-z]{2,5}$/', $lang)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Invalid lang']);
  exit;
}

// Only allow writing inside ../guida/lang/
$baseDir = realpath(__DIR__ . '/../guida/lang');
if ($baseDir === false) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Server misconfig']);
  exit;
}

$targetPath = $baseDir . DIRECTORY_SEPARATOR . $lang . '.json';
$realTargetDir = realpath(dirname($targetPath));
if ($realTargetDir === false || strpos($realTargetDir, $baseDir) !== 0) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Invalid path']);
  exit;
}

$json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($json === false) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'JSON encode failed']);
  exit;
}

// Atomic write
$tmp = $targetPath . '.tmp';
if (@file_put_contents($tmp, $json) === false) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Write failed']);
  exit;
}

if (!@rename($tmp, $targetPath)) {
  @unlink($tmp);
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Rename failed']);
  exit;
}

echo json_encode(['ok' => true, 'path' => 'guida/lang/' . $lang . '.json']);
