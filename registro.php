<?php
/**
 * PHP/registro.php
 *
 * Registro de un usuario nuevo. Lo llama registrarUsuario() de INDEX/Script.js
 * con un JSON { nombre, usuario, email, password, confirmPassword }.
 *
 * FLUJO: 1) valida datos  2) comprueba que el correo y el usuario no existan
 * 3) guarda la contraseña como hash con password_hash()  4) inicia sesión
 * automáticamente para que el usuario llegue al mapa ya autenticado.
 *
 * NOTA: el servidor exige 6 o más caracteres, mientras que el formulario exige
 * 9 o más con mayúscula, minúscula, número y símbolo. Las reglas más fuertes
 * viven solo en el navegador; para igualarlas habría que repetirlas aquí.
 */
header("Content-Type: application/json");
require_once "config.php";

// El servidor NUNCA confía en el navegador: vuelve a validar todo lo que llega.
$datos = json_decode(file_get_contents("php://input"), true);

$nombre   = trim($datos["nombre"] ?? "");
$usuario  = trim($datos["usuario"] ?? "");
$email    = trim($datos["email"] ?? "");
$password = $datos["password"] ?? "";
$confirm  = $datos["confirmPassword"] ?? "";

if (!$nombre || !$usuario || !$email || !$password) {
    echo json_encode(["exito" => false, "mensaje" => "Faltan datos."]);
    exit;
}

// Las dos contraseñas deben coincidir.
if ($password !== $confirm) {
    echo json_encode(["exito" => false, "mensaje" => "Las contraseñas no coinciden."]);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode(["exito" => false, "mensaje" => "La contraseña debe tener al menos 6 caracteres."]);
    exit;
}

try {
    // Verificar si el correo ya existe
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(["exito" => false, "mensaje" => "Ese correo ya está registrado."]);
        exit;
    }

    // Verificar si el nombre de usuario ya existe
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE usuario = ?");
    $stmt->execute([$usuario]);
    if ($stmt->fetch()) {
        echo json_encode(["exito" => false, "mensaje" => "Ese nombre de usuario ya está en uso."]);
        exit;
    }

    // Guardar el usuario con la contraseña hasheada (NUNCA en texto plano)
    // password_hash() usa un algoritmo seguro con sal aleatoria; en la tabla usuarios solo
    // queda este hash.
    $hash = password_hash($password, PASSWORD_DEFAULT);
    // INSERT preparado: los datos van como parámetros (?), no pegados al texto SQL.
    $stmt = $pdo->prepare("INSERT INTO usuarios (nombre, usuario, email, password) VALUES (?, ?, ?, ?)");
    $stmt->execute([$nombre, $usuario, $email, $hash]);

    // Iniciar sesión automáticamente, igual que en login.php,
    // para que el usuario quede autenticado al llegar a mapa.html
    session_start();
    $_SESSION["usuario_id"] = $pdo->lastInsertId();
    $_SESSION["usuario_nombre"] = $nombre;
    $_SESSION["usuario_usuario"] = $usuario;

    echo json_encode(["exito" => true, "mensaje" => "Usuario registrado con éxito."]);

} catch (Throwable $e) {
    error_log("Error en registro.php: " . $e->getMessage());
    echo json_encode(["exito" => false, "mensaje" => "Ocurrió un error al registrar. Intenta de nuevo."]);
}
