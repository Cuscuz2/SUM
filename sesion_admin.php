<?php
// PHP/sesion_admin.php
// Confirma si la sesión actual ya validó la contraseña de administrador
// (usado por admin.js al cargar admin.html, para que nadie entre solo
// escribiendo la URL sin haber pasado por el modal de contraseña).

session_start();
header('Content-Type: application/json; charset=utf-8');

$esAdmin = isset($_SESSION['es_admin']) && $_SESSION['es_admin'] === true;

echo json_encode(['exito' => $esAdmin]);
