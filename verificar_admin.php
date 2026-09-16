<?php
// PHP/verificar_admin.php
// Valida la contraseña de administrador enviada desde el modal de
// "Ingresar como administrador" en Configuración.

session_start();
header('Content-Type: application/json; charset=utf-8');

// --- Contraseña de administrador ---
// Puedes cambiarla por la que quieras. Idealmente muévela luego a una
// variable de entorno o a tu base de datos en vez de dejarla aquí escrita.
define('ADMIN_PASSWORD', 'SUM-Metro2026*');

// --- Lee el body JSON enviado por mapa.js ---
$body = json_decode(file_get_contents('php://input'), true);
$password = isset($body['password']) ? (string) $body['password'] : '';

if ($password === '') {
    echo json_encode(['exito' => false, 'mensaje' => 'Falta la contraseña.']);
    exit;
}

// --- Límite de intentos fallidos por sesión ---
if (!isset($_SESSION['admin_intentos'])) {
    $_SESSION['admin_intentos'] = 0;
}
if ($_SESSION['admin_intentos'] >= 5) {
    echo json_encode(['exito' => false, 'mensaje' => 'Demasiados intentos. Intenta más tarde.']);
    exit;
}

// hash_equals compara en tiempo constante, evitando ataques de temporización
if (hash_equals(ADMIN_PASSWORD, $password)) {
    // Contraseña correcta: marca la sesión como administrador
    $_SESSION['es_admin'] = true;
    $_SESSION['admin_intentos'] = 0;
    echo json_encode(['exito' => true]);
} else {
    $_SESSION['admin_intentos']++;
    echo json_encode(['exito' => false, 'mensaje' => 'Contraseña incorrecta.']);
}
