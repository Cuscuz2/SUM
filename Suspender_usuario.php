<?php
/**
 * PHP/suspender_usuario.php
 *
 * Activa o suspende la cuenta de un usuario. Un usuario suspendido
 * no puede volver a iniciar sesión (login.php revisa la columna "activo").
 * Solo accesible con sesión de administrador activa.
 *
 * Espera un POST en JSON: { "usuario_id": 25, "activo": 0 }  (0 = suspender, 1 = activar)
 */

header("Content-Type: application/json");
session_start();
require_once "config.php";

if (empty($_SESSION["es_admin"])) {
    http_response_code(403);
    echo json_encode(["exito" => false, "mensaje" => "Acceso solo para administradores."]);
    exit;
}

$datos = json_decode(file_get_contents("php://input"), true) ?? [];
$usuarioId = (int) ($datos["usuario_id"] ?? 0);
$activo = isset($datos["activo"]) ? (int) $datos["activo"] : null;

if ($usuarioId <= 0 || !in_array($activo, [0, 1], true)) {
    echo json_encode(["exito" => false, "mensaje" => "Datos inválidos."]);
    exit;
}

$stmt = $pdo->prepare("UPDATE usuarios SET activo = ? WHERE id = ?");
$stmt->execute([$activo, $usuarioId]);

echo json_encode(["exito" => true]);