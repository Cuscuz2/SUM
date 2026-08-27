-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 27-08-2026 a las 20:26:25
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
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `usuario`, `email`, `password`, `creado_en`) VALUES
(15, 'Isabella', 'isa1', 'isa@gmail.com', '$2y$10$RtIP2AfG1lkQLQ0cqJ7.l.azoRm4JthslC3FuIqzoKvRCJSTRCS8G', '2026-08-27 16:38:13');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

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
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
