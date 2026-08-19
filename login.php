<?php
header("Content-Type: application/json");
require_once "config.php";

$datos = json_decode(file_get_contents("php://input"), true);

$email    = trim($datos["email"] ?? "");
$password = $datos["password"] ?? "";

if (!$email || !$password) {
    echo json_encode(["exito" => false, "mensaje" => "Faltan datos."]);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
$stmt->execute([$email]);
$usuario = $stmt->fetch();

if (!$usuario || !password_verify($password, $usuario["password"])) {
    echo json_encode(["exito" => false, "mensaje" => "Correo o contraseña incorrectos."]);
    exit;
}

// Login correcto: iniciar sesión con PHP sessions
session_start();
$_SESSION["usuario_id"] = $usuario["id"];
$_SESSION["usuario_nombre"] = $usuario["nombre"];

echo json_encode(["exito" => true, "mensaje" => "Bienvenido, " . $usuario["nombre"]]);
