<?php
/**
 * PHP/historial.php
 *
 * Devuelve el historial de viajes del usuario en sesión y las
 * estadísticas del mes en curso (viajes, minutos y costo acumulados).
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

// Últimos 50 viajes del usuario, del más reciente al más antiguo.
$stmtLista = $pdo->prepare(
    "SELECT estacion_origen, estacion_destino, linea, duracion_min, costo, fecha_hora
     FROM viajes
     WHERE usuario_id = ?
     ORDER BY fecha_hora DESC
     LIMIT 50"
);
$stmtLista->execute([$usuarioId]);
$viajes = $stmtLista->fetchAll();

// Estadísticas acumuladas del mes actual.
$stmtStats = $pdo->prepare(
    "SELECT COUNT(*)                       AS total_viajes,
            COALESCE(SUM(duracion_min), 0) AS total_minutos,
            COALESCE(SUM(costo), 0)        AS total_costo
     FROM viajes
     WHERE usuario_id = ?
       AND YEAR(fecha_hora)  = YEAR(CURDATE())
       AND MONTH(fecha_hora) = MONTH(CURDATE())"
);
$stmtStats->execute([$usuarioId]);
$stats = $stmtStats->fetch();

echo json_encode([
    "exito"  => true,
    "viajes" => $viajes,
    "stats"  => [
        "viajes_mes"  => (int) $stats["total_viajes"],
        "minutos_mes" => (int) $stats["total_minutos"],
        "costo_mes"   => (int) $stats["total_costo"],
    ],
]);
