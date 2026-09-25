<?php
/**
 * PHP/tarifas.php
 *
 * Devuelve todas las tarifas actuales. No requiere sesión: lo usa
 * mapa.js para llenar los selects de Configuración, y también el
 * panel de administrador para mostrar los valores vigentes.
 */

header("Content-Type: application/json");
require_once "config.php";

$stmt = $pdo->query("SELECT clave, etiqueta, valor FROM tarifas");
$filas = $stmt->fetchAll();

echo json_encode(["exito" => true, "tarifas" => $filas]);