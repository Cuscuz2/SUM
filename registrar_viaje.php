<?php
/**
 * PHP/registrar_viaje.php
 *
 * Guarda un viaje del usuario que tiene sesión iniciada (login.php o registro.php
 * ya dejaron $_SESSION["usuario_id"] listo). Se llama desde mapa.js cada vez que
 * el usuario pulsa "Iniciar Navegación" y se encuentra una ruta válida.
 */

header("Content-Type: application/json");
session_start();
require_once "config.php";

if (!isset($_SESSION["usuario_id"])) {
    http_response_code(401);
    echo json_encode(["exito" => false, "mensaje" => "No has iniciado sesión."]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["exito" => false, "mensaje" => "Método no permitido."]);
    exit;
}

$usuarioId = (int) $_SESSION["usuario_id"];
$datos = json_decode(file_get_contents("php://input"), true) ?? [];

$origen  = trim((string) ($datos["origen"]  ?? ""));
$destino = trim((string) ($datos["destino"] ?? ""));
$linea   = trim((string) ($datos["linea"]   ?? ""));
$minutos = (int) ($datos["minutos"] ?? 0);
$costo   = (int) ($datos["costo"]   ?? 0);

if ($origen === "" || $destino === "" || $minutos <= 0 || $costo <= 0) {
    http_response_code(400);
    echo json_encode(["exito" => false, "mensaje" => "Datos de viaje incompletos."]);
    exit;
}

$stmt = $pdo->prepare(
    "INSERT INTO viajes (usuario_id, estacion_origen, estacion_destino, linea, duracion_min, costo, fecha_hora)
     VALUES (?, ?, ?, ?, ?, ?, NOW())"
);
$stmt->execute([$usuarioId, $origen, $destino, $linea, $minutos, $costo]);

echo json_encode(["exito" => true, "id" => $pdo->lastInsertId()]);
