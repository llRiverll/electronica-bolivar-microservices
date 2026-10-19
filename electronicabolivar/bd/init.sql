-- 1. LIMPIEZA Y CONFIGURACIÓN UTF-8 (Para Tildes)
DROP DATABASE IF EXISTS electronica_db;
CREATE DATABASE electronica_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE electronica_db;

-- 2. TABLAS
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    nombre_completo VARCHAR(100),
    email VARCHAR(100),
    telefono VARCHAR(20),
    cargo VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'ACTIVO'
);

CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    documento VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20)
);

CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    marca VARCHAR(50),
    categoria VARCHAR(100),
    subcategoria VARCHAR(100),
    precio_unitario DECIMAL(10, 2) NOT NULL,
    -- CAMBIO CLAVE: Usamos TEXT para asegurar que entren URLs largas si decidieras usarlas
    imagen_url TEXT 
);

CREATE TABLE inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT UNIQUE,
    stock_actual INT DEFAULT 0,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

CREATE TABLE kardex (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT,
    tipo_movimiento VARCHAR(20) NOT NULL,
    motivo VARCHAR(50) NOT NULL,
    cantidad INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    referencia VARCHAR(100),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'PAGADO',
    total DECIMAL(10, 2),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

CREATE TABLE detalle_pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT,
    producto_id INT,
    cantidad INT NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT,
    monto DECIMAL(10, 2) NOT NULL,
    fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
    metodo VARCHAR(50),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);

-- 3. PERSONAL (USUARIOS)
INSERT INTO usuarios (username, password_hash, rol, nombre_completo, cargo, estado) VALUES 
('admin', '12345', 'ADMIN', 'Arturo Rivera', 'Gerente General', 'ACTIVO'),
('vendedor1', '12345', 'VENDEDOR', 'Juan Pérez', 'Vendedor de Piso', 'ACTIVO'),
('cajero1', '12345', 'VENDEDOR', 'María López', 'Cajera Principal', 'ACTIVO'),
('almacen', '12345', 'ADMIN', 'Pedro Castillo', 'Jefe de Almacén', 'ACTIVO'),
('tecnico', '12345', 'VENDEDOR', 'Luis Torres', 'Soporte Técnico', 'ACTIVO');

-- 4. PRODUCTOS (IMÁGENES GENERADAS AUTOMÁTICAMENTE - A PRUEBA DE FALLOS)
-- Usamos placehold.co que genera una imagen con el nombre del producto escrito en ella.
-- Se ve profesional y nunca se rompe.

INSERT INTO productos (nombre, categoria, marca, precio_unitario, imagen_url) VALUES 

-- COMPUTADORAS
('Laptop Lenovo V15', 'Computadoras', 'Lenovo', 1899.00, 'https://placehold.co/400x400/png?text=Lenovo+V15'),
('Laptop HP Pavilion', 'Computadoras', 'HP', 3299.00, 'https://placehold.co/400x400/png?text=HP+Pavilion'),
('MacBook Air M1', 'Computadoras', 'Apple', 3999.00, 'https://placehold.co/400x400/png?text=MacBook+Air'),
('PC Gamer Ryzen 5', 'Computadoras', 'Generico', 1450.00, 'https://placehold.co/400x400/png?text=PC+Gamer'),
('All-in-One HP', 'Computadoras', 'HP', 2300.00, 'https://placehold.co/400x400/png?text=AIO+HP'),

-- TELEFONÍA
('iPhone 14', 'Telefonía', 'Apple', 3299.00, 'https://placehold.co/400x400/png?text=iPhone+14'),
('Samsung Galaxy A54', 'Telefonía', 'Samsung', 1399.00, 'https://placehold.co/400x400/png?text=Galaxy+A54'),
('Xiaomi Redmi Note 12', 'Telefonía', 'Xiaomi', 750.00, 'https://placehold.co/400x400/png?text=Redmi+Note+12'),
('Motorola G54', 'Telefonía', 'Motorola', 899.00, 'https://placehold.co/400x400/png?text=Moto+G54'),
('Nokia 105', 'Telefonía', 'Nokia', 120.00, 'https://placehold.co/400x400/png?text=Nokia+105'),

-- VIDEOJUEGOS
('PlayStation 5 Slim', 'Videojuegos', 'Sony', 2399.00, 'https://placehold.co/400x400/png?text=PS5+Slim'),
('Nintendo Switch OLED', 'Videojuegos', 'Nintendo', 1499.00, 'https://placehold.co/400x400/png?text=Switch+OLED'),
('Xbox Series S', 'Videojuegos', 'Microsoft', 1350.00, 'https://placehold.co/400x400/png?text=Xbox+Series+S'),
('Mando DualSense', 'Videojuegos', 'Sony', 289.00, 'https://placehold.co/400x400/png?text=DualSense'),
('Mario Kart 8', 'Videojuegos', 'Nintendo', 210.00, 'https://placehold.co/400x400/png?text=Mario+Kart'),

-- TV Y AUDIO
('Smart TV Samsung 50"', 'Televisores', 'Samsung', 1399.00, 'https://placehold.co/400x400/png?text=TV+Samsung+50'),
('Smart TV LG 55"', 'Televisores', 'LG', 1599.00, 'https://placehold.co/400x400/png?text=TV+LG+55'),
('Parlante JBL Flip 6', 'Televisores', 'JBL', 450.00, 'https://placehold.co/400x400/png?text=JBL+Flip+6'),
('Chromecast Google TV', 'Televisores', 'Google', 230.00, 'https://placehold.co/400x400/png?text=Chromecast'),

-- ACCESORIOS Y COMPONENTES
('Mouse Logitech G203', 'Accesorios', 'Logitech', 89.00, 'https://placehold.co/400x400/png?text=Mouse+G203'),
('Teclado Mecánico', 'Accesorios', 'Redragon', 149.00, 'https://placehold.co/400x400/png?text=Teclado+RGB'),
('Audífonos HyperX', 'Accesorios', 'HyperX', 189.00, 'https://placehold.co/400x400/png?text=HyperX+Cloud'),
('RTX 3060 12GB', 'Componentes', 'MSI', 1450.00, 'https://placehold.co/400x400/png?text=RTX+3060'),
('Procesador Ryzen 5', 'Componentes', 'AMD', 550.00, 'https://placehold.co/400x400/png?text=Ryzen+5'),
('Router TP-Link', 'Redes', 'TP-Link', 140.00, 'https://placehold.co/400x400/png?text=Router+Wifi');

-- 5. STOCK AUTOMÁTICO
INSERT INTO inventario (producto_id, stock_actual)
SELECT id, 25 FROM productos;