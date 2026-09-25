<?php
/**
 * PHP/avisos.php
 *
 * GET  -> lista los últimos avisos (público, para poder mostrarlos a los usuarios más adelante).
 * POST -> crea un nuevo aviso (solo administrador).
 */

header("Content-Type: application/json");
session_start();
require_once "config.php";

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query("SELECT id, titulo, mensaje, destino, creado_en FROM avisos ORDER BY creado_en DESC LIMIT 20");
    echo json_encode(["exito" => true, "avisos" => $stmt->fetchAll()]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (empty($_SESSION["es_admin"])) {
        http_response_code(403);
        echo json_encode(["exito" => false, "mensaje" => "Acceso solo para administradores."]);
        exit;
    }

    $datos = json_decode(file_get_contents("php://input"), true) ?? [];
    $titulo  = trim($datos["titulo"] ?? "");
    $mensaje = trim($datos["mensaje"] ?? "");
    $destino = trim($datos["destino"] ?? "todos");

    if ($titulo === "" || $mensaje === "") {
        echo json_encode(["exito" => false, "mensaje" => "El título y el mensaje son obligatorios."]);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO avisos (titulo, mensaje, destino, creado_en) VALUES (?, ?, ?, NOW())");
    $stmt->execute([$titulo, $mensaje, $destino]);

    echo json_encode(["exito" => true, "id" => $pdo->lastInsertId()]);
    exit;
}

http_response_code(405);
echo json_encode(["exito" => false, "mensaje" => "Método no permitido."]);