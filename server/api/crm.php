<?php
require_once __DIR__ . '/common.php';
require_admin();

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$body = $method === 'POST' ? (json_decode(file_get_contents('php://input'), true) ?: []) : [];
$pdo = db();

if ($action === 'list' && $method === 'GET') {
  $crm = $pdo->query('SELECT * FROM crm_clients ORDER BY created_at DESC')->fetchAll();
  $equipment = $pdo->query('SELECT * FROM equipment ORDER BY created_at DESC')->fetchAll();
  $deployments = $pdo->query('SELECT * FROM deployments ORDER BY created_at DESC')->fetchAll();
  $recycle = $pdo->query('SELECT * FROM recycle_bin ORDER BY created_at DESC')->fetchAll();
  $copy = $pdo->query('SELECT content_json FROM site_copy WHERE id = 1 LIMIT 1')->fetch();
  $profile = $pdo->query('SELECT email,full_name,role,phone,yard_location FROM admin_users LIMIT 1')->fetch();
  $mapClient = fn(array $r): array => ['id'=>$r['id'],'name'=>$r['name'],'organization'=>$r['organization'],'phone'=>$r['phone'],'email'=>$r['email'],'location'=>$r['location'],'province'=>$r['province'],'service'=>$r['service'],'equipmentInterest'=>$r['equipment_interest'],'intent'=>$r['intent'],'stage'=>$r['stage'],'priority'=>$r['priority'],'dealValue'=>(float)$r['deal_value'],'dealValueDisplay'=>$r['deal_value_display'],'lastContact'=>$r['last_contact'],'nextFollowUp'=>$r['next_follow_up'],'notes'=>$r['notes'],'timeline'=>json_decode($r['timeline_json'] ?: '[]', true)];
  $mapEquipment = fn(array $r): array => ['id'=>$r['id'],'name'=>$r['name'],'category'=>$r['category'],'intent'=>$r['intent'],'blurb'=>$r['blurb'],'image'=>$r['image'],'imageAlt'=>$r['image_alt'],'spec'=>$r['spec'],'badge'=>$r['badge'],'price'=>$r['price'],'priceUSD'=>$r['price_usd'],'priceNote'=>$r['price_note'],'sku'=>$r['sku'],'stockStatus'=>$r['stock_status'],'throughput'=>$r['throughput'],'powerOption'=>$r['power_option'],'condition'=>$r['condition_name'],'warrantyMonths'=>(int)$r['warranty_months'],'detailedNotes'=>$r['detailed_notes'],'gallery'=>json_decode($r['gallery_json'] ?: '[]', true)];
  $mapDeployment = fn(array $r): array => ['id'=>$r['id'],'productId'=>$r['product_id'],'plant'=>$r['plant'],'category'=>$r['category'],'image'=>$r['image'],'sku'=>$r['sku'],'client'=>$r['client_name'],'site'=>$r['site'],'province'=>$r['province'],'operator'=>$r['operator_name'],'rate'=>$r['rate'],'dailyRateUSD'=>(float)$r['daily_rate_usd'],'status'=>$r['status'],'startDate'=>$r['start_date'],'scheduledReturn'=>$r['scheduled_return'],'contractRef'=>$r['contract_ref'],'contactPerson'=>$r['contact_person'],'contactPhone'=>$r['contact_phone'],'notes'=>$r['notes']];
  $mapRecycle = fn(array $r): array => ['binId'=>$r['bin_id'],'kind'=>$r['kind'],'deletedAt'=>$r['deleted_at'],'title'=>$r['title'],'subtitle'=>$r['subtitle'],'snapshot'=>json_decode($r['snapshot_json'] ?: '{}', true)];
  json_response(['ok'=>true,'crm'=>array_map($mapClient,$crm),'equipment'=>array_map($mapEquipment,$equipment),'deployments'=>array_map($mapDeployment,$deployments),'recycle'=>array_map($mapRecycle,$recycle),'siteCopy'=>$copy ? json_decode($copy['content_json'], true) : null,'profile'=>$profile ? ['email'=>$profile['email'],'fullName'=>$profile['full_name'],'role'=>$profile['role'],'phone'=>$profile['phone'],'yardLocation'=>$profile['yard_location']] : null]);
}

