<?php
/**
 * PHP/actualizar_tarifas.php
 *
 * Guarda los nuevos valores de tarifas que el administrador edita
 * en el panel. Solo accesible con sesión de administrador activa.
 *
 * Espera un POST en JSON: { "tarifas": { "frecuente": 3820, "estudiantil": 1600, ... } }
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
$tarifas = $datos["tarifas"] ?? [];

if (!is_array($tarifas) || empty($tarifas)) {
    echo json_encode(["exito" => false, "mensaje" => "No se recibieron tarifas para actualizar."]);
    exit;
}

$stmt = $pdo->prepare("UPDATE tarifas SET valor = ? WHERE clave = ?");
foreach ($tarifas as $clave => $valor) {
    $valor = (int) $valor;
    if ($valor <= 0) continue; // ignora valores inválidos, no rompe el resto
    $stmt->execute([$valor, $clave]);
}

echo json_encode(["exito" => true, "mensaje" => "Tarifas actualizadas."]);