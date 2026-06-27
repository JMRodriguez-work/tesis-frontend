# TFG Frontend — Plataforma de inteligencia analítica para almacenes

Frontend del TFG "tesis-backend". Interfaz de usuario de la plataforma de
inteligencia analítica para almacenes y despensas pequeñas de Argentina.

> Estado del proyecto, fases completadas y backlog: ver [`TODO.md`](./TODO.md).

---

## Stack

- **React**
- **Tanstack Router:**
- **Tanstack Query:**
- **Base UI:**
- **Biome**

---

## Setup local

### 1. Prerequisitos

- Node.js 20+ (recomendado usar [fnm](https://github.com/Schniz/fnm) o [nvm](https://github.com/Schniz/nvm))
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- El backend corriendo en `http://localhost:8787` (ver [`../tesis-backend/README.md`](../tesis-backend/README.md))

### 2. Clonar e instalar

```bash
git clone https://github.com/JMRodriguez-work/tesis-frontend.git
cd tesis-frontend
pnpm install
```

### 3. Configurar variables de entorno (opcional)

El front tiene defaults sensatos para dev. Si querés apuntarlo a otro backend:

```bash
cp .env.example .env
# Editar .env y setear VITE_API_URL si es necesario
```

| Variable      | Default                   | Descripción                              |
| ------------- | ------------------------- | ---------------------------------------- |
| `VITE_API_URL` | `http://localhost:8787`  | URL del backend (Worker en dev)          |
| `VITE_ENV`    | `development`             | `development` / `staging` / `production` |

> Las variables `VITE_*` se embeben en el bundle en build time. Cambiarlas requiere reiniciar Vite.


### 5. Arrancar el dev server

```bash
pnpm run dev
```

Abrir en el navegador `http://localhost:5173`.
