-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 05-05-2026 a las 00:48:22
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
-- Base de datos: `micropsev2`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `credito`
--

CREATE TABLE `credito` (
  `id_credito` int(11) NOT NULL,
  `id_solicitud` int(11) NOT NULL,
  `monto_aprobado` decimal(12,2) NOT NULL,
  `tasa_interes` decimal(5,2) NOT NULL,
  `plazo` int(11) NOT NULL COMMENT 'Plazo en meses',
  `cuotas_totales` int(11) NOT NULL DEFAULT 0,
  `cuotas_pagadas` int(11) NOT NULL DEFAULT 0,
  `saldo_pendiente` decimal(12,2) NOT NULL,
  `fecha_aprobacion` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `credito`
--

INSERT INTO `credito` (`id_credito`, `id_solicitud`, `monto_aprobado`, `tasa_interes`, `plazo`, `cuotas_totales`, `cuotas_pagadas`, `saldo_pendiente`, `fecha_aprobacion`) VALUES
(1, 1, 1500000.00, 2.50, 12, 12, 3, 1125000.00, '2026-04-01 15:00:00'),
(2, 2, 2500000.00, 2.00, 18, 18, 5, 1805555.56, '2026-04-02 16:30:00'),
(3, 5, 1200000.00, 3.00, 9, 9, 2, 933333.33, '2026-04-05 14:00:00'),
(4, 7, 800000.00, 1.80, 6, 6, 1, 666666.67, '2026-04-07 13:45:00'),
(5, 10, 1000000.00, 2.20, 12, 12, 0, 1000000.00, '2026-04-10 17:30:00'),
(6, 12, 750000.00, 2.80, 6, 6, 0, 750000.00, '2026-04-13 16:00:00'),
(7, 14, 950000.00, 1.50, 9, 9, 0, 950000.00, '2026-04-15 14:30:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `entidad_bancaria`
--

CREATE TABLE `entidad_bancaria` (
  `id_banco` int(11) NOT NULL,
  `nombre_banco` varchar(100) NOT NULL,
  `respuesta` enum('aprobado','rechazado','pendiente') NOT NULL DEFAULT 'pendiente',
  `fecha_respuesta` datetime DEFAULT NULL,
  `observaciones` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `entidad_bancaria`
--

INSERT INTO `entidad_bancaria` (`id_banco`, `nombre_banco`, `respuesta`, `fecha_respuesta`, `observaciones`) VALUES
(1, 'Bancolombia', 'aprobado', '2026-04-15 10:00:00', 'Historial crediticio positivo'),
(2, 'Davivienda', 'aprobado', '2026-04-16 11:30:00', 'Buen comportamiento de pago'),
(3, 'BBVA', 'rechazado', '2026-04-17 09:15:00', 'Historial negativo en los últimos 6 meses'),
(4, 'Banco de Bogotá', 'aprobado', '2026-04-18 14:45:00', 'Cliente con ingresos estables'),
(5, 'Banco Caja Social', 'pendiente', NULL, 'En espera de documentación adicional'),
(6, 'Banco Popular', 'aprobado', '2026-04-20 08:30:00', 'Primer crédito, perfil bajo riesgo'),
(7, 'Citibank', 'rechazado', '2026-04-21 16:20:00', 'Endeudamiento excesivo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_solicitud_log`
--

CREATE TABLE `estado_solicitud_log` (
  `id_log` int(11) NOT NULL,
  `id_solicitud` int(11) NOT NULL,
  `estado_anterior` varchar(20) NOT NULL,
  `estado_nuevo` varchar(20) NOT NULL,
  `fecha_cambio` datetime NOT NULL DEFAULT current_timestamp(),
  `usuario_responsable` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estado_solicitud_log`
--

INSERT INTO `estado_solicitud_log` (`id_log`, `id_solicitud`, `estado_anterior`, `estado_nuevo`, `fecha_cambio`, `usuario_responsable`) VALUES
(1, 1, 'pendiente', 'en_revision', '2026-04-01 09:30:00', 'admin@micropse.com'),
(2, 1, 'en_revision', 'aprobado', '2026-04-01 15:00:00', 'admin@micropse.com'),
(3, 2, 'pendiente', 'en_revision', '2026-04-02 11:00:00', 'admin@micropse.com'),
(4, 2, 'en_revision', 'aprobado', '2026-04-02 16:30:00', 'admin@micropse.com'),
(5, 3, 'pendiente', 'en_revision', '2026-04-03 12:00:00', 'admin@micropse.com'),
(6, 3, 'en_revision', 'rechazado', '2026-04-03 17:15:00', 'admin@micropse.com'),
(7, 4, 'pendiente', 'en_revision', '2026-04-04 15:00:00', 'admin@micropse.com'),
(8, 5, 'pendiente', 'en_revision', '2026-04-05 10:30:00', 'admin@micropse.com'),
(9, 5, 'en_revision', 'aprobado', '2026-04-05 14:00:00', 'admin@micropse.com'),
(10, 6, 'pendiente', 'en_revision', '2026-04-06 14:00:00', 'admin@micropse.com'),
(11, 7, 'pendiente', 'en_revision', '2026-04-07 09:30:00', 'admin@micropse.com'),
(12, 7, 'en_revision', 'aprobado', '2026-04-07 13:45:00', 'admin@micropse.com'),
(13, 8, 'pendiente', 'en_revision', '2026-04-08 15:45:00', 'admin@micropse.com'),
(14, 8, 'en_revision', 'rechazado', '2026-04-09 09:00:00', 'admin@micropse.com'),
(15, 10, 'pendiente', 'en_revision', '2026-04-10 13:00:00', 'admin@micropse.com'),
(16, 10, 'en_revision', 'aprobado', '2026-04-10 17:30:00', 'admin@micropse.com');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `metodo_pago`
--

CREATE TABLE `metodo_pago` (
  `id_metodo` int(11) NOT NULL,
  `nombre_metodo` varchar(50) NOT NULL COMMENT 'PSE, Nequi, transferencia, etc.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `metodo_pago`
--

INSERT INTO `metodo_pago` (`id_metodo`, `nombre_metodo`) VALUES
(1, 'PSE'),
(2, 'Nequi'),
(3, 'Daviplata'),
(4, 'Transferencia bancaria'),
(5, 'Efectivo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificacion`
--

CREATE TABLE `notificacion` (
  `id_notificacion` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `tipo` varchar(50) NOT NULL COMMENT 'solicitud, pago, aprobacion, rechazo, etc.',
  `mensaje` text NOT NULL,
  `leida` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_envio` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `notificacion`
--

INSERT INTO `notificacion` (`id_notificacion`, `id_usuario`, `tipo`, `mensaje`, `leida`, `fecha_envio`) VALUES
(1, 1, 'solicitud_creada', 'Tu solicitud de crédito por $1,500,000 ha sido creada exitosamente.', 1, '2026-04-01 09:01:00'),
(2, 1, 'aprobacion', '¡Felicidades! Tu crédito de $1,500,000 ha sido APROBADO.', 1, '2026-04-01 15:05:00'),
(3, 2, 'solicitud_creada', 'Tu solicitud de crédito por $2,500,000 ha sido creada exitosamente.', 1, '2026-04-02 10:31:00'),
(4, 2, 'aprobacion', '¡Felicidades! Tu crédito de $2,500,000 ha sido APROBADO.', 1, '2026-04-02 16:35:00'),
(5, 3, 'solicitud_creada', 'Tu solicitud de crédito por $500,000 ha sido creada exitosamente.', 1, '2026-04-03 11:16:00'),
(6, 3, 'rechazo', 'Lo sentimos, tu solicitud de crédito ha sido RECHAZADA.', 1, '2026-04-03 17:20:00'),
(7, 4, 'solicitud_creada', 'Tu solicitud de crédito por $3,000,000 ha sido creada exitosamente.', 0, '2026-04-04 14:01:00'),
(8, 5, 'solicitud_creada', 'Tu solicitud de crédito por $1,200,000 ha sido creada exitosamente.', 1, '2026-04-05 09:46:00'),
(9, 5, 'aprobacion', '¡Felicidades! Tu crédito de $1,200,000 ha sido APROBADO.', 0, '2026-04-05 14:05:00'),
(10, 6, 'solicitud_creada', 'Tu solicitud de crédito por $4,500,000 ha sido creada exitosamente.', 0, '2026-04-06 13:21:00'),
(11, 7, 'solicitud_creada', 'Tu solicitud de crédito por $800,000 ha sido creada exitosamente.', 1, '2026-04-07 08:31:00'),
(12, 7, 'aprobacion', '¡Felicidades! Tu crédito de $800,000 ha sido APROBADO.', 1, '2026-04-07 13:50:00'),
(13, 8, 'solicitud_creada', 'Tu solicitud de crédito por $2,000,000 ha sido creada exitosamente.', 1, '2026-04-08 15:01:00'),
(14, 8, 'rechazo', 'Lo sentimos, tu solicitud de crédito ha sido RECHAZADA.', 0, '2026-04-09 09:05:00'),
(15, 9, 'solicitud_creada', 'Tu solicitud de crédito por $3,500,000 ha sido creada exitosamente.', 0, '2026-04-09 10:16:00'),
(16, 10, 'solicitud_creada', 'Tu solicitud de crédito por $1,000,000 ha sido creada exitosamente.', 1, '2026-04-10 12:01:00'),
(17, 10, 'aprobacion', '¡Felicidades! Tu crédito de $1,000,000 ha sido APROBADO.', 1, '2026-04-10 17:35:00'),
(18, 1, 'pago_recibido', 'Se ha recibido tu pago de $125,000. Saldo pendiente: $1,125,000', 1, '2026-04-15 08:35:00'),
(19, 2, 'pago_recibido', 'Se ha recibido tu pago de $138,889. Saldo pendiente: $1,666,667', 1, '2026-04-20 14:05:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pago`
--

CREATE TABLE `pago` (
  `id_pago` int(11) NOT NULL,
  `id_credito` int(11) NOT NULL,
  `id_metodo` int(11) DEFAULT NULL,
  `monto_pago` decimal(12,2) NOT NULL,
  `fecha_pago` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pago`
--

INSERT INTO `pago` (`id_pago`, `id_credito`, `id_metodo`, `monto_pago`, `fecha_pago`) VALUES
(1, 1, 1, 125000.00, '2026-04-15 08:30:00'),
(2, 1, 2, 125000.00, '2026-05-15 09:45:00'),
(3, 1, 1, 125000.00, '2026-06-15 10:15:00'),
(4, 2, 3, 138888.89, '2026-04-20 14:00:00'),
(5, 2, 1, 138888.89, '2026-05-20 11:30:00'),
(6, 2, 2, 138888.89, '2026-06-20 15:45:00'),
(7, 2, 3, 138888.89, '2026-07-20 10:00:00'),
(8, 2, 1, 138888.89, '2026-08-20 09:15:00'),
(9, 3, 1, 133333.33, '2026-04-25 16:20:00'),
(10, 3, 2, 133333.33, '2026-05-25 08:45:00'),
(11, 4, 4, 133333.33, '2026-04-30 12:00:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `prueba_virtual`
--

CREATE TABLE `prueba_virtual` (
  `id_prueba` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `fecha_completada` datetime NOT NULL DEFAULT current_timestamp(),
  `puntaje` decimal(5,2) NOT NULL DEFAULT 0.00,
  `aprobada` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `prueba_virtual`
--

INSERT INTO `prueba_virtual` (`id_prueba`, `id_usuario`, `fecha_completada`, `puntaje`, `aprobada`) VALUES
(1, 1, '2026-04-01 10:30:00', 85.50, 1),
(2, 2, '2026-04-02 14:20:00', 92.00, 1),
(3, 3, '2026-04-03 09:15:00', 78.50, 1),
(4, 4, '2026-04-04 16:45:00', 45.00, 0),
(5, 5, '2026-04-05 11:00:00', 88.00, 1),
(6, 6, '2026-04-06 13:30:00', 95.00, 1),
(7, 7, '2026-04-07 10:00:00', 72.00, 1),
(8, 8, '2026-04-08 15:20:00', 81.50, 1),
(9, 9, '2026-04-09 12:10:00', 38.00, 0),
(10, 10, '2026-04-10 09:45:00', 91.00, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitud`
--

CREATE TABLE `solicitud` (
  `id_solicitud` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_banco` int(11) DEFAULT NULL,
  `monto` decimal(12,2) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `estado` enum('pendiente','en_revision','aprobado','rechazado') NOT NULL DEFAULT 'pendiente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `solicitud`
--

INSERT INTO `solicitud` (`id_solicitud`, `id_usuario`, `id_banco`, `monto`, `fecha`, `estado`) VALUES
(1, 1, 1, 1500000.00, '2026-04-01 09:00:00', 'aprobado'),
(2, 2, 2, 2500000.00, '2026-04-02 10:30:00', 'aprobado'),
(3, 3, 3, 500000.00, '2026-04-03 11:15:00', 'rechazado'),
(4, 4, NULL, 3000000.00, '2026-04-04 14:00:00', 'pendiente'),
(5, 5, 4, 1200000.00, '2026-04-05 09:45:00', 'aprobado'),
(6, 6, 5, 4500000.00, '2026-04-06 13:20:00', 'en_revision'),
(7, 7, 6, 800000.00, '2026-04-07 08:30:00', 'aprobado'),
(8, 8, 7, 2000000.00, '2026-04-08 15:00:00', 'rechazado'),
(9, 9, NULL, 3500000.00, '2026-04-09 10:15:00', 'pendiente'),
(10, 10, 1, 1000000.00, '2026-04-10 12:00:00', 'aprobado'),
(11, 1, 2, 2800000.00, '2026-04-11 11:30:00', 'en_revision'),
(12, 3, 4, 750000.00, '2026-04-12 09:45:00', 'aprobado'),
(13, 5, 6, 1800000.00, '2026-04-13 14:15:00', 'pendiente'),
(14, 7, 1, 950000.00, '2026-04-14 10:00:00', 'aprobado'),
(15, 10, 3, 2200000.00, '2026-04-15 16:30:00', 'rechazado');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `id_usuario` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `cedula` varchar(20) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `prueba_virtual_completada` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_registro` datetime NOT NULL DEFAULT current_timestamp(),
  `activo` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`id_usuario`, `nombre`, `apellido`, `cedula`, `correo`, `contrasena`, `telefono`, `prueba_virtual_completada`, `fecha_registro`, `activo`) VALUES
(1, 'Carlos', 'Martínez', '1012345678', 'carlos.martinez@email.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '3101234567', 1, '2026-05-04 17:01:47', 1),
(2, 'Ana', 'Rodríguez', '1023456789', 'ana.rodriguez@email.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '3112345678', 1, '2026-05-04 17:01:47', 1),
(3, 'Luis', 'García', '1034567890', 'luis.garcia@email.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '3123456789', 1, '2026-05-04 17:01:47', 1),
(4, 'María', 'López', '1045678901', 'maria.lopez@email.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '3134567890', 0, '2026-05-04 17:01:47', 1),
(5, 'Jorge', 'Sánchez', '1056789012', 'jorge.sanchez@email.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '3145678901', 1, '2026-05-04 17:01:47', 0),
(6, 'Diana', 'Pérez', '1067890123', 'diana.perez@email.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '3156789012', 1, '2026-05-04 17:01:47', 1),
(7, 'Andrés', 'Ramírez', '1078901234', 'andres.ramirez@email.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '3167890123', 1, '2026-05-04 17:01:47', 1),
(8, 'Laura', 'Torres', '1089012345', 'laura.torres@email.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '3178901234', 1, '2026-05-04 17:01:47', 1),
(9, 'Ricardo', 'Flores', '1090123456', 'ricardo.flores@email.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '3189012345', 0, '2026-05-04 17:01:47', 1),
(10, 'Sofía', 'Castro', '1101234567', 'sofia.castro@email.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '3190123456', 1, '2026-05-04 17:01:47', 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `credito`
--
ALTER TABLE `credito`
  ADD PRIMARY KEY (`id_credito`),
  ADD KEY `idx_credito_saldo` (`saldo_pendiente`),
  ADD KEY `fk_cred_solicitud` (`id_solicitud`);

--
-- Indices de la tabla `entidad_bancaria`
--
ALTER TABLE `entidad_bancaria`
  ADD PRIMARY KEY (`id_banco`);

--
-- Indices de la tabla `estado_solicitud_log`
--
ALTER TABLE `estado_solicitud_log`
  ADD PRIMARY KEY (`id_log`),
  ADD KEY `fk_log_solicitud` (`id_solicitud`);

--
-- Indices de la tabla `metodo_pago`
--
ALTER TABLE `metodo_pago`
  ADD PRIMARY KEY (`id_metodo`);

--
-- Indices de la tabla `notificacion`
--
ALTER TABLE `notificacion`
  ADD PRIMARY KEY (`id_notificacion`),
  ADD KEY `idx_notificacion_usuario` (`id_usuario`,`leida`);

--
-- Indices de la tabla `pago`
--
ALTER TABLE `pago`
  ADD PRIMARY KEY (`id_pago`),
  ADD KEY `fk_pago_credito` (`id_credito`),
  ADD KEY `fk_pago_metodo` (`id_metodo`);

--
-- Indices de la tabla `prueba_virtual`
--
ALTER TABLE `prueba_virtual`
  ADD PRIMARY KEY (`id_prueba`),
  ADD KEY `fk_prueba_usuario` (`id_usuario`);

--
-- Indices de la tabla `solicitud`
--
ALTER TABLE `solicitud`
  ADD PRIMARY KEY (`id_solicitud`),
  ADD KEY `idx_solicitud_estado` (`estado`),
  ADD KEY `fk_sol_usuario` (`id_usuario`),
  ADD KEY `fk_sol_banco` (`id_banco`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `idx_usuario_correo` (`correo`),
  ADD UNIQUE KEY `idx_usuario_cedula` (`cedula`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `credito`
--
ALTER TABLE `credito`
  MODIFY `id_credito` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `entidad_bancaria`
--
ALTER TABLE `entidad_bancaria`
  MODIFY `id_banco` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `estado_solicitud_log`
--
ALTER TABLE `estado_solicitud_log`
  MODIFY `id_log` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `metodo_pago`
--
ALTER TABLE `metodo_pago`
  MODIFY `id_metodo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `notificacion`
--
ALTER TABLE `notificacion`
  MODIFY `id_notificacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `pago`
--
ALTER TABLE `pago`
  MODIFY `id_pago` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `prueba_virtual`
--
ALTER TABLE `prueba_virtual`
  MODIFY `id_prueba` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `solicitud`
--
ALTER TABLE `solicitud`
  MODIFY `id_solicitud` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `credito`
--
ALTER TABLE `credito`
  ADD CONSTRAINT `fk_cred_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud` (`id_solicitud`) ON DELETE CASCADE;

--
-- Filtros para la tabla `estado_solicitud_log`
--
ALTER TABLE `estado_solicitud_log`
  ADD CONSTRAINT `fk_log_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud` (`id_solicitud`) ON DELETE CASCADE;

--
-- Filtros para la tabla `notificacion`
--
ALTER TABLE `notificacion`
  ADD CONSTRAINT `fk_notif_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pago`
--
ALTER TABLE `pago`
  ADD CONSTRAINT `fk_pago_credito` FOREIGN KEY (`id_credito`) REFERENCES `credito` (`id_credito`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pago_metodo` FOREIGN KEY (`id_metodo`) REFERENCES `metodo_pago` (`id_metodo`) ON DELETE SET NULL;

--
-- Filtros para la tabla `prueba_virtual`
--
ALTER TABLE `prueba_virtual`
  ADD CONSTRAINT `fk_prueba_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE;

--
-- Filtros para la tabla `solicitud`
--
ALTER TABLE `solicitud`
  ADD CONSTRAINT `fk_sol_banco` FOREIGN KEY (`id_banco`) REFERENCES `entidad_bancaria` (`id_banco`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_sol_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
