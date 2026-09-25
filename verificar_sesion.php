<?php
/**
 * PHP/verificar_sesion.php
 *
 * mapa.js llama esto cada cierto tiempo mientras el usuario está usando
 * el mapa. Si el admin suspendió esta cuenta mientras la persona seguía
 * navegando, aquí se detecta y se cierra la sesión de inmediato.
 */

header("Content-Type: application/json");
session_start();

if (!isset($_SESSION["usuario_id"])) {
    // No hay sesión de usuario (pudo haber cerrado sesión ya, o nunca inició).
    echo json_encode(["exito" => false, "motivo" => "sin_sesion", "mensaje" => "No hay sesión activa."]);
    exit;
}

require_once "config.php";

$usuarioId = (int) $_SESSION["usuario_id"];
$stmt = $pdo->prepare("SELECT activo FROM usuarios WHERE id = ?");
$stmt->execute([$usuarioId]);
$fila = $stmt->fetch();

if (!$fila || (int) $fila["activo"] === 0) {
    // Cuenta suspendida (o eliminada): se cierra la sesión aquí mismo.
    session_unset();
    session_destroy();
    echo json_encode(["exito" => false, "motivo" => "suspendida", "mensaje" => "Tu cuenta fue suspendida. Contacta a soporte."]);
    exit;
}

echo json_encode(["exito" => true]);