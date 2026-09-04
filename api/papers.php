<?php
/*
 * Papers REST endpoint.
 *   GET    api/papers.php              -> list (optional ?status=...)
 *   POST   api/papers.php             -> create   (JSON body)
 *   PUT    api/papers.php?id=<id>     -> update   (JSON body)
 *   DELETE api/papers.php?id=<id>     -> delete
 */

require_once __DIR__ . '/../config.php';
header('Content-Type: application/json');

$VALID_STATUS = ['Drafting', 'Submitted', 'Under Review', 'Accepted', 'Rejected'];
$VALID_TYPE   = ['Journal', 'Conference'];

function clean($v) {
    if ($v === null) return null;
    $v = trim((string)$v);
    return $v === '' ? null : $v;
}

try {
    $pdo = get_db();
    $method = $_SERVER['REQUEST_METHOD'];

    // ---- READ ----
    if ($method === 'GET') {
        $status = $_GET['status'] ?? null;
        if ($status && in_array($status, $VALID_STATUS, true)) {
            $stmt = $pdo->prepare(
                "SELECT * FROM papers WHERE status = ?
                 ORDER BY COALESCE(deadline, '9999-12-31'), created_at DESC"
            );
            $stmt->execute([$status]);
        } else {
            $stmt = $pdo->query(
                "SELECT * FROM papers
                 ORDER BY COALESCE(deadline, '9999-12-31'), created_at DESC"
            );
        }
        echo json_encode($stmt->fetchAll());
        exit;
    }

    // body for POST / PUT
    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    // ---- CREATE ----
    if ($method === 'POST') {
        $title = clean($data['title'] ?? null);
        if (!$title) { http_response_code(400); echo json_encode(['error' => 'Title is required.']); exit; }

        $type   = in_array($data['type']   ?? '', $VALID_TYPE,   true) ? $data['type']   : 'Journal';
        $status = in_array($data['status'] ?? '', $VALID_STATUS, true) ? $data['status'] : 'Drafting';

        $stmt = $pdo->prepare(
            "INSERT INTO papers (title, authors, venue, type, status, deadline, link, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $title,
            clean($data['authors']  ?? null),
            clean($data['venue']    ?? null),
            $type, $status,
            clean($data['deadline'] ?? null),
            clean($data['link']     ?? null),
            clean($data['notes']    ?? null),
        ]);
        $id  = $pdo->lastInsertId();
        $row = $pdo->prepare("SELECT * FROM papers WHERE id = ?");
        $row->execute([$id]);
        http_response_code(201);
        echo json_encode($row->fetch());
        exit;
    }

    // ---- UPDATE ----
    if ($method === 'PUT') {
        $id = intval($_GET['id'] ?? 0);
        $title = clean($data['title'] ?? null);
        if (!$title) { http_response_code(400); echo json_encode(['error' => 'Title is required.']); exit; }

        $type   = in_array($data['type']   ?? '', $VALID_TYPE,   true) ? $data['type']   : 'Journal';
        $status = in_array($data['status'] ?? '', $VALID_STATUS, true) ? $data['status'] : 'Drafting';

        $stmt = $pdo->prepare(
            "UPDATE papers SET
               title=?, authors=?, venue=?, type=?, status=?, deadline=?, link=?, notes=?
             WHERE id=?"
        );
        $stmt->execute([
            $title,
            clean($data['authors']  ?? null),
            clean($data['venue']    ?? null),
            $type, $status,
            clean($data['deadline'] ?? null),
            clean($data['link']     ?? null),
            clean($data['notes']    ?? null),
            $id,
        ]);
        $row = $pdo->prepare("SELECT * FROM papers WHERE id = ?");
        $row->execute([$id]);
        $paper = $row->fetch();
        if (!$paper) { http_response_code(404); echo json_encode(['error' => 'Not found']); exit; }
        echo json_encode($paper);
        exit;
    }

    // ---- DELETE ----
    if ($method === 'DELETE') {
        $id = intval($_GET['id'] ?? 0);
        $stmt = $pdo->prepare("DELETE FROM papers WHERE id = ?");
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) { http_response_code(404); echo json_encode(['error' => 'Not found']); exit; }
        echo json_encode(['deleted' => $id]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
