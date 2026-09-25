<?php
/**
 * PHP/reportes.php
 *
 * Estadísticas generales de todo el sistema (no de un usuario en particular),
 * para la vista "Reportes y estadísticas" del panel admin.
 */

header("Content-Type: application/json");
session_start();
require_once "config.php";

if (empty($_SESSION["es_admin"])) {
    http_response_code(403);
    echo json_encode(["exito" => false, "mensaje" => "Acceso solo para administradores."]);
    exit;
}

$totalUsuarios = (int) $pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn();

$stmtMes = $pdo->query(
    "SELECT COUNT(*) AS total_viajes, COALESCE(SUM(costo), 0) AS total_ingresos
     FROM viajes
     WHERE YEAR(fecha_hora) = YEAR(CURDATE()) AND MONTH(fecha_hora) = MONTH(CURDATE())"
);
$mes = $stmtMes->fetch();

$estaciones = $pdo->query(
    "SELECT estacion_origen, estacion_destino, COUNT(*) AS veces
     FROM viajes
     GROUP BY estacion_origen, estacion_destino
     ORDER BY veces DESC
     LIMIT 5"
)->fetchAll();

echo json_encode([
    "exito" => true,
    "usuarios_total"  => $totalUsuarios,
    "viajes_mes"       => (int) $mes["total_viajes"],
    "ingresos_mes"     => (int) $mes["total_ingresos"],
    "rutas_frecuentes" => $estaciones,
]);