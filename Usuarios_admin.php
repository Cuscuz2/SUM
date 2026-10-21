<?php
/**
 * PHP/usuarios_admin.php
 *
 * Lista todos los usuarios registrados, para la tabla "Usuarios registrados"
 * del panel admin. Solo accesible con sesión de administrador activa.
 */

header("Content-Type: application/json");
session_start();
require_once "config.php";

if (empty($_SESSION["es_admin"])) {
    http_response_code(403);
    echo json_encode(["exito" => false, "mensaje" => "Acceso solo para administradores."]);
    exit;
}

$stmt = $pdo->query(
    "SELECT id, nombre, usuario, email, activo, creado_en
     FROM usuarios
     ORDER BY creado_en DESC"
);
$usuarios = $stmt->fetchAll();

echo json_encode(["exito" => true, "usuarios" => $usuarios]);