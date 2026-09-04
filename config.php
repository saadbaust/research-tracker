<?php
/*
 * Database connection (MySQL / MariaDB via XAMPP).
 *
 * XAMPP defaults are already filled in:
 *   host = localhost, user = root, password = "" (empty)
 * If you set a MySQL root password, put it in $DB_PASS below.
 */

$DB_HOST = 'localhost';
$DB_NAME = 'research_tracker';
$DB_USER = 'root';
$DB_PASS = '';            // <-- XAMPP default is empty. Change only if you set a password.

function get_db() {
    global $DB_HOST, $DB_NAME, $DB_USER, $DB_PASS;
    $dsn = "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4";
    return new PDO($dsn, $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}
