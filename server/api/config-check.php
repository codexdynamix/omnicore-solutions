<?php
require_once __DIR__ . '/../private/config.php';
header('Content-Type: application/json');
echo json_encode(['ok'=>true,'dbHost'=>DB_HOST,'dbName'=>DB_NAME,'dbUser'=>DB_USER,'passwordSet'=>DB_PASSWORD!==''?'yes':'no','adminEmail'=>ADMIN_EMAIL]);
