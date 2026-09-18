<?php
/**
 * PHP/lineas.php
 *
 * Sirve la definición completa de la red (líneas, estaciones, colores y
 * categorías de leyenda) que antes vivía hardcodeada en MAPA/mapa.js.
 * No requiere sesión iniciada: es información pública del sistema, igual
 * que un mapa físico en una estación.
 *
 * mapa.js la pide una sola vez al cargar el mapa (ver cargarRedMetro()).
 *
 * Los datos en sí están en data/red_metro.json para que puedan editarse
 * sin tocar código PHP. Si en el futuro se necesita editarlos desde un
 * panel de administración, este archivo es el punto donde se cambiaría
 * "leer el JSON" por "consultar una tabla en la base de datos".
 */

header("Content-Type: application/json; charset=utf-8");

// Cachea la respuesta en el navegador por 1 hora: la red del sistema
// no cambia a cada rato, y esto evita pedirla en cada visita al mapa.
header("Cache-Control: public, max-age=3600");

$rutaDatos = __DIR__ . "/data/red_metro.json";

if (!file_exists($rutaDatos)) {
    http_response_code(500);
    echo json_encode(["exito" => false, "mensaje" => "No se encontró la definición de la red."]);
    exit;
}

// Se valida que el JSON esté bien formado antes de servirlo, para no
// propagar un archivo corrupto como si fuera una respuesta válida.
$contenido = file_get_contents($rutaDatos);
$datos = json_decode($contenido, true);

if ($datos === null) {
    http_response_code(500);
    echo json_encode(["exito" => false, "mensaje" => "La definición de la red está corrupta."]);
    exit;
}

echo json_encode(["exito" => true, "red" => $datos]);
