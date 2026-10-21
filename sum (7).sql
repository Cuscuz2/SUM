-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 15-10-2026 a las 21:35:06
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `sum`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `admin_config`
--

CREATE TABLE `admin_config` (
  `id` int(11) NOT NULL DEFAULT 1,
  `password_hash` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `admin_config`
--

INSERT INTO `admin_config` (`id`, `password_hash`) VALUES
(1, '$2y$10$OIhSyb1zfp.YXfRwgjuV7eXWRw/VNCWAdCg7Z6CQU7iWkjuGyUUjy');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `admin_intentos`
--

CREATE TABLE `admin_intentos` (
  `ip` varchar(45) NOT NULL,
  `intentos` int(11) NOT NULL DEFAULT 0,
  `ultimo_intento` datetime NOT NULL,
  `bloqueado_hasta` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `avisos`
--

CREATE TABLE `avisos` (
  `id` int(11) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `mensaje` text NOT NULL,
  `destino` varchar(30) NOT NULL DEFAULT 'todos',
  `creado_en` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `avisos`
--

INSERT INTO `avisos` (`id`, `titulo`, `mensaje`, `destino`, `creado_en`) VALUES
(1, 'Cierre temporal de la linea a', 'Perdonamos todos los inconvenientes', 'frecuente', '2026-09-17 14:35:14'),
(2, 'HOY LA LINEA A SE AVERIO', 'La linea tuvo inconvenientes por desuso', 'frecuente', '2026-09-17 14:41:07'),
(3, 'Metrocable no funciona', 'Se cayo un vagon', 'frecuente', '2026-09-17 14:41:52'),
(4, 'hola', 'hola', 'frecuente', '2026-09-17 14:42:27'),
(5, 'Metroplus se choco', 'El metroplus se chuzo una llanta', 'frecuente', '2026-09-17 14:45:30'),
(6, 'HOLI', 'BUENAS', 'frecuente', '2026-09-17 15:06:56'),
(7, 'METROCABLE NO FUNCIONA', 'Estimados pasajeros el metrocable se cayo', 'todos', '2026-09-17 20:21:21'),
(8, 'METROCABLE  FUERA DE SERVICIO', 'LAMENTAMOS LOS INCONVENIENTES', 'todos', '2026-09-23 20:21:21'),
(9, 'bloqueo del metro cable', 'se chocaron 2 vagones en la estacion acevedo', 'todos', '2026-09-30 09:07:54'),
(10, 'estacion de santo domingo cerrada', 'se tiro una persona', 'todos', '2026-09-30 15:47:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estaciones`
--

CREATE TABLE `estaciones` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `lat` decimal(9,6) NOT NULL,
  `lon` decimal(9,6) NOT NULL,
  `dir` varchar(255) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estaciones`
--

INSERT INTO `estaciones` (`id`, `nombre`, `lat`, `lon`, `dir`) VALUES
(1, 'Acevedo', 6.299860, -75.558530, 'Carrera 63 # 103G-202 (acceso norte), Medellín'),
(2, 'Aguacatala', 6.193770, -75.581920, 'Carrera 48C # 12 Sur-50, Medellín'),
(3, 'Alejandro Echavarría', 6.235400, -75.541530, 'Barrio Alejandro Echavarría (aprox.), Medellín'),
(4, 'Alpujarra', 6.242920, -75.571360, 'Carrera 51 # 41-43, Medellín'),
(5, 'Andalucía', 6.296180, -75.551930, 'Carrera 46A # 107-3, Medellín'),
(6, 'Arví', 6.281530, -75.502930, 'Parque Arví, vereda Piedras Blancas, Santa Elena (aprox.), Medellín'),
(7, 'Ayurá', 6.186010, -75.586200, 'Avenida Regional con Calle 32 Sur (aprox.), Envigado'),
(8, 'Barrio Colombia', 6.228640, -75.571000, 'Carrera 52 con Calle 30 (aprox.), Medellín'),
(9, 'Barrio Colón', 6.240570, -75.569710, 'Carrera 45 con Calle 44 (aprox.), Medellín'),
(10, 'Barrio San Diego', 6.233580, -75.570020, 'Carrera 46 con Calle 34 (aprox.), Medellín'),
(11, 'Bello', 6.329890, -75.553750, 'Calle 44 # 46-001, Bello'),
(12, 'Berlín', 6.282870, -75.552850, 'Carrera 45 con Calle 83 (aprox.), Medellín'),
(13, 'Bicentenario', 6.243860, -75.558530, 'Avenida Ayacucho, barrio Boston (aprox.), Medellín'),
(14, 'Buenos Aires', 6.241500, -75.553890, 'Avenida Ayacucho con Carrera 29 (aprox.), Medellín'),
(15, 'Caribe', 6.278280, -75.569370, 'Carrera 64 # 75B-600 (acceso norte), Medellín'),
(16, 'Catedral Metropolitana', 6.252930, -75.562380, 'Parque Bolívar (aprox.), Medellín'),
(17, 'Chagualo', 6.260730, -75.569130, 'Carrera 55 con Calle 65 (aprox.), Medellín'),
(18, 'Cisneros', 6.249010, -75.575110, 'Carrera 57 # 45A-50, Medellín'),
(19, 'Doce de Octubre', 6.303090, -75.574490, 'Barrio Doce de Octubre, comuna 6 (aprox.), Medellín'),
(20, 'El Progreso', 6.304490, -75.582510, 'Carrera 83A con Calle 104C (aprox.), junto al Cerro El Picacho, Bello'),
(21, 'Envigado', 6.174690, -75.597060, 'Carrera 42 # 59A-291, Envigado'),
(22, 'Estadio', 6.253320, -75.588240, 'Carrera 70 # 47D-15, Medellín'),
(23, 'Exposiciones', 6.238430, -75.573220, 'Carrera 51 con Calle 37, Medellín'),
(24, 'Fátima', 6.231600, -75.586550, 'Carrera 70 con Calle 30A, Medellín'),
(25, 'Floresta', 6.258700, -75.597700, 'Carrera 80 # 47D-30, Medellín'),
(26, 'Gardel', 6.267680, -75.554950, 'Carrera 45 con Calle 70 (aprox.), Medellín'),
(27, 'Hospital', 6.263680, -75.563440, 'Carrera 51 # 65-85, Medellín'),
(28, 'Industriales', 6.230020, -75.575610, 'Carrera 49 # 24-435, Medellín'),
(29, 'Itagüí', 6.162960, -75.606710, 'Carrera 49 # 50 Sur-80, Itagüí'),
(30, 'Juan XXIII', 6.265690, -75.613690, 'Carrera 99CD con Calle 48B, Medellín'),
(31, 'La Aurora', 6.281100, -75.614210, 'Calle 64 con Carrera 104, Medellín'),
(32, 'La Estrella', 6.152630, -75.626460, 'Carrera 49 # 77 Sur, La Estrella'),
(33, 'La Palma', 6.231100, -75.601060, 'Carrera 81 con Calle 30A, Medellín'),
(34, 'La Playa', 6.249330, -75.564460, 'Carrera 45 con Avenida La Playa (aprox.), Medellín'),
(35, 'Las Esmeraldas', 6.278380, -75.553120, 'Carrera 45 con Calle 78 (aprox.), Medellín'),
(36, 'Las Torres', 6.236550, -75.536280, 'Barrio Las Torres, comuna 8 (aprox.), Medellín'),
(37, 'Los Alpes', 6.231030, -75.605060, 'Carrera 84 con Calle 30A, Medellín'),
(38, 'Loyola', 6.239240, -75.545240, 'Avenida Ayacucho, barrio Loyola (aprox.), Medellín'),
(39, 'Madera', 6.316030, -75.555340, 'Carrera 49 # 25B-20, Bello'),
(40, 'Manrique', 6.273220, -75.554010, 'Carrera 45 con Calle 73 (aprox.), Medellín'),
(41, 'Minorista', 6.256100, -75.573120, 'Carrera 57 # 54-01, Medellín'),
(42, 'Miraflores', 6.241480, -75.549070, 'Avenida Ayacucho, barrio Miraflores (aprox.), Medellín'),
(43, 'Niquía', 6.337926, -75.544376, 'Diagonal 50A # 37-01, Bello'),
(44, 'Nutibara', 6.231710, -75.582060, 'Carrera 65 con Avenida 33, Medellín'),
(45, 'Oriente', 6.233040, -75.540010, 'Barrio Oriente, comuna 8 (aprox.), Medellín'),
(46, 'Pabellón del Agua', 6.245550, -75.561820, 'Avenida Ayacucho, barrio Barrio Colón (aprox.), Medellín'),
(47, 'Palos Verdes', 6.262080, -75.555810, 'Carrera 45 # 66-01, Medellín'),
(48, 'Parque Aranjuez', 6.285190, -75.556630, 'Carrera 49A # 93-00, Medellín'),
(49, 'Parque Belén', 6.231330, -75.596750, 'Carrera 76 con Calle 30A, Medellín'),
(50, 'Parque Berrío', 6.250540, -75.568280, 'Carrera 51 con Calle 50 (aprox.), Medellín'),
(51, 'Plaza Mayor', 6.243700, -75.575290, 'Calle 41 con Carrera 52 (aprox.), Medellín'),
(52, 'Poblado', 6.211960, -75.578060, 'Avenida El Poblado, sector Astorga (aprox.), Medellín'),
(53, 'Popular', 6.295130, -75.548150, 'Carrera 42B # 107-61, Medellín'),
(54, 'Prado', 6.256790, -75.566050, 'Carrera 51D # 57-100, Medellín'),
(55, 'Rosales', 6.231530, -75.590960, 'Carrera 73 con Calle 30A, Medellín'),
(56, 'Ruta N - U. de A.', 6.263550, -75.567640, 'Carrera 55 # 65-01, Medellín'),
(57, 'Sabaneta', 6.157890, -75.616040, 'Carrera 49 # 67 Sur, Sabaneta'),
(58, 'San Antonio', 6.247070, -75.569690, 'Carrera 51 con Calle 46, Medellín'),
(59, 'San Javier', 6.256860, -75.613780, 'Carrera 99 # 45-26, Medellín'),
(60, 'San José', 6.247370, -75.565500, 'Avenida Oriental con Calle 49 (aprox.), Medellín'),
(61, 'San Pedro', 6.263390, -75.560170, 'Carrera 51 con Calle 68 (aprox.), Medellín'),
(62, 'Santa Lucía', 6.258060, -75.603770, 'Calle 47DD # 86-53, Medellín'),
(63, 'Santo Domingo', 6.293160, -75.541720, 'Carrera 51A # 46-08, Medellín'),
(64, 'Sena', 6.301680, -75.566480, 'Calle 104 # 67-32, barrio Pedregal (Castilla), Medellín'),
(65, 'Suramericana', 6.253000, -75.583020, 'Carrera 65 con Calle 44 (aprox.), Medellín'),
(66, 'Tricentenario', 6.290310, -75.564730, 'Carrera 63 # 94A-518 (acceso norte), Medellín'),
(67, 'U. de M.', 6.230600, -75.609130, 'Carrera 87B con Calle 30A, Medellín'),
(68, 'Universidad', 6.269330, -75.565770, 'Calle 73 # 52-40, Medellín'),
(69, 'Vallejuelos', 6.275380, -75.614020, 'Calle 61B con Carrera 104, Medellín'),
(70, 'Villa Sierra', 6.234990, -75.528640, 'Barrio La Sierra, comuna 8 (aprox.), Medellín');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `lineas`
--

CREATE TABLE `lineas` (
  `clave` varchar(20) NOT NULL,
  `nombre` varchar(80) NOT NULL,
  `tipo` enum('metro','metrocable','metroplus','tranvia') NOT NULL,
  `color` char(7) NOT NULL,
  `orden` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `lineas`
--

INSERT INTO `lineas` (`clave`, `nombre`, `tipo`, `color`, `orden`) VALUES
('a', 'Línea A · Metro', 'metro', '#2563eb', 1),
('b', 'Línea B · Metro', 'metro', '#f5a623', 2),
('h', 'Metrocable H', 'metrocable', '#0d9488', 6),
('j', 'Metrocable J', 'metrocable', '#0d9488', 5),
('k', 'Metrocable K', 'metrocable', '#0d9488', 4),
('l', 'Metrocable L', 'metrocable', '#0d9488', 7),
('mp1', 'Metroplús · Línea 1', 'metroplus', '#e11d48', 9),
('mp2', 'Metroplús · Línea 2', 'metroplus', '#e11d48', 10),
('p', 'Metrocable Picacho (P)', 'metrocable', '#0d9488', 8),
('tranvia', 'Tranvía de Ayacucho', 'tranvia', '#7c3aed', 3),
('vega', 'VEGA', 'metro', '#2563eb', 11);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `linea_estaciones`
--

CREATE TABLE `linea_estaciones` (
  `linea_clave` varchar(20) NOT NULL,
  `estacion_id` int(11) NOT NULL,
  `orden` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `linea_estaciones`
--

INSERT INTO `linea_estaciones` (`linea_clave`, `estacion_id`, `orden`) VALUES
('a', 43, 1),
('a', 11, 2),
('a', 39, 3),
('a', 1, 4),
('a', 66, 5),
('a', 15, 6),
('a', 68, 7),
('a', 27, 8),
('a', 54, 9),
('a', 50, 10),
('a', 58, 11),
('a', 4, 12),
('a', 23, 13),
('a', 28, 14),
('a', 52, 15),
('a', 2, 16),
('a', 7, 17),
('a', 21, 18),
('a', 29, 19),
('a', 57, 20),
('a', 32, 21),
('b', 58, 1),
('b', 18, 2),
('b', 65, 3),
('b', 22, 4),
('b', 25, 5),
('b', 62, 6),
('b', 59, 7),
('h', 45, 1),
('h', 36, 2),
('h', 70, 3),
('j', 59, 1),
('j', 30, 2),
('j', 69, 3),
('j', 31, 4),
('k', 1, 1),
('k', 5, 2),
('k', 53, 3),
('k', 63, 4),
('l', 63, 1),
('l', 6, 2),
('mp1', 67, 1),
('mp1', 37, 2),
('mp1', 33, 3),
('mp1', 49, 4),
('mp1', 55, 5),
('mp1', 24, 6),
('mp1', 44, 7),
('mp1', 28, 8),
('mp1', 51, 9),
('mp1', 18, 10),
('mp1', 41, 11),
('mp1', 17, 12),
('mp1', 56, 13),
('mp1', 27, 14),
('mp1', 61, 15),
('mp1', 47, 16),
('mp1', 26, 17),
('mp1', 40, 18),
('mp1', 35, 19),
('mp1', 12, 20),
('mp1', 48, 21),
('mp2', 67, 1),
('mp2', 37, 2),
('mp2', 33, 3),
('mp2', 49, 4),
('mp2', 55, 5),
('mp2', 24, 6),
('mp2', 44, 7),
('mp2', 28, 8),
('mp2', 8, 9),
('mp2', 10, 10),
('mp2', 9, 11),
('mp2', 60, 12),
('mp2', 34, 13),
('mp2', 16, 14),
('mp2', 54, 15),
('mp2', 27, 16),
('mp2', 61, 17),
('mp2', 47, 18),
('mp2', 26, 19),
('mp2', 40, 20),
('mp2', 35, 21),
('mp2', 12, 22),
('mp2', 48, 23),
('p', 1, 1),
('p', 64, 2),
('p', 19, 3),
('p', 20, 4),
('tranvia', 58, 1),
('tranvia', 60, 2),
('tranvia', 46, 3),
('tranvia', 13, 4),
('tranvia', 14, 5),
('tranvia', 42, 6),
('tranvia', 38, 7),
('tranvia', 3, 8),
('tranvia', 45, 9);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tarifas`
--

CREATE TABLE `tarifas` (
  `clave` varchar(30) NOT NULL,
  `etiqueta` varchar(100) NOT NULL,
  `valor` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tarifas`
--

INSERT INTO `tarifas` (`clave`, `etiqueta`, `valor`) VALUES
('adulto_mayor', 'Adulto Mayor', 3330),
('arvi_civica', 'Estratos 1, 2 y 3 - Cívica', 3900),
('arvi_extranjero', 'Extranjeros / Público General', 26700),
('arvi_nacional', 'Nacionales / Cívica Personalizada', 11900),
('discapacidad', 'Persona con Discapacidad', 2720),
('estudiantil', 'Estudiantil', 1600),
('eventual', 'Eventual', 4400),
('frecuente', 'Frecuente', 3800);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `usuario`, `email`, `password`, `foto`, `activo`, `creado_en`) VALUES
(15, 'Isabella', 'isa1', 'isa@gmail.com', '$2y$10$RtIP2AfG1lkQLQ0cqJ7.l.azoRm4JthslC3FuIqzoKvRCJSTRCS8G', NULL, 1, '2026-08-27 16:38:13'),
(16, 'Samuel Gómez Muñoz', 'samuelgomez2010', 'samuelgomezm2000@gmail.com', '$2y$10$MnMLVel.JCe61S2DZXHS5uNDR4dHz/uIPJmHVivQxQhcbGJI6AIoW', NULL, 1, '2026-08-27 18:44:00'),
(17, '[Samuel Arboleda]', '[Samu]', '[samu@gmail.com]', '[112345678]', NULL, 1, '2026-08-28 19:49:51'),
(18, '[Maximiliano]', '[maxicacorrini]', '[cacorrini@gmail.com]', '[87654321]', NULL, 1, '2026-08-28 19:55:43'),
(19, '[Simon]', '[saimon]', '[saimon@gmail.com]', '[21436587]', NULL, 1, '2026-08-28 20:05:50'),
(20, 'jairo', 'juan123', 'juan@gmail.com', '$2y$10$M8yK7Wj7AJsGjVHFZmewyOw7fBAwXWGzZOipK5S2ermtLnXEctA0y', NULL, 1, '2026-08-29 00:59:28'),
(21, 'Jere', 'chamin', 'chamo@gmail.com', '$2y$10$1tSN/20k0oiRr4vh4xtZPO058oixRh4GeaPE4G2T/4GYkN.ePWlsW', NULL, 1, '2026-09-02 18:47:10'),
(22, 'samuel gomez muñoz', 'samuell123', 'samuelfhidfheiud7657Q@gmail.com', '$2y$10$FKAn1ihuPO/wu4Xf16u0EuqVFlS2s4fT8ueuDrYpJAqKbXUAZHtOm', NULL, 1, '2026-09-03 19:00:42'),
(23, 'Mateo', 'mateo1', 'mateo@gmail.com', '$2y$10$CEvhjcIrGkP2R2751gRTpOTGPYrxnvw21zyU9WVlBQ08e55kLqB8S', NULL, 1, '2026-09-10 19:47:19'),
(24, 'Simón González Caro', 'Laimon777', 'simon842009@gmail.com', '$2y$10$hDb/kj1pjBJm07wWRRik/.6ZRf9qb5im4WjkV3F.qcirlLB6KB2Bi', NULL, 1, '2026-09-10 21:20:52'),
(25, 'Juan Pablo', 'thelayor', 'juanpablocardona082@gmail.com', '$2y$10$T9sgYVgEV7jIl80X3ZWUveEIUbDj8AEVO5sPK/SDS2VNwY2f5FWUO', '25_1789159145.jpg', 1, '2026-09-11 19:06:09'),
(26, 'Castillo', 'Castillo', 'castillo@gmail.com', '$2y$10$RcndF8l94gSy5H/x31VHROpjDcdvgX1SQ49JBI0YK68q74Ruka16S', NULL, 0, '2026-09-18 21:33:24'),
(27, 'Isabella Vega Agudelo', 'iva9422', '9422iva@gmail.com', '$2y$10$0IMWaFHmQU8Xi.3XlRfyluxBb.upz/Fbl5qpuF5mgNleDf/1RdLJu', '27_1790197395.png', 1, '2026-09-23 21:02:54'),
(28, 'jairo alonso', 'jcar5', 'jairoalonsojpci@hotmail.com', '$2y$10$n8GmRdrlxTAYjmK3WkUs2usfyJGFFudi1xrfGvagKYQMYMaZz//Aq', NULL, 1, '2026-09-24 01:13:55');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `viajes`
--

CREATE TABLE `viajes` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `estacion_origen` varchar(100) NOT NULL,
  `estacion_destino` varchar(100) NOT NULL,
  `linea` varchar(50) NOT NULL,
  `duracion_min` int(11) NOT NULL,
  `costo` int(11) NOT NULL,
  `fecha_hora` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `viajes`
--

INSERT INTO `viajes` (`id`, `usuario_id`, `estacion_origen`, `estacion_destino`, `linea`, `duracion_min`, `costo`, `fecha_hora`) VALUES
(1, 23, 'Niquía', 'Juan XXIII', 'Línea A + Línea B + Metrocable', 42, 3210, '2026-09-10 14:47:37'),
(2, 23, 'Bello', 'Arví', 'Línea A + Metrocable', 20, 7720, '2026-09-10 15:01:58'),
(3, 24, 'Universidad', 'Niquía', 'Línea A', 12, 3820, '2026-09-10 16:24:29'),
(4, 25, 'Niquía', 'Bicentenario', 'Línea A + Tranvía', 30, 3820, '2026-09-11 15:45:08'),
(5, 25, 'Niquía', 'Alpujarra', 'Línea A', 22, 3820, '2026-09-17 14:48:28'),
(6, 25, 'Bello', 'Madera', 'Línea A', 2, 99999, '2026-09-18 16:24:31'),
(7, 25, 'Bello', 'Madera', 'Línea A', 2, 99999, '2026-09-18 16:24:32'),
(8, 26, 'Bello', 'Industriales', 'Línea A', 24, 3820, '2026-09-18 16:34:08'),
(9, 25, 'Bello', 'San Antonio', 'Línea A', 18, 3820, '2026-09-23 15:30:03'),
(10, 25, 'Niquía', 'Arví', 'Línea A + Metrocable', 22, 7720, '2026-09-23 15:57:58'),
(11, 25, 'Niquía', 'Arví', 'Línea A + Metrocable', 22, 7720, '2026-09-23 15:57:59'),
(12, 27, 'Estadio', 'La Estrella', 'Línea B + Metroplús + Línea A', 30, 3820, '2026-09-23 16:05:02'),
(13, 28, 'Bello', 'Arví', 'Línea A + Metrocable', 20, 7720, '2026-09-23 20:15:47'),
(14, 25, 'Niquía', 'Acevedo', 'Línea A', 6, 3800, '2026-09-25 15:31:22'),
(15, 25, 'Tricentenario', 'Acevedo', 'Línea A', 2, 3800, '2026-09-29 20:51:52'),
(16, 25, 'Niquía', 'Arví', 'Línea A + Metrocable', 22, 7700, '2026-09-30 09:00:44'),
(17, 25, 'Caribe', 'Acevedo', 'Línea A', 4, 3800, '2026-09-30 09:12:52'),
(18, 25, 'Hospital', 'Santo Domingo', 'Línea A + Metrocable', 18, 3800, '2026-09-30 15:43:12');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `admin_config`
--
ALTER TABLE `admin_config`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `admin_intentos`
--
ALTER TABLE `admin_intentos`
  ADD PRIMARY KEY (`ip`);

--
-- Indices de la tabla `avisos`
--
ALTER TABLE `avisos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `estaciones`
--
ALTER TABLE `estaciones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_estacion_nombre` (`nombre`);

--
-- Indices de la tabla `lineas`
--
ALTER TABLE `lineas`
  ADD PRIMARY KEY (`clave`);

--
-- Indices de la tabla `linea_estaciones`
--
ALTER TABLE `linea_estaciones`
  ADD PRIMARY KEY (`linea_clave`,`estacion_id`),
  ADD KEY `idx_linea_orden` (`linea_clave`,`orden`),
  ADD KEY `fk_le_estacion` (`estacion_id`);

--
-- Indices de la tabla `tarifas`
--
ALTER TABLE `tarifas`
  ADD PRIMARY KEY (`clave`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `usuario` (`usuario`);

--
-- Indices de la tabla `viajes`
--
ALTER TABLE `viajes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_usuario_fecha` (`usuario_id`,`fecha_hora`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `avisos`
--
ALTER TABLE `avisos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `estaciones`
--
ALTER TABLE `estaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT de la tabla `viajes`
--
ALTER TABLE `viajes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `linea_estaciones`
--
ALTER TABLE `linea_estaciones`
  ADD CONSTRAINT `fk_le_estacion` FOREIGN KEY (`estacion_id`) REFERENCES `estaciones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_le_linea` FOREIGN KEY (`linea_clave`) REFERENCES `lineas` (`clave`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `viajes`
--
ALTER TABLE `viajes`
  ADD CONSTRAINT `fk_viajes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
