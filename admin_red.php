<?php
/**
 * PHP/admin_red.php
 *
 * Gestión de "Estaciones y líneas" para el panel de administrador.
 * Solo accesible con sesión de administrador activa.
 *
 * GET  -> devuelve todo lo necesario para editar:
 *         { exito, lineas: [ { clave, nombre, tipo, color, estaciones: [ids en orden] } ],
 *                 estaciones: [ { id, nombre, lat, lon, dir } ] }
 *
 * POST (JSON) con { accion: ... }:
 *   guardar_linea    { clave?, nombre, tipo, color, estaciones: [ids en orden] }
 *                    Sin "clave" crea una línea nueva; con "clave" la modifica
 *                    (nombre, tipo, color y recorrido completo, en una sola operación).
 *   eliminar_linea   { clave }
 *   guardar_estacion { id?, nombre, dir, lat, lon }   (sin "id" crea una nueva)
 *   eliminar_estacion{ id }
 *
 * Una estación es un único registro que puede estar en varias líneas: así es
 * como se forman los transbordos. Los cambios se reflejan en el mapa de los
 * usuarios porque mapa.js lee la red desde red.php.
 */

header("Content-Type: application/json");
session_start();
require_once "config.php";

const TIPOS_LINEA = ['metro', 'metrocable', 'metroplus', 'tranvia'];

// mapa.js cobra la tarifa especial de Arví cuando el viaje usa la línea "l".
// Por eso esa línea se puede editar, pero no eliminar.
const LINEA_PROTEGIDA = 'l';

function responder(bool $exito, array $extra = [], int $codigo = 200): void
{
    http_response_code($codigo);
    echo json_encode(array_merge(["exito" => $exito], $extra));
    exit;
}

function error_usuario(string $mensaje, int $codigo = 200): void
{
    responder(false, ["mensaje" => $mensaje], $codigo);
}

if (empty($_SESSION["es_admin"])) {
    error_usuario("Acceso solo para administradores.", 403);
}

/** Convierte "Línea C · Metro" en una clave corta y única: "linea_c_metro". */
function generar_clave(PDO $pdo, string $nombre): string
{
    $sinTildes = strtr(mb_strtolower($nombre, 'UTF-8'), [
        'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n',
    ]);
    $base = trim(preg_replace('/[^a-z0-9]+/', '_', $sinTildes), '_');
    $base = substr($base, 0, 16);
    if ($base === '') $base = 'linea';

    $clave = $base;
    $n = 2;
    $stmt = $pdo->prepare("SELECT 1 FROM lineas WHERE clave = ?");
    while (true) {
        $stmt->execute([$clave]);
        if (!$stmt->fetchColumn()) return $clave;
        $clave = $base . '_' . $n++;
    }
}

