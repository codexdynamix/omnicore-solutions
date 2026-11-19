<?php
require_once __DIR__ . '/common.php';
header('Content-Type: application/json');
try {
  $pdo=db();
  $row=$pdo->query('SELECT 1 AS ok')->fetch();
  echo json_encode(['ok'=>true,'database'=>'connected','result'=>$row['ok']]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>$e->getMessage()]);
}
