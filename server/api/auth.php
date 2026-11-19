<?php
require_once __DIR__ . '/common.php';

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
  try {\n  ensure_admin();\n   = json_decode(file_get_contents('php://input'), true) ?: [];
  $email = trim((string)($body['email'] ?? ''));
  $password = (string)($body['password'] ?? '');
  $stmt = db()->prepare('SELECT id,password_hash,email,full_name,role,phone,yard_location FROM admin_users WHERE email = ? LIMIT 1');
  $stmt->execute([$email]);
  $user = $stmt->fetch();
  if (!$user || !password_verify($password, $user['password_hash'])) json_response(['ok'=>false,'error'=>'Invalid email or password'], 401);
  session_regenerate_id(true);
  $_SESSION['admin_id'] = $user['id'];
  $_SESSION['admin_email'] = $user['email'];
  json_response(['ok'=>true,'admin'=>['email'=>$user['email'],'fullName'=>$user['full_name'],'role'=>$user['role'],'phone'=>$user['phone'],'yardLocation'=>$user['yard_location']]]);
}

if ($action === 'me' && $_SERVER['REQUEST_METHOD'] === 'GET') {
  require_admin();
  $stmt = db()->prepare('SELECT email,full_name,role,phone,yard_location FROM admin_users WHERE id = ? LIMIT 1');
  $stmt->execute([$_SESSION['admin_id']]);
  $user = $stmt->fetch();
  json_response(['ok'=>true,'admin'=>$user ? ['email'=>$user['email'],'fullName'=>$user['full_name'],'role'=>$user['role'],'phone'=>$user['phone'],'yardLocation'=>$user['yard_location']] : null]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'logout') {
  $_SESSION = [];
  if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time()-42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
  }
  session_destroy();
  json_response(['ok'=>true]);
}

json_response(['ok'=>false,'error'=>'Unknown action'], 404);