try {
    // ------------------------------------------------------------ LISTAR
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $lineas = $pdo->query("SELECT clave, nombre, tipo, color FROM lineas ORDER BY orden, nombre")->fetchAll();
        $recorridos = $pdo->query(
            "SELECT linea_clave, estacion_id FROM linea_estaciones ORDER BY linea_clave, orden"
        )->fetchAll();
        $estaciones = $pdo->query("SELECT id, nombre, lat, lon, dir FROM estaciones ORDER BY nombre")->fetchAll();

        $idsPorLinea = [];
        foreach ($recorridos as $r) {
            $idsPorLinea[$r["linea_clave"]][] = (int) $r["estacion_id"];
        }

        foreach ($lineas as &$l) {
            $l["estaciones"] = $idsPorLinea[$l["clave"]] ?? [];
            $l["protegida"]  = ($l["clave"] === LINEA_PROTEGIDA);
        }
        unset($l);

        foreach ($estaciones as &$e) {
            $e["id"]  = (int) $e["id"];
            $e["lat"] = (float) $e["lat"];
            $e["lon"] = (float) $e["lon"];
        }
        unset($e);

        responder(true, ["lineas" => $lineas, "estaciones" => $estaciones]);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        error_usuario("Método no permitido.", 405);
    }

    $datos  = json_decode(file_get_contents("php://input"), true) ?? [];
    $accion = $datos["accion"] ?? "";

    // ------------------------------------------------------ GUARDAR LÍNEA
    if ($accion === "guardar_linea") {
        $clave  = trim((string) ($datos["clave"] ?? ""));
        $nombre = trim((string) ($datos["nombre"] ?? ""));
        $tipo   = (string) ($datos["tipo"] ?? "");
        $color  = strtolower(trim((string) ($datos["color"] ?? "")));
        $ids    = $datos["estaciones"] ?? [];

        if ($nombre === "" || mb_strlen($nombre) > 80) {
            error_usuario("El nombre de la línea es obligatorio (máximo 80 caracteres).");
        }
        if (!in_array($tipo, TIPOS_LINEA, true)) {
            error_usuario("Elige un tipo de transporte válido.");
        }
        if (!preg_match('/^#[0-9a-f]{6}$/', $color)) {
            error_usuario("El color no es válido.");
        }
        if (!is_array($ids)) {
            error_usuario("El recorrido no es válido.");
        }

        $ids = array_map('intval', array_values($ids));
        if (count($ids) < 2) {
            error_usuario("Un recorrido necesita al menos 2 estaciones.");
        }
        if (count(array_unique($ids)) !== count($ids)) {
            error_usuario("Una estación no puede aparecer dos veces en la misma línea.");
        }
        foreach ($ids as $id) {
            if ($id <= 0) error_usuario("El recorrido contiene una estación inválida.");
        }

        $marcas = implode(",", array_fill(0, count($ids), "?"));
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM estaciones WHERE id IN ($marcas)");
        $stmt->execute($ids);
        if ((int) $stmt->fetchColumn() !== count($ids)) {
            error_usuario("Alguna estación del recorrido ya no existe. Recarga la página.");
        }

        $pdo->beginTransaction();

        if ($clave === "") {
            $clave = generar_clave($pdo, $nombre);
            $orden = (int) $pdo->query("SELECT COALESCE(MAX(orden), 0) + 1 FROM lineas")->fetchColumn();
            $pdo->prepare("INSERT INTO lineas (clave, nombre, tipo, color, orden) VALUES (?, ?, ?, ?, ?)")
                ->execute([$clave, $nombre, $tipo, $color, $orden]);
        } else {
            $existe = $pdo->prepare("SELECT 1 FROM lineas WHERE clave = ?");
            $existe->execute([$clave]);
            if (!$existe->fetchColumn()) {
                $pdo->rollBack();
                error_usuario("Esa línea ya no existe. Recarga la página.");
            }
            $pdo->prepare("UPDATE lineas SET nombre = ?, tipo = ?, color = ? WHERE clave = ?")
                ->execute([$nombre, $tipo, $color, $clave]);
            $pdo->prepare("DELETE FROM linea_estaciones WHERE linea_clave = ?")->execute([$clave]);
        }

        $ins = $pdo->prepare("INSERT INTO linea_estaciones (linea_clave, estacion_id, orden) VALUES (?, ?, ?)");
        foreach ($ids as $i => $id) {
            $ins->execute([$clave, $id, $i + 1]);
        }

        $pdo->commit();
        responder(true, ["clave" => $clave]);
    }

    // ---------------------------------------------------- ELIMINAR LÍNEA
    if ($accion === "eliminar_linea") {
        $clave = trim((string) ($datos["clave"] ?? ""));
        if ($clave === "") error_usuario("Línea no indicada.");
        if ($clave === LINEA_PROTEGIDA) {
            error_usuario("Esta línea tiene la tarifa especial de Arví y no se puede eliminar. Puedes cambiar su nombre o su recorrido.");
        }
        $pdo->prepare("DELETE FROM lineas WHERE clave = ?")->execute([$clave]); // el recorrido se borra en cascada
        responder(true);
    }

    // ------------------------------------------------- GUARDAR ESTACIÓN
    if ($accion === "guardar_estacion") {
        $id     = (int) ($datos["id"] ?? 0);
        $nombre = trim((string) ($datos["nombre"] ?? ""));
        $dir    = trim((string) ($datos["dir"] ?? ""));
        $lat    = $datos["lat"] ?? null;
        $lon    = $datos["lon"] ?? null;

        if ($nombre === "" || mb_strlen($nombre) > 100) {
            error_usuario("El nombre de la estación es obligatorio (máximo 100 caracteres).");
        }
        if (mb_strlen($dir) > 255) {
            error_usuario("La dirección es demasiado larga (máximo 255 caracteres).");
        }
        if (!is_numeric($lat) || !is_numeric($lon)
            || $lat < -90 || $lat > 90 || $lon < -180 || $lon > 180) {
            error_usuario("Marca la ubicación de la estación en el mapa (latitud y longitud válidas).");
        }
        $lat = round((float) $lat, 6);
        $lon = round((float) $lon, 6);

        // El nombre identifica la estación en el buscador y en las rutas: debe ser único.
        $stmt = $pdo->prepare("SELECT id FROM estaciones WHERE nombre = ? AND id <> ?");
        $stmt->execute([$nombre, $id]);
        if ($stmt->fetchColumn()) {
            error_usuario("Ya existe una estación con ese nombre.");
        }

        if ($id > 0) {
            $existe = $pdo->prepare("SELECT 1 FROM estaciones WHERE id = ?");
            $existe->execute([$id]);
            if (!$existe->fetchColumn()) error_usuario("Esa estación ya no existe. Recarga la página.");
            $pdo->prepare("UPDATE estaciones SET nombre = ?, lat = ?, lon = ?, dir = ? WHERE id = ?")
                ->execute([$nombre, $lat, $lon, $dir, $id]);
        } else {
            $pdo->prepare("INSERT INTO estaciones (nombre, lat, lon, dir) VALUES (?, ?, ?, ?)")
                ->execute([$nombre, $lat, $lon, $dir]);
            $id = (int) $pdo->lastInsertId();
        }
        responder(true, ["id" => $id]);
    }

    // ------------------------------------------------ ELIMINAR ESTACIÓN
    if ($accion === "eliminar_estacion") {
        $id = (int) ($datos["id"] ?? 0);
        if ($id <= 0) error_usuario("Estación no indicada.");
        $pdo->prepare("DELETE FROM estaciones WHERE id = ?")->execute([$id]); // se quita de todas las líneas en cascada
        responder(true);
    }

    error_usuario("Acción no reconocida.", 400);

} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log("Error en admin_red.php: " . $e->getMessage());
    error_usuario("No se pudo completar la operación. Verifica que ejecutaste SQL/migracion_red.sql.", 500);
}
