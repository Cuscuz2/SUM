<?php
/**
 * PHP/login.php
 *
 * Inicio de sesión. Lo llama iniciarSesion() de INDEX/Script.js con un JSON
 * { usuario, password } y responde { exito, mensaje }.
 *
 * FLUJO: 1) lee el JSON  2) busca al usuario con una consulta preparada
 * 3) compara la contraseña con password_verify() (en la BD solo se guarda el
 * hash, nunca la contraseña real)  4) revisa que la cuenta no esté suspendida
 * 5) guarda los datos en la sesión de PHP ($_SESSION) y responde.
 */
header("Content-Type: application/json");
require_once "config.php";

// php://input contiene el cuerpo crudo de la petición; json_decode lo convierte en
// arreglo.
$datos = json_decode(file_get_contents("php://input"), true);

$usuario  = trim($datos["usuario"] ?? "");
$password = $datos["password"] ?? "";

if (!$usuario || !$password) {
    echo json_encode(["exito" => false, "mensaje" => "Faltan datos."]);
    exit;
}

// Consulta preparada: el ? se reemplaza de forma segura, evitando inyección SQL.
$stmt = $pdo->prepare("SELECT * FROM usuarios WHERE usuario = ?");
$stmt->execute([$usuario]);
$fila = $stmt->fetch();

// Mismo mensaje si falla el usuario o la contraseña: así no se revela cuál de los dos
// existe.
if (!$fila || !password_verify($password, $fila["password"])) {
    echo json_encode(["exito" => false, "mensaje" => "Usuario o contraseña incorrectos."]);
    exit;
}

if ((int) $fila["activo"] === 0) {
    echo json_encode(["exito" => false, "mensaje" => "Esta cuenta fue suspendida. Contacta a soporte."]);
    exit;
}

// Login correcto: iniciar sesión con PHP sessions
// MEJORA FUTURA: llamar session_regenerate_id(true) aquí para evitar fijación de
// sesión (verificar_admin.php ya lo hace).
session_start();
$_SESSION["usuario_id"] = $fila["id"];
$_SESSION["usuario_nombre"] = $fila["nombre"];
$_SESSION["usuario_usuario"] = $fila["usuario"];

echo json_encode(["exito" => true, "mensaje" => "Bienvenido, " . $fila["nombre"]]);