if ($action === 'save-crm' && $method === 'POST') {
  $pdo->beginTransaction(); $pdo->exec('DELETE FROM crm_clients');
  $stmt=$pdo->prepare('INSERT INTO crm_clients (id,name,organization,phone,email,location,province,service,equipment_interest,intent,stage,priority,deal_value,deal_value_display,last_contact,next_follow_up,notes,timeline_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  foreach (($body['items'] ?? []) as $v) { $stmt->execute([(string)$v['id'],(string)$v['name'],(string)($v['organization']??''),(string)($v['phone']??''),(string)($v['email']??''),(string)($v['location']??''),(string)($v['province']??''),(string)($v['service']??''),(string)($v['equipmentInterest']??''),(string)($v['intent']??'Buy'),(string)($v['stage']??'Lead'),(string)($v['priority']??'Normal'),(float)($v['dealValue']??0),(string)($v['dealValueDisplay']??'$0'),(string)($v['lastContact']??''),(string)($v['nextFollowUp']??''),(string)($v['notes']??''),json_encode($v['timeline']??[])]); }
  $pdo->commit(); json_response(['ok'=>true]);
}

if ($action === 'save-equipment' && $method === 'POST') {
  $pdo->beginTransaction(); $pdo->exec('DELETE FROM equipment');
  $stmt=$pdo->prepare('INSERT INTO equipment (id,name,category,intent,blurb,image,image_alt,spec,badge,price,price_usd,price_note,sku,stock_status,throughput,power_option,condition_name,warranty_months,detailed_notes,gallery_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  foreach (($body['items'] ?? []) as $v) { $stmt->execute([(string)$v['id'],(string)$v['name'],(string)$v['category'],(string)($v['intent']??'sale'),(string)($v['blurb']??''),(string)($v['image']??''),(string)($v['imageAlt']??''),(string)($v['spec']??''),(string)($v['badge']??''),(string)($v['price']??''),(string)($v['priceUSD']??''),(string)($v['priceNote']??''),(string)($v['sku']??''),(string)($v['stockStatus']??''),(string)($v['throughput']??''),(string)($v['powerOption']??''),(string)($v['condition']??''),(int)($v['warrantyMonths']??0),(string)($v['detailedNotes']??''),json_encode($v['gallery']??[])]); }
  $pdo->commit(); json_response(['ok'=>true]);
}

if ($action === 'save-deployments' && $method === 'POST') {
  $pdo->beginTransaction(); $pdo->exec('DELETE FROM deployments');
  $stmt=$pdo->prepare('INSERT INTO deployments (id,product_id,plant,category,image,sku,client_name,site,province,operator_name,rate,daily_rate_usd,status,start_date,scheduled_return,contract_ref,contact_person,contact_phone,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  foreach (($body['items'] ?? []) as $v) { $stmt->execute([(string)$v['id'],(string)($v['productId']??''),(string)$v['plant'],(string)$v['category'],(string)($v['image']??''),(string)($v['sku']??''),(string)$v['client'],(string)($v['site']??''),(string)($v['province']??''),(string)($v['operator']??''),(string)($v['rate']??''),(float)($v['dailyRateUSD']??0),(string)$v['status'],(string)($v['startDate']??''),(string)($v['scheduledReturn']??''),(string)($v['contractRef']??''),(string)($v['contactPerson']??''),(string)($v['contactPhone']??''),(string)($v['notes']??'')]); }
  $pdo->commit(); json_response(['ok'=>true]);
}

if ($action === 'save-recycle' && $method === 'POST') {
  $pdo->beginTransaction(); $pdo->exec('DELETE FROM recycle_bin');
  $stmt=$pdo->prepare('INSERT INTO recycle_bin (bin_id,kind,deleted_at,title,subtitle,snapshot_json) VALUES (?,?,?,?,?,?)');
  foreach (($body['items'] ?? []) as $v) { $stmt->execute([(string)$v['binId'],(string)$v['kind'],(string)$v['deletedAt'],(string)$v['title'],(string)($v['subtitle']??''),json_encode($v['snapshot']??[])]); }
  $pdo->commit(); json_response(['ok'=>true]);
}

if ($action === 'save-profile' && $method === 'POST') {
  $v=$body['profile'] ?? []; $stmt=$pdo->prepare('UPDATE admin_users SET full_name=?,role=?,phone=?,yard_location=? WHERE id=?'); $stmt->execute([(string)($v['fullName']??''),(string)($v['role']??''),(string)($v['phone']??''),(string)($v['yardLocation']??''),$_SESSION['admin_id']]); json_response(['ok'=>true]);
}

if ($action === 'save-site-copy' && $method === 'POST') {
  $stmt=$pdo->prepare('INSERT INTO site_copy (id,content_json) VALUES (1,?) ON DUPLICATE KEY UPDATE content_json=VALUES(content_json)'); $stmt->execute([json_encode($body['copy']??[])]); json_response(['ok'=>true]);
}

json_response(['ok'=>false,'error'=>'Unknown action'],404);
