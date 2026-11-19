<?php
require_once __DIR__ . '/common.php';

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
  try {
    ensure_admin();
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
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
  } catch (Throwable $e) { json_response(['ok'=>false,'error'=>'Server database error: '.$e->getMessage()], 500); }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'forgot') {
  try {
    ensure_schema();
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $email = trim((string)($body['email'] ?? ''));
    $stmt = db()->prepare('SELECT id,email FROM admin_users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if ($user) {
      $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
      $id = bin2hex(random_bytes(16));
      $expires = (new DateTimeImmutable('+15 minutes'))->format('Y-m-d H:i:s');
      db()->prepare('UPDATE password_resets SET used_at = NOW() WHERE email = ? AND used_at IS NULL')->execute([$email]);
      db()->prepare('INSERT INTO password_resets (id,email,code_hash,expires_at) VALUES (?,?,?,?)')->execute([$id,$email,password_hash($code,PASSWORD_DEFAULT),$expires]);
      $from = 'no-reply@'.($_SERVER['HTTP_HOST'] ?? 'localhost');
      $subject = 'Omnicore CRM password reset code';
      $message = "Your Omnicore CRM password reset code is: {$code}\n\nThis code expires in 15 minutes.";
      $headers = "From: {$from}\r\nContent-Type: text/plain; charset=UTF-8\r\n";
      @mail($email, $subject, $message, $headers);
    }
    json_response(['ok'=>true,'message'=>'If that email exists, a reset code has been sent.']);
  } catch (Throwable $e) { json_response(['ok'=>false,'error'=>'Could not start password reset'], 500); }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'reset') {
  try {
    ensure_schema();
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $email = trim((string)($body['email'] ?? ''));
    $code = trim((string)($body['code'] ?? ''));
    $password = (string)($body['password'] ?? '');
    if (strlen($password) < 8) json_response(['ok'=>false,'error'=>'Password must be at least 8 characters'], 400);
    $stmt = db()->prepare('SELECT id,code_hash FROM password_resets WHERE email = ? AND used_at IS NULL AND expires_at >= NOW() ORDER BY created_at DESC LIMIT 1');
    $stmt->execute([$email]);
    $reset = $stmt->fetch();
    if (!$reset || !preg_match('/^\d{6}$/', $code) || !password_verify($code, $reset['code_hash'])) json_response(['ok'=>false,'error'=>'Invalid or expired reset code'], 400);
    $hash = password_hash($password, PASSWORD_DEFAULT);
    db()->prepare('UPDATE admin_users SET password_hash = ? WHERE email = ?')->execute([$hash,$email]);
    db()->prepare('UPDATE password_resets SET used_at = NOW() WHERE id = ?')->execute([$reset['id']]);
    json_response(['ok'=>true,'message'=>'Password updated successfully.']);
  } catch (Throwable $e) { json_response(['ok'=>false,'error'=>'Could not reset password'], 500); }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'change-credentials') {
  try {
    require_admin();
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $currentPassword = (string)($body['currentPassword'] ?? '');
    $email = trim((string)($body['email'] ?? ''));
    $password = (string)($body['password'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_response(['ok'=>false,'error'=>'Enter a valid email address'], 400);
    if ($password !== '' && strlen($password) < 8) json_response(['ok'=>false,'error'=>'New password must be at least 8 characters'], 400);
    $stmt = db()->prepare('SELECT id,password_hash FROM admin_users WHERE id = ? LIMIT 1');
    $stmt->execute([$_SESSION['admin_id']]);
    $user = $stmt->fetch();
    if (!$user || !password_verify($currentPassword, $user['password_hash'])) json_response(['ok'=>false,'error'=>'Current password is incorrect'], 401);
    if ($password !== '') {
      db()->prepare('UPDATE admin_users SET email = ?, password_hash = ? WHERE id = ?')->execute([$email,password_hash($password,PASSWORD_DEFAULT),$user['id']]);
    } else {
      db()->prepare('UPDATE admin_users SET email = ? WHERE id = ?')->execute([$email,$user['id']]);
    }
    $_SESSION['admin_email'] = $email;
    json_response(['ok'=>true,'message'=>'Administrator credentials updated.']);
  } catch (Throwable $e) { json_response(['ok'=>false,'error'=>'Could not update administrator credentials'], 500); }
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
  if (ini_get('session.use_cookies')) { $params = session_get_cookie_params(); setcookie(session_name(), '', time()-42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']); }
  session_destroy();
  json_response(['ok'=>true]);
}

json_response(['ok'=>false,'error'=>'Unknown action'], 404);
