# Cuentas Claras

App de gastos compartidos (tipo Splitwise) con soporte para pesos argentinos y Mercado Pago.

## Stack

- **Frontend:** React + Tailwind CSS v4 (Vite)
- **Backend:** FastAPI + SQLAlchemy + SQLite
- **Auth:** JWT + bcrypt
- **Pagos:** Mercado Pago Checkout Pro

## Estructura

```
/frontend   -> React app (Vite)
/backend    -> FastAPI app
```

## Correr localmente

### Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Editar .env con tus credenciales

uvicorn app.main:app --reload
```

El backend corre en `http://localhost:8000`. Docs en `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend corre en `http://localhost:5173`. El proxy de Vite redirige `/api` al backend.

## Deploy

### Frontend (Vercel)

1. Conectar el repo en Vercel
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Variable de entorno: `VITE_API_URL` = URL del backend en Render

### Backend (Render)

1. Conectar el repo en Render
2. Root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Variables de entorno:
   - `SECRET_KEY` (generar una clave segura)
   - `MERCADOPAGO_ACCESS_TOKEN` (tu token de MP)
   - `FRONTEND_URL` (URL de Vercel)
   - `BACKEND_URL` (URL de Render)

## Mercado Pago

1. Crear cuenta en [Mercado Pago Developers](https://www.mercadopago.com.ar/developers)
2. Crear aplicacion y obtener Access Token
3. Configurar `MERCADOPAGO_ACCESS_TOKEN` en `.env`
4. Para testing usar credenciales de prueba

## Funcionalidades

- Registro/login con JWT
- Crear grupos e invitar por link
- Registrar gastos (partes iguales, porcentaje, monto exacto)
- Ver balances y deudas simplificadas
- Saldar deudas manualmente o con Mercado Pago
- Historial completo de gastos y pagos
