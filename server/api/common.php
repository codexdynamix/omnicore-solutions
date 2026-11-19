<?php
declare(strict_types=1);
ini_set('display_errors','0');
error_reporting(E_ALL);

session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>(!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),'httponly'=>true,'samesite'=>'Strict']);
session_start();

require_once __DIR__ . '/../private/config.php';

function json_response(array $payload, int $status = 200): never {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($payload, JSON_UNESCAPED_UNICODE);
  exit;
}

function db(): PDO {
  static $pdo = null;
  if ($pdo) return $pdo;
  $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
  $pdo = new PDO($dsn, DB_USER, DB_PASSWORD, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
  ]);
  return $pdo;
}

function ensure_schema(): void {
  $sql = "
  CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(190) NOT NULL DEFAULT '',
    role VARCHAR(190) NOT NULL DEFAULT '',
    phone VARCHAR(50) NOT NULL DEFAULT '',
    yard_location VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  CREATE TABLE IF NOT EXISTS crm_clients (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(190) NOT NULL,
    organization VARCHAR(190) NOT NULL DEFAULT '',
    phone VARCHAR(50) NOT NULL DEFAULT '',
    email VARCHAR(190) NOT NULL DEFAULT '',
    location VARCHAR(255) NOT NULL DEFAULT '',
    province VARCHAR(100) NOT NULL DEFAULT '',
    service VARCHAR(190) NOT NULL DEFAULT '',
    equipment_interest TEXT,
    intent VARCHAR(20) NOT NULL DEFAULT 'Buy',
    stage VARCHAR(30) NOT NULL DEFAULT 'Lead',
    priority VARCHAR(20) NOT NULL DEFAULT 'Normal',
    deal_value DECIMAL(14,2) NOT NULL DEFAULT 0,
    deal_value_display VARCHAR(50) NOT NULL DEFAULT '$0',
    last_contact VARCHAR(100) NOT NULL DEFAULT '',
    next_follow_up VARCHAR(100) NOT NULL DEFAULT '',
    notes TEXT,
    timeline_json LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  CREATE TABLE IF NOT EXISTS equipment (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(190) NOT NULL,
    category VARCHAR(30) NOT NULL,
    intent VARCHAR(20) NOT NULL,
    blurb TEXT,
    image VARCHAR(255),
    image_alt VARCHAR(255),
    spec TEXT,
    badge VARCHAR(100),
    price VARCHAR(100),
    price_usd VARCHAR(100),
    price_note VARCHAR(255),
    sku VARCHAR(100),
    stock_status VARCHAR(100),
    throughput VARCHAR(100),
    power_option VARCHAR(255),
    condition_name VARCHAR(50),
    warranty_months INT,
    detailed_notes TEXT,
    gallery_json LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  CREATE TABLE IF NOT EXISTS deployments (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36),
    plant VARCHAR(190) NOT NULL,
    category VARCHAR(30) NOT NULL,
    image VARCHAR(255),
    sku VARCHAR(100),
    client_name VARCHAR(190) NOT NULL,
    site VARCHAR(255),
    province VARCHAR(100),
    operator_name VARCHAR(190),
    rate VARCHAR(100),
    daily_rate_usd DECIMAL(14,2) DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    start_date DATE,
    scheduled_return DATE,
    contract_ref VARCHAR(100),
    contact_person VARCHAR(190),
    contact_phone VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  CREATE TABLE IF NOT EXISTS recycle_bin (
    bin_id VARCHAR(80) PRIMARY KEY,
    kind VARCHAR(20) NOT NULL,
    deleted_at VARCHAR(50) NOT NULL,
    title VARCHAR(190) NOT NULL,
    subtitle VARCHAR(255),
    snapshot_json LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  CREATE TABLE IF NOT EXISTS site_copy (
    id TINYINT PRIMARY KEY,
    content_json LONGTEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  ";
  db()->exec($sql);
}

function ensure_admin(): void {\n  ensure_schema();
  $pdo = db();
  $stmt = $pdo->prepare('SELECT id FROM admin_users WHERE email = ? LIMIT 1');
  $stmt->execute([ADMIN_EMAIL]);
  if (!$stmt->fetch()) {
    $id = bin2hex(random_bytes(16));
    $hash = password_hash(ADMIN_PASSWORD, PASSWORD_DEFAULT);
    $insert = $pdo->prepare('INSERT INTO admin_users (id,email,password_hash,full_name,role) VALUES (?,?,?,?,?)');
    $insert->execute([$id, ADMIN_EMAIL, $hash, 'CRM Administrator', 'Administrator']);
  }
}

function require_admin(): void {
  if (empty($_SESSION['admin_id'])) json_response(['ok'=>false,'error'=>'Unauthorized'], 401);
}

function same_origin_request(): bool {
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  if ($origin === '') return true;
  $host = 'https://' . ($_SERVER['HTTP_HOST'] ?? '');
  return rtrim($origin, '/') === rtrim($host, '/');
}

if (!same_origin_request()) json_response(['ok'=>false,'error'=>'Invalid origin'], 403);
