-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 16-09-2026 a las 21:37:29
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
-- Estructura de tabla para la tabla `estacion`
--

CREATE TABLE `estacion` (
  `ID` int(11) NOT NULL,
  `NOMBRE-ESTACION` text NOT NULL,
  `LATITUD` decimal(10,0) NOT NULL,
  `LONGITUD` decimal(10,0) NOT NULL,
  `TRANSFERENCIA` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `linea`
--

CREATE TABLE `linea` (
  `ID` int(11) NOT NULL,
  `NOMBRE-LINEA` text NOT NULL,
  `COLOR-MAPA` text NOT NULL,
  `TIPO-TRANSPORTE-ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo-transporte`
--

CREATE TABLE `tipo-transporte` (
  `ID` int(11) NOT NULL,
  `NOMBRE_TIPO_TRANSPORTE` varchar(50) NOT NULL,
  `TARIFA` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ubicacion-linea-estacion`
--

CREATE TABLE `ubicacion-linea-estacion` (
  `LINEA-ID` int(11) NOT NULL,
  `ESTACION-ID` int(11) NOT NULL,
  `ORDEN-SECUENCIA` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `usuario`, `email`, `password`, `foto`, `creado_en`) VALUES
(15, 'Isabella', 'isa1', 'isa@gmail.com', '$2y$10$RtIP2AfG1lkQLQ0cqJ7.l.azoRm4JthslC3FuIqzoKvRCJSTRCS8G', NULL, '2026-08-27 16:38:13'),
(16, 'Samuel Gómez Muñoz', 'samuelgomez2010', 'samuelgomezm2000@gmail.com', '$2y$10$MnMLVel.JCe61S2DZXHS5uNDR4dHz/uIPJmHVivQxQhcbGJI6AIoW', NULL, '2026-08-27 18:44:00'),
(17, '[Samuel Arboleda]', '[Samu]', '[samu@gmail.com]', '[112345678]', NULL, '2026-08-28 19:49:51'),
(18, '[Maximiliano]', '[maxicacorrini]', '[cacorrini@gmail.com]', '[87654321]', NULL, '2026-08-28 19:55:43'),
(19, '[Simon]', '[saimon]', '[saimon@gmail.com]', '[21436587]', NULL, '2026-08-28 20:05:50'),
(20, 'jairo', 'juan123', 'juan@gmail.com', '$2y$10$M8yK7Wj7AJsGjVHFZmewyOw7fBAwXWGzZOipK5S2ermtLnXEctA0y', NULL, '2026-08-29 00:59:28'),
(21, 'Chamo', 'chamin', 'chamo@gmail.com', '$2y$10$1tSN/20k0oiRr4vh4xtZPO058oixRh4GeaPE4G2T/4GYkN.ePWlsW', NULL, '2026-09-02 18:47:10'),
(22, 'samuel gomez muñoz', 'samuell123', 'samuelfhidfheiud7657Q@gmail.com', '$2y$10$FKAn1ihuPO/wu4Xf16u0EuqVFlS2s4fT8ueuDrYpJAqKbXUAZHtOm', NULL, '2026-09-03 19:00:42'),
(23, 'Mateo', 'mateo1', 'mateo@gmail.com', '$2y$10$CEvhjcIrGkP2R2751gRTpOTGPYrxnvw21zyU9WVlBQ08e55kLqB8S', NULL, '2026-09-10 19:47:19'),
(24, 'Simón González Caro', 'Laimon777', 'simon842009@gmail.com', '$2y$10$hDb/kj1pjBJm07wWRRik/.6ZRf9qb5im4WjkV3F.qcirlLB6KB2Bi', NULL, '2026-09-10 21:20:52'),
(25, 'Juan Pablo Cardona', 'thelayor', 'juanpablocardona082@gmail.com', '$2y$10$T9sgYVgEV7jIl80X3ZWUveEIUbDj8AEVO5sPK/SDS2VNwY2f5FWUO', '25_1789159145.jpg', '2026-09-11 19:06:09');

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
(4, 25, 'Niquía', 'Bicentenario', 'Línea A + Tranvía', 30, 3820, '2026-09-11 15:45:08');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `estacion`
--
ALTER TABLE `estacion`
  ADD PRIMARY KEY (`ID`);

--
-- Indices de la tabla `linea`
--
ALTER TABLE `linea`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `fk-tipo-transporte` (`TIPO-TRANSPORTE-ID`);

--
-- Indices de la tabla `tipo-transporte`
--
ALTER TABLE `tipo-transporte`
  ADD PRIMARY KEY (`ID`);

--
-- Indices de la tabla `ubicacion-linea-estacion`
--
ALTER TABLE `ubicacion-linea-estacion`
  ADD KEY `fk-linea_ubicacion` (`LINEA-ID`),
  ADD KEY `fk-estacion` (`ESTACION-ID`);

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
-- AUTO_INCREMENT de la tabla `estacion`
--
ALTER TABLE `estacion`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `linea`
--
ALTER TABLE `linea`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tipo-transporte`
--
ALTER TABLE `tipo-transporte`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT de la tabla `viajes`
--
ALTER TABLE `viajes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `linea`
--
ALTER TABLE `linea`
  ADD CONSTRAINT `fk-tipo-transporte` FOREIGN KEY (`TIPO-TRANSPORTE-ID`) REFERENCES `tipo-transporte` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `ubicacion-linea-estacion`
--
ALTER TABLE `ubicacion-linea-estacion`
  ADD CONSTRAINT `fk-estacion` FOREIGN KEY (`ESTACION-ID`) REFERENCES `estacion` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk-linea_ubicacion` FOREIGN KEY (`LINEA-ID`) REFERENCES `linea` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `viajes`
--
ALTER TABLE `viajes`
  ADD CONSTRAINT `fk_viajes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
