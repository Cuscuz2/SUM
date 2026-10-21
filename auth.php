<?php
/**
 * PHP/auth.php
 *
 * Ayudante compartido por los endpoints que necesitan un usuario con sesión.
 *
 * exigir_usuario_activo() revisa en la base de datos, EN CADA PETICIÓN, que la
 * cuenta siga activa. Así, cuando el administrador suspende a alguien, deja de
 * tener acceso a su perfil, historial y registro de viajes al instante, aunque
 * conserve la cookie de sesión o tenga el mapa cerrado (antes solo se enteraba
 * cuando el mapa abierto consultaba verificar_sesion.php).
 *
 * Requiere que session_start() y config.php ya se hayan ejecutado.
 * Devuelve el id del usuario; si no hay sesión o está suspendido, responde y termina.
 */

function exigir_usuario_activo(PDO $pdo): int
{
    if (!isset($_SESSION["usuario_id"])) {
        http_response_code(401);
        echo json_encode(["exito" => false, "motivo" => "sin_sesion", "mensaje" => "No has iniciado sesión."]);
        exit;
    }

    $usuarioId = (int) $_SESSION["usuario_id"];
    $stmt = $pdo->prepare("SELECT activo FROM usuarios WHERE id = ?");
    $stmt->execute([$usuarioId]);
    $fila = $stmt->fetch();

    if (!$fila || (int) $fila["activo"] === 0) {
        // Cuenta suspendida (o eliminada): se cierra la sesión aquí mismo.
        session_unset();
        session_destroy();
        http_response_code(403);
        echo json_encode([
            "exito"   => false,
            "motivo"  => "suspendida",
            "mensaje" => "Tu cuenta fue suspendida. Contacta a soporte.",
        ]);
        exit;
    }

    return $usuarioId;
}
