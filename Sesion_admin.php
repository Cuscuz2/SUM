<?php
/**
 * PHP/sesion_admin.php
 *
 * admin.js llama a este endpoint apenas carga la página del panel.
 * Si $_SESSION["es_admin"] no está activo, devuelve exito:false y
 * admin.js redirige de vuelta a mapa.html.
 */

header("Content-Type: application/json");
session_start();

echo json_encode(["exito" => isset($_SESSION["es_admin"]) && $_SESSION["es_admin"] === true]);