<?php
/**
 * PHP/red.php
 *
 * Devuelve la red de transporte completa (líneas y sus estaciones en orden)
 * tal como el administrador la dejó en "Estaciones y líneas". Es público:
 * mapa.js lo llama al cargar para dibujar el mapa y armar el buscador.
 *
 * Respuesta:
 *   { exito: true, lineas: [ { clave, nombre, tipo, color,
 *                              estaciones: [ { id, nombre, lat, lon, dir }, ... ] }, ... ] }
 *
 * Las líneas con menos de 2 estaciones se omiten (todavía no son un recorrido).
 */

header("Content-Type: application/json");
require_once "config.php";

try {
    $lineas = $pdo->query(
        "SELECT clave, nombre, tipo, color FROM lineas ORDER BY orden, nombre"
    )->fetchAll();

    $filas = $pdo->query(
        "SELECT le.linea_clave, e.id, e.nombre, e.lat, e.lon, e.dir
         FROM linea_estaciones le
         JOIN estaciones e ON e.id = le.estacion_id
         ORDER BY le.linea_clave, le.orden"
    )->fetchAll();

    $porLinea = [];
    foreach ($filas as $f) {
        $porLinea[$f["linea_clave"]][] = [
            "id"     => (int) $f["id"],
            "nombre" => $f["nombre"],
            "lat"    => (float) $f["lat"],
            "lon"    => (float) $f["lon"],
            "dir"    => $f["dir"],
        ];
    }

    $salida = [];
    foreach ($lineas as $l) {
        $estaciones = $porLinea[$l["clave"]] ?? [];
        if (count($estaciones) < 2) continue;
        $salida[] = [
            "clave"      => $l["clave"],
            "nombre"     => $l["nombre"],
            "tipo"       => $l["tipo"],
            "color"      => $l["color"],
            "estaciones" => $estaciones,
        ];
    }

    echo json_encode(["exito" => true, "lineas" => $salida]);
} catch (Throwable $e) {
    error_log("Error en red.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["exito" => false, "mensaje" => "No se pudo cargar la red."]);
}
