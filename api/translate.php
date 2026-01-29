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

$token = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
if (!$token || !hash_equals(ADMIN_TOKEN, $token)) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'Unauthorized']);
  exit;
}

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
  exit;
}

$target = (string)($data['target'] ?? '');
$source = (string)($data['source'] ?? 'it');
$mode   = (string)($data['mode'] ?? 'menu');
$items  = $data['items'] ?? null;

if ($target === '' || !preg_match('/^[a-z]{2,5}(-[A-Z]{2})?$/', $target)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Invalid target language']);
  exit;
}

if (!is_array($items) || count($items) === 0) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Missing items']);
  exit;
}

if (count($items) > MAX_ITEMS_PER_REQUEST) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Too many items']);
  exit;
}

$totalChars = 0;
$cleanItems = [];
foreach ($items as $it) {
  if (!is_array($it)) continue;
  $id = (string)($it['id'] ?? '');
  $text = (string)($it['text'] ?? '');
  $context = (string)($it['context'] ?? '');
  if ($id === '' || $text === '') continue;
  $totalChars += mb_strlen($text, 'UTF-8');
  $cleanItems[] = ['id' => $id, 'text' => $text, 'context' => $context];
}

if (count($cleanItems) === 0) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'No valid items']);
  exit;
}

if ($totalChars > MAX_CHARS_PER_REQUEST) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Payload too large']);
  exit;
}

if (OPENAI_API_KEY === '' || OPENAI_API_KEY === 'PASTE_YOUR_OPENAI_API_KEY_HERE') {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'OpenAI key not configured']);
  exit;
}

$system = "You are a professional translator for restaurant digital menus.\n"
  . "Translate from {$source} to {$target}.\n"
  . "Rules:\n"
  . "- Keep meaning and tone natural for a menu.\n"
  . "- Keep units, prices, emojis, and punctuation unchanged.\n"
  . "- Do not add extra text, quotes, or explanations.\n"
  . "- If a text is a proper noun/brand, keep it unchanged.\n"
  . "- Return ONLY the JSON that matches the required schema.";

$payloadItems = [];
foreach ($cleanItems as $it) {
  $payloadItems[] = [
    'id' => $it['id'],
    'text' => $it['text'],
    'context' => $it['context'],
  ];
}

$user = [
  'target' => $target,
  'source' => $source,
  'mode'   => $mode,
  'items'  => $payloadItems,
];

// NOTE: For maximum compatibility with Structured Outputs, avoid map-like objects
// using additionalProperties with a schema. Instead, request an array of entries.
$schema = [
  'type' => 'object',
  'additionalProperties' => false,
  'properties' => [
    'translations' => [
      'type' => 'array',
      'items' => [
        'type' => 'object',
        'additionalProperties' => false,
        'properties' => [
          'id' => ['type' => 'string'],
          'text' => ['type' => 'string'],
        ],
        'required' => ['id', 'text'],
      ],
    ],
  ],
  'required' => ['translations'],
];

$body = [
  'model' => OPENAI_MODEL,
  'input' => [
    ['role' => 'system', 'content' => $system],
    ['role' => 'user',   'content' => json_encode($user, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)],
  ],
  'text' => [
    'format' => [
      'type' => 'json_schema',
      'name' => 'menu_translations',
      'strict' => true,
      'schema' => $schema,
    ]
  ],
  'temperature' => 0.2,
];

$ch = curl_init('https://api.openai.com/v1/responses');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    'Content-Type: application/json',
    'Authorization: Bearer ' . OPENAI_API_KEY,
  ],
  CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
  CURLOPT_TIMEOUT => 45,
]);

$response = curl_exec($ch);
$errno = curl_errno($ch);
$err = curl_error($ch);
$http = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($errno) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'cURL error', 'details' => $err]);
  exit;
}

if ($http < 200 || $http >= 300) {
  http_response_code($http ?: 500);
  echo json_encode(['ok' => false, 'error' => 'OpenAI API error', 'details' => $response]);
  exit;
}

$decoded = json_decode($response, true);
if (!is_array($decoded)) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Invalid OpenAI response']);
  exit;
}

// Extract output text
$outText = '';
if (isset($decoded['output_text']) && is_string($decoded['output_text'])) {
  $outText = $decoded['output_text'];
} else {
  $output = $decoded['output'] ?? [];
  if (is_array($output)) {
    foreach ($output as $o) {
      if (!is_array($o)) continue;
      $content = $o['content'] ?? null;
      if (!is_array($content)) continue;
      foreach ($content as $c) {
        if (!is_array($c)) continue;
        if (($c['type'] ?? '') === 'output_text' && isset($c['text']) && is_string($c['text'])) {
          $outText .= $c['text'];
        }
      }
    }
  }
}

$outText = trim($outText);
$parsed = json_decode($outText, true);
if (!is_array($parsed) || !isset($parsed['translations']) || !is_array($parsed['translations'])) {
  http_response_code(500);
  echo json_encode([
    'ok' => false,
    'error' => 'Could not parse structured output',
    'raw' => $outText,
  ]);
  exit;
}

// Convert [{id,text}, ...] into { id: text, ... }
$map = [];
foreach ($parsed['translations'] as $row) {
  if (!is_array($row)) continue;
  $id = (string)($row['id'] ?? '');
  $text = (string)($row['text'] ?? '');
  if ($id === '') continue;
  $map[$id] = $text;
}

echo json_encode([
  'ok' => true,
  'translations' => $map,
]);
