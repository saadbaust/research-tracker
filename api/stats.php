<?php
/* Counts per status. GET api/stats.php */

require_once __DIR__ . '/../config.php';
header('Content-Type: application/json');

$VALID_STATUS = ['Drafting', 'Submitted', 'Under Review', 'Accepted', 'Rejected'];

try {
    $pdo  = get_db();
    $rows = $pdo->query("SELECT status, COUNT(*) AS n FROM papers GROUP BY status")->fetchAll();

    $result = [];
    foreach ($VALID_STATUS as $s) $result[$s] = 0;
    $result['Total'] = 0;

    foreach ($rows as $r) {
        $result[$r['status']] = intval($r['n']);
        $result['Total']     += intval($r['n']);
    }
    echo json_encode($result);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
