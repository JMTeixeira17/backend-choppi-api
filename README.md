# 🛒 Choppi API

API REST para la gestión de supermercados y productos, desarrollada con NestJS, TypeScript, PostgreSQL y JWT Authentication.

![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?logo=nestjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Ejecución](#-ejecución)
- [API Endpoints](#-api-endpoints)
- [Testing](#-testing)
- [Documentación Swagger](#-documentación-swagger)

---

## ✨ Características

- ✅ **Autenticación JWT** - Login y registro de usuarios
- ✅ **CRUD Completo** - Supermercados y productos
- ✅ **Gestión de Inventario** - Ajuste de stock (add/subtract/set)
- ✅ **Estadísticas** - Reportes por tienda, categorías y revenue
- ✅ **Alertas** - Productos con stock bajo configurable
- ✅ **Validación Automática** - DTOs con class-validator
- ✅ **Paginación** - Listados paginados
- ✅ **Soft Deletes** - Eliminación lógica con flag `isActive`
- ✅ **Documentación Swagger** - UI interactiva automática
- ✅ **Tests Unitarios** - 88+ tests con Jest

---

## 📦 Requisitos Previos

- Node.js >= 18.x
- npm >= 9.x
- PostgreSQL >= 14.x (o cuenta en Supabase)

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/choppi-api.git
cd choppi-api
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar base de datos en Supabase

1. Crear cuenta en [Supabase](https://supabase.com)
2. Crear nuevo proyecto
3. Ejecutar el siguiente SQL en el Query Editor:

```sql
-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla User
CREATE TABLE user (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Stores
CREATE TABLE store (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50),
    city VARCHAR(100),
    state VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES user(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Product
CREATE TABLE product (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    stock INTEGER DEFAULT 0,
    category VARCHAR(100),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    store_id UUID NOT NULL REFERENCES store(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejor performance
CREATE INDEX idx_stores_active ON store(is_active);
CREATE INDEX idx_products_store ON product(store_id);
CREATE INDEX idx_products_active ON product(is_active);
CREATE INDEX idx_products_sku ON product(sku);
```

---

## ⚙️ Configuración

Crear archivo `.env` en la raíz del proyecto:

```env
# Database (Supabase)
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password_supabase
DB_DATABASE=postgres
DB_SSL=true

# JWT
JWT_SECRET=jwt-secret
JWT_EXPIRES_IN=24h

# App
PORT=3000
NODE_ENV=development
```

---

## 🎮 Ejecución

### Desarrollo

```bash
npm run start:dev
```

La API estará disponible en: `http://localhost:3000/api/v1`

### Producción

```bash
npm run build
npm run start:prod
```

---

## 📚 API Endpoints

### 🔐 Authentication (Public)

#### `POST /api/v1/auth/register`
**Registrar nuevo usuario**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### `POST /api/v1/auth/login`
**Iniciar sesión**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** Mismo formato que register

---

### 👤 Users (Protected - Requiere JWT)

#### `GET /api/v1/users/profile`
**Obtener perfil del usuario autenticado**

Retorna información del usuario actual sin exponer el password.

#### `GET /api/v1/users/:id`
**Obtener usuario por ID**

Retorna información de un usuario específico.

#### `PUT /api/v1/users/profile`
**Actualizar perfil del usuario actual**

```json
{
  "name": "New Name",
  "email": "newemail@example.com"
}
```

#### `PUT /api/v1/users/change-password`
**Cambiar contraseña**

```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

---

### 🏪 Stores (Protected - Requiere JWT)

#### `POST /api/v1/stores`
**Crear un nuevo supermercado**

```json
{
  "name": "Supermercado Central",
  "address": "Av. Principal 123",
  "phone": "+525512345678",
  "city": "Ciudad de México",
  "state": "CDMX",
  "latitude": 19.432608,
  "longitude": -99.133209
}
```

**Qué hace:** Crea un nuevo registro de supermercado asociado al usuario autenticado.

#### `GET /api/v1/stores?page=1&limit=10`
**Listar todos los supermercados**

**Qué hace:** Retorna una lista paginada de todos los supermercados activos con su información básica.

**Response:**
```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 10
}
```

#### `GET /api/v1/stores/:id`
**Obtener supermercado por ID**

**Qué hace:** Retorna información detallada de un supermercado específico, incluyendo sus productos asociados.

#### `PUT /api/v1/stores/:id`
**Actualizar supermercado**

```json
{
  "name": "Nuevo Nombre",
  "phone": "+525587654321",
  "isActive": true
}
```

**Qué hace:** Actualiza campos específicos del supermercado. Solo se envían los campos a modificar.

#### `DELETE /api/v1/stores/:id`
**Eliminar supermercado (soft delete)**

**Qué hace:** Marca el supermercado como inactivo (`isActive: false`) sin eliminarlo físicamente de la base de datos.

#### `GET /api/v1/stores/:id/stats?lowStockThreshold=10`
**Obtener estadísticas del supermercado**

**Qué hace:** Calcula y retorna métricas completas de un supermercado:
- Total de productos activos
- Valor total del inventario (precio × stock de cada producto)
- Productos agrupados por categoría con sus valores
- Cantidad de productos con stock bajo (configurable vía threshold)

**Response:**
```json
{
  "storeId": "uuid",
  "storeName": "Supermercado Central",
  "totalProducts": 150,
  "totalInventoryValue": 25500.75,
  "productsByCategory": [
    {
      "category": "Bebidas",
      "productCount": 45,
      "totalValue": 8500.00
    },
    {
      "category": "Alimentos",
      "productCount": 65,
      "totalValue": 12000.50
    }
  ],
  "lowStockProducts": 12,
  "lowStockThreshold": 10
}
```

**Casos de uso:** Dashboard administrativo, reportes de inventario, alertas de reabastecimiento.

#### `GET /api/v1/stores/:id/revenue`
**Calcular valor total del inventario**

**Qué hace:** Calcula métricas financieras del supermercado:
- Valor total del inventario (capital inmovilizado)
- Total de productos y unidades en stock
- Precio promedio por producto

**Response:**
```json
{
  "storeId": "uuid",
  "storeName": "Supermercado Central",
  "totalInventoryValue": 25500.75,
  "totalProducts": 150,
  "totalStock": 3500,
  "averageProductPrice": 170.00
}
```

**Casos de uso:** Reportes financieros, análisis de capital, comparación entre sucursales.

---

### 📦 Products (Protected - Requiere JWT)

#### `POST /api/v1/products`
**Crear un nuevo producto**

```json
{
  "name": "Coca Cola 600ml",
  "description": "Bebida refrescante",
  "price": 25.50,
  "sku": "SKU-CC-600",
  "stock": 100,
  "category": "Bebidas",
  "imageUrl": "https://example.com/image.jpg",
  "storeId": "store-uuid-here"
}
```

**Qué hace:** Crea un nuevo producto asociado a un supermercado. Valida que el SKU sea único.

#### `GET /api/v1/products?page=1&limit=10`
**Listar todos los productos**

**Qué hace:** Retorna lista paginada de todos los productos activos del sistema.

#### `GET /api/v1/products?storeId=uuid&page=1&limit=10`
**Listar productos filtrados por tienda**

**Qué hace:** Retorna productos de un supermercado específico usando query parameter.

#### `GET /api/v1/products/store/:storeId?page=1&limit=10`
**Obtener productos de una tienda específica**

**Qué hace:** Similar al anterior pero usando path parameter. Retorna productos activos de una tienda.

#### `GET /api/v1/products/:id`
**Obtener producto por ID**

**Qué hace:** Retorna información detallada de un producto, incluyendo datos del supermercado asociado.

#### `GET /api/v1/products/sku/:sku`
**Obtener producto por SKU**

**Qué hace:** Busca un producto usando su código SKU único. Útil para escáneres o búsquedas rápidas.

#### `PUT /api/v1/products/:id`
**Actualizar producto**

```json
{
  "name": "Coca Cola 1L",
  "price": 35.00,
  "stock": 50,
  "isActive": true
}
```

**Qué hace:** Actualiza campos del producto. Valida que el nuevo SKU (si se cambia) sea único.

#### `DELETE /api/v1/products/:id`
**Eliminar producto (soft delete)**

**Qué hace:** Marca el producto como inactivo sin eliminarlo físicamente.

#### `PUT /api/v1/products/:id/stock`
**Ajustar stock de un producto**

```json
{
  "quantity": 50,
  "type": "add",
  "reason": "Recepción de mercancía"
}
```

**Qué hace:** Ajusta el inventario de un producto con tres modos:
- `add`: Suma unidades al stock actual (ej. recepción de mercancía)
- `subtract`: Resta unidades del stock (ej. ventas, validando que no quede negativo)
- `set`: Establece el stock en un valor exacto (ej. corrección de inventario)

**Response:**
```json
{
  "id": "uuid",
  "name": "Coca Cola 600ml",
  "sku": "SKU-CC-600",
  "previousStock": 100,
  "newStock": 150,
  "adjustmentType": "add",
  "adjustmentQuantity": 50,
  "reason": "Recepción de mercancía"
}
```

**Casos de uso:** 
- Recepción de mercancía
- Registro de ventas
- Devoluciones
- Correcciones de inventario
- Auditorías

#### `GET /api/v1/products/low-stock/list?threshold=10`
**Obtener productos con stock bajo**

**Qué hace:** Retorna lista global de productos cuyo stock está en o debajo del umbral especificado, ordenados por stock ascendente. Incluye información de la tienda asociada.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Producto A",
    "sku": "SKU-001",
    "stock": 5,
    "price": 25.50,
    "category": "Bebidas",
    "store": {
      "id": "store-uuid",
      "name": "Supermercado Central"
    }
  }
]
```

**Casos de uso:** 
- Sistema de alertas automáticas
- Generación de órdenes de compra
- Prevención de quiebres de stock
- Reportes de reabastecimiento

---

## 🔑 Autenticación

Todos los endpoints protegidos requieren incluir el token JWT en el header:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Flujo de autenticación:

1. **Register/Login** → Obtener `access_token`
2. **Incluir token** en requests subsecuentes
3. Token válido por **24 horas** (configurable)

---

## 🧪 Testing

### Ejecutar todos los tests

```bash
npm run test
```

### Tests con cobertura

```bash
npm run test:cov
```

### Modo watch

```bash
npm run test:watch
```

### Cobertura actual

- **88+ tests unitarios**
- **8 suites de test**
- **Cobertura > 85%**

---

## 📖 Documentación Swagger

La API incluye documentación interactiva generada automáticamente con Swagger.

**URL:** `http://localhost:3000/api/docs`

### Características:

- 📝 Documentación completa de todos los endpoints
- 🧪 Probar endpoints directamente desde el navegador
- 🔐 Autenticación JWT integrada
- 📋 Ejemplos de request/response
- 📊 Modelos de datos

### Cómo usar Swagger:

1. Abrir `http://localhost:3000/api/docs`
2. Hacer login/register en `/auth/login` o `/auth/register`
3. Copiar el `access_token` de la respuesta
4. Click en el botón **"Authorize"** 🔓
5. Pegar: `Bearer YOUR_TOKEN`
6. Probar todos los endpoints protegidos

---

## 🗄️ Modelo de Datos

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    User     │         │   Store     │         │  Product    │
├─────────────┤         ├─────────────┤         ├─────────────┤
│ id (PK)     │────┐    │ id (PK)     │────┐    │ id (PK)     │
│ email       │    └───>│ created_by  │    └───>│ store_id    │
│ password    │         │ name        │         │ name        │
│ name        │         │ address     │         │ sku         │
│ created_at  │         │ phone       │         │ price       │
│ updated_at  │         │ is_active   │         │ stock       │
└─────────────┘         │ ...         │         │ category    │
                        └─────────────┘         │ is_active   │
                                                │ ...         │
                                                └─────────────┘
```

### Relaciones:

- **User → Store**: Un usuario puede crear múltiples stores (1:N)
- **Store → Product**: Una tienda tiene múltiples productos (1:N)
- **Soft Deletes**: Todas las entidades usan `is_active` flag

---

## 🎯 Stack Tecnológico

- **Framework:** NestJS 10.x
- **Lenguaje:** TypeScript 5.x
- **Base de Datos:** PostgreSQL (Supabase)
- **ORM:** TypeORM
- **Autenticación:** Passport JWT
- **Validación:** class-validator
- **Documentación:** Swagger/OpenAPI
- **Testing:** Jest
- **Hash:** bcrypt

---

## 📝 Notas Importantes

### Seguridad

- ✅ Passwords hasheados con bcrypt (10 salt rounds)
- ✅ JWT con expiración configurable
- ✅ Validación de datos en todos los endpoints
- ✅ CORS habilitado

### Base de Datos

- ✅ UUIDs como Primary Keys
- ✅ Soft deletes en lugar de eliminación física
- ✅ Timestamps automáticos
- ✅ Índices para optimizar queries

### Validaciones

- ✅ Email único por usuario
- ✅ SKU único por producto
- ✅ Stock no negativo en ajustes
- ✅ Relaciones con integridad referencial



## 📄 Licencia

MIT