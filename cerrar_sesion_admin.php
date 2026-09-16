<?php
// PHP/cerrar_sesion_admin.php
// Quita los privilegios de administrador de la sesión actual
// (el usuario sigue con su sesión normal, solo deja de ser "admin").

session_start();
header('Content-Type: application/json; charset=utf-8');

unset($_SESSION['es_admin']);
unset($_SESSION['admin_intentos']);

echo json_encode(['exito' => true]);
