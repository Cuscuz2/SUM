<?php
/**
 * PHP/perfil.php
 *
 * Devuelve la información de la cuenta del usuario en sesión
 * (nombre, usuario, correo y foto) para el mini-perfil de la
 * barra lateral y la vista "Usuario".
 */

header("Content-Type: application/json");
session_start();
require_once "config.php";

if (!isset($_SESSION["usuario_id"])) {
    http_response_code(401);
    echo json_encode(["exito" => false, "mensaje" => "No has iniciado sesión."]);
    exit;
}

$usuarioId = (int) $_SESSION["usuario_id"];

$stmt = $pdo->prepare("SELECT id, nombre, usuario, email, foto FROM usuarios WHERE id = ?");
$stmt->execute([$usuarioId]);
$fila = $stmt->fetch();

if (!$fila) {
    http_response_code(404);
    echo json_encode(["exito" => false, "mensaje" => "Usuario no encontrado."]);
    exit;
}

// "foto" se guarda en la BD solo como nombre de archivo (ej. "3_1699999999.jpg").
// Aquí se construye la URL relativa para usarla directo en un <img src="...">.
$fotoUrl = $fila["foto"] ? "../uploads/perfiles/" . $fila["foto"] : null;

echo json_encode([
    "exito"   => true,
    "usuario" => [
        "id"       => $fila["id"],
        "nombre"   => $fila["nombre"],
        "usuario"  => $fila["usuario"],
        "email"    => $fila["email"],
        "foto_url" => $fotoUrl,
    ],
]);