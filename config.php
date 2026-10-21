<?php
/**
 * PHP/config.php
 *
 * Conexión a la base de datos MySQL. TODOS los demás PHP lo incluyen con
 * require_once "config.php" y usan la variable $pdo que se crea aquí.
 *
 * PDO es la forma moderna y segura de hablar con la base de datos: junto con
 * las consultas preparadas (prepare + execute) evita la inyección SQL.
 *
 * Opciones usadas:
 *  - ERRMODE_EXCEPTION: los errores de SQL lanzan excepciones que se pueden atrapar.
 *  - FETCH_ASSOC: cada fila llega como arreglo con los nombres de las columnas.
 *  - EMULATE_PREPARES = false: usa consultas preparadas reales de MySQL.
 *
 * MEJORA PARA PRODUCCIÓN: no usar el usuario root sin contraseña (solo es válido
 * en XAMPP local) y no mostrar $e->getMessage() al usuario, porque puede revelar
 * datos internos del servidor.
 */
// Datos de conexión a MySQL (XAMPP por defecto: usuario "root", sin contraseña)
$host = "127.0.0.1"; // IP directa: evita la demora de resolver localhost (IPv6) en Windows
$db   = "sum";
$user = "root";
$pass = "";
$charset = "utf8mb4";

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

$opciones = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $opciones);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["exito" => false, "mensaje" => "Error de conexión: " . $e->getMessage()]);
    exit;
}
