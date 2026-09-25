<?php
/**
 * PHP/actualizar_perfil.php
 *
 * Guarda los cambios que el usuario hace en la vista "Usuario":
 * nombre completo, nombre de usuario, correo y, opcionalmente,
 * una nueva foto de perfil.
 *
 * Se llama por POST con multipart/form-data (por el archivo de la foto),
 * así que los datos llegan en $_POST y $_FILES, no en json_decode(php://input).
 */

header("Content-Type: application/json");
session_start();
require_once "config.php";

// Exige sesión Y cuenta activa (si el admin la suspendió, se corta aquí).
require_once "auth.php";
$usuarioId = exigir_usuario_activo($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["exito" => false, "mensaje" => "Método no permitido."]);
    exit;
}


$nombre  = trim($_POST["nombre"] ?? "");
$usuario = trim($_POST["usuario"] ?? "");
$email   = trim($_POST["email"] ?? "");

if ($nombre === "" || $usuario === "" || $email === "") {
    http_response_code(400);
    echo json_encode(["exito" => false, "mensaje" => "Nombre, usuario y correo son obligatorios."]);
    exit;
}

// El nombre de usuario no puede tener espacios (mismo criterio que registro.php)
if (preg_match('/\s/', $usuario)) {
    echo json_encode(["exito" => false, "mensaje" => "El nombre de usuario no puede contener espacios."]);
    exit;
}

// Correo y usuario deben seguir siendo únicos (excluyendo al propio usuario).
$stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ? AND id != ?");
$stmt->execute([$email, $usuarioId]);
if ($stmt->fetch()) {
    echo json_encode(["exito" => false, "mensaje" => "Ese correo ya está en uso por otra cuenta."]);
    exit;
}

$stmt = $pdo->prepare("SELECT id FROM usuarios WHERE usuario = ? AND id != ?");
$stmt->execute([$usuario, $usuarioId]);
if ($stmt->fetch()) {
    echo json_encode(["exito" => false, "mensaje" => "Ese nombre de usuario ya está en uso."]);
    exit;
}

// ---------- Foto de perfil (opcional) ----------
$nombreFoto = null;
if (!empty($_FILES['foto']['name']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
    $archivo = $_FILES['foto'];

    $tiposPermitidos = ['image/jpeg' => 'jpg', 'image/png' => 'png'];
    $tipoReal = mime_content_type($archivo['tmp_name']);

    if (!isset($tiposPermitidos[$tipoReal])) {
        echo json_encode(["exito" => false, "mensaje" => "La foto debe ser JPG o PNG."]);
        exit;
    }
    if ($archivo['size'] > 2 * 1024 * 1024) {
        echo json_encode(["exito" => false, "mensaje" => "La foto debe pesar máximo 2MB."]);
        exit;
    }

    $carpetaDestino = __DIR__ . '/../uploads/perfiles/';
    if (!is_dir($carpetaDestino)) {
        mkdir($carpetaDestino, 0755, true);
    }

    $nombreFoto = $usuarioId . '_' . time() . '.' . $tiposPermitidos[$tipoReal];
    $rutaDestino = $carpetaDestino . $nombreFoto;

    if (!move_uploaded_file($archivo['tmp_name'], $rutaDestino)) {
        echo json_encode(["exito" => false, "mensaje" => "No se pudo guardar la foto."]);
        exit;
    }

    // Borra la foto anterior del disco (si existía) para no acumular archivos.
    $stmt = $pdo->prepare("SELECT foto FROM usuarios WHERE id = ?");
    $stmt->execute([$usuarioId]);
    $fotoAnterior = $stmt->fetchColumn();
    if ($fotoAnterior && file_exists($carpetaDestino . $fotoAnterior)) {
        unlink($carpetaDestino . $fotoAnterior);
    }
}

// ---------- Actualizar la base de datos ----------
if ($nombreFoto !== null) {
    $stmt = $pdo->prepare("UPDATE usuarios SET nombre = ?, usuario = ?, email = ?, foto = ? WHERE id = ?");
    $stmt->execute([$nombre, $usuario, $email, $nombreFoto, $usuarioId]);
} else {
    $stmt = $pdo->prepare("UPDATE usuarios SET nombre = ?, usuario = ?, email = ? WHERE id = ?");
    $stmt->execute([$nombre, $usuario, $email, $usuarioId]);
}

// Mantiene la sesión sincronizada (login.php la usa para el saludo, etc.)
$_SESSION["usuario_nombre"] = $nombre;
$_SESSION["usuario_usuario"] = $usuario;

$stmt = $pdo->prepare("SELECT foto FROM usuarios WHERE id = ?");
$stmt->execute([$usuarioId]);
$fotoActual = $stmt->fetchColumn();

echo json_encode([
    "exito"   => true,
    "usuario" => [
        "nombre"   => $nombre,
        "usuario"  => $usuario,
        "foto_url" => $fotoActual ? "../uploads/perfiles/" . $fotoActual : null,
    ],
]);