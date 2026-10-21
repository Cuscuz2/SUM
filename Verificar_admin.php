<?php
/**
 * PHP/verificar_admin.php
 *
 * Recibe { password } por POST y lo compara contra el hash guardado
 * en admin_config. Si coincide, marca $_SESSION["es_admin"] = true.
 *
 * BLOQUEO POR INTENTOS: después de MAX_INTENTOS contraseñas incorrectas desde
 * la misma IP, esa IP queda bloqueada MINUTOS_BLOQUEO minutos (aunque acierte
 * la contraseña durante ese tiempo). Los intentos se guardan en la tabla
 * admin_intentos (ver SQL/migracion_red.sql) y toda la cuenta de tiempo la hace
 * MySQL con NOW(), para no depender de la zona horaria de PHP.
 *
 * Nunca confirma ni expone la contraseña real, solo { exito: true/false }.
 */

header("Content-Type: application/json");
session_start();
require_once "config.php";

const MAX_INTENTOS    = 5;   // fallos permitidos antes de bloquear
const MINUTOS_BLOQUEO = 15;  // duración del bloqueo (y ventana para contar fallos)

function responder_bloqueo(int $segundos): void
{
    $minutos = max(1, (int) ceil($segundos / 60));
    http_response_code(429);
    echo json_encode([
        "exito"     => false,
        "bloqueado" => true,
        "segundos"  => $segundos,
        "mensaje"   => "Demasiados intentos fallidos. Intenta de nuevo en $minutos "
                       . ($minutos === 1 ? "minuto." : "minutos."),
    ]);
    exit;
}

$datos = json_decode(file_get_contents("php://input"), true) ?? [];
$password = $datos["password"] ?? "";

if (!is_string($password) || $password === "") {
    echo json_encode(["exito" => false, "mensaje" => "Ingresa la contraseña."]);
    exit;
}

$ip = substr($_SERVER["REMOTE_ADDR"] ?? "desconocida", 0, 45);

try {
    // Estado actual de esta IP: intentos, segundos de bloqueo que le quedan y
    // minutos desde su último intento (para reiniciar la cuenta al pasar la ventana).
    $stmt = $pdo->prepare(
        "SELECT intentos,
                COALESCE(GREATEST(TIMESTAMPDIFF(SECOND, NOW(), bloqueado_hasta), 0), 0) AS segundos_bloqueo,
                TIMESTAMPDIFF(MINUTE, ultimo_intento, NOW()) AS minutos_desde_ultimo
         FROM admin_intentos
         WHERE ip = ?"
    );
    $stmt->execute([$ip]);
    $estado = $stmt->fetch();

    if ($estado && (int) $estado["segundos_bloqueo"] > 0) {
        responder_bloqueo((int) $estado["segundos_bloqueo"]);
    }

    $intentosPrevios = 0;
    if ($estado && (int) $estado["minutos_desde_ultimo"] < MINUTOS_BLOQUEO) {
        $intentosPrevios = (int) $estado["intentos"];
    }

    $stmt = $pdo->prepare("SELECT password_hash FROM admin_config WHERE id = 1");
    $stmt->execute();
    $fila = $stmt->fetch();

    if ($fila && password_verify($password, $fila["password_hash"])) {
        // Acierto: se limpia el historial de fallos y se abre la sesión de admin.
        $pdo->prepare("DELETE FROM admin_intentos WHERE ip = ?")->execute([$ip]);
        session_regenerate_id(true); // evita fijación de sesión al subir de privilegio
        $_SESSION["es_admin"] = true;
        echo json_encode(["exito" => true]);
        exit;
    }

    // Fallo: se suma el intento y, si llega al límite, se bloquea la IP.
    $intentos = $intentosPrevios + 1;
    if ($intentos >= MAX_INTENTOS) {
        $pdo->prepare(
            "REPLACE INTO admin_intentos (ip, intentos, ultimo_intento, bloqueado_hasta)
             VALUES (?, ?, NOW(), NOW() + INTERVAL " . (int) MINUTOS_BLOQUEO . " MINUTE)"
        )->execute([$ip, $intentos]);
        responder_bloqueo(MINUTOS_BLOQUEO * 60);
    }

    $pdo->prepare(
        "REPLACE INTO admin_intentos (ip, intentos, ultimo_intento, bloqueado_hasta)
         VALUES (?, ?, NOW(), NULL)"
    )->execute([$ip, $intentos]);

    $restantes = MAX_INTENTOS - $intentos;
    echo json_encode([
        "exito"               => false,
        "intentos_restantes"  => $restantes,
        "mensaje"             => "Contraseña incorrecta. Te quedan $restantes "
                                 . ($restantes === 1 ? "intento." : "intentos."),
    ]);
} catch (Throwable $e) {
    error_log("Error en verificar_admin.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "exito"   => false,
        "mensaje" => "No se pudo validar el acceso. Verifica que ejecutaste SQL/migracion_red.sql.",
    ]);
}
