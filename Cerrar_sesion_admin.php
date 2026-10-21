<?php
/**
 * PHP/cerrar_sesion_admin.php
 *
 * Quita el permiso de administrador de la sesión actual, pero no cierra
 * la sesión normal del usuario (así puede seguir usando el mapa).
 */

header("Content-Type: application/json");
session_start();

unset($_SESSION["es_admin"]);
echo json_encode(["exito" => true]);