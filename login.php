<?php
header("Content-Type: application/json");
require_once "config.php";

$datos = json_decode(file_get_contents("php://input"), true);

$usuario  = trim($datos["usuario"] ?? "");
$password = $datos["password"] ?? "";

if (!$usuario || !$password) {
    echo json_encode(["exito" => false, "mensaje" => "Faltan datos."]);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM usuarios WHERE usuario = ?");
$stmt->execute([$usuario]);
$fila = $stmt->fetch();

if (!$fila || !password_verify($password, $fila["password"])) {
    echo json_encode(["exito" => false, "mensaje" => "Usuario o contraseña incorrectos."]);
    exit;
}

if ((int) $fila["activo"] === 0) {
    echo json_encode(["exito" => false, "mensaje" => "Esta cuenta fue suspendida. Contacta a soporte."]);
    exit;
}

// Login correcto: iniciar sesión con PHP sessions
session_start();
$_SESSION["usuario_id"] = $fila["id"];
$_SESSION["usuario_nombre"] = $fila["nombre"];
$_SESSION["usuario_usuario"] = $fila["usuario"];

echo json_encode(["exito" => true, "mensaje" => "Bienvenido, " . $fila["nombre"]]);