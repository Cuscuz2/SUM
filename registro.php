<?php
header("Content-Type: application/json");
require_once "config.php";

$datos = json_decode(file_get_contents("php://input"), true);

$nombre   = trim($datos["nombre"] ?? "");
$email    = trim($datos["email"] ?? "");
$password = $datos["password"] ?? "";
$confirm  = $datos["confirmPassword"] ?? "";

if (!$nombre || !$email || !$password) {
    echo json_encode(["exito" => false, "mensaje" => "Faltan datos."]);
    exit;
}

if ($password !== $confirm) {
    echo json_encode(["exito" => false, "mensaje" => "Las contraseñas no coinciden."]);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode(["exito" => false, "mensaje" => "La contraseña debe tener al menos 6 caracteres."]);
    exit;
}

// Verificar si el correo ya existe
$stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    echo json_encode(["exito" => false, "mensaje" => "Ese correo ya está registrado."]);
    exit;
}

// Guardar el usuario con la contraseña hasheada (NUNCA en texto plano)
$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare("INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)");
$stmt->execute([$nombre, $email, $hash]);

echo json_encode(["exito" => true, "mensaje" => "Usuario registrado con éxito."]);
