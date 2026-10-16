# Crea tu Mat — API independiente

Esta API **no** modifica `checkout-api` ni el checkout normal de la tienda.

## Endpoints (Lambda Node.js 20+)

Handler: `src/index.handler` (ES module)

- `POST /quote`: body `{"quantity":5,"promotion":"fiveFour"}`
- `POST /checkout`: mismo body; crea una sesion de Stripe cuando la API este habilitada.
- `OPTIONS`: preflight CORS para el origen permitido.

En API Gateway HTTP API / Lambda Function URL se deben definir correctamente la ruta y CORS; no dar acceso publico a secretos. La API solo acepta promocion y cantidad. No guarda logos, ni exige diseño.

## Variables de entorno de la Lambda

- `STRIPE_SECRET_KEY`: clave secreta de Stripe, primero modo prueba. Nunca enviar al frontend.
- `PERSONALIZED_MAT_SITE_ORIGIN`: origen publico exacto del sitio, por ejemplo `https://www.melocotonmove.com`, sin slash final, query ni ruta. Usado en Stripe redirects y CORS.
- `PERSONALIZED_MAT_CHECKOUT_READY=true`: habilita el inicio de Checkout solo despues de configurar y validar Stripe en test mode. En otro caso devuelve 503.

## Variable publica del frontend

- `NEXT_PUBLIC_PERSONALIZED_MAT_API_URL`: URL base publica de la API independiente (sin `/checkout` ni slash final). La app envia solo cantidad y promocion.

**Importante:** un `npm run build` exitoso del frontend no despliega esta Lambda. Para desplegar, instalar dependencias dentro de esta carpeta con `npm install` y empaquetar `src/` + `node_modules/` + `package.json` para AWS. Comprobar configuracion TLS, CORS, rutas y URL de retorno en entorno de prueba.

## Registro y seguimiento

Stripe Checkout es el registro de los pagos. Las sesiones guardan metadata `source=melocoton_personalized_mat`, cantidad fisica de mats, promocion, unidades bonificadas, total, plazo y envio por cotizar; Stripe recopila email y telefono. El equipo debe consultar las ventas en Stripe y contactar a los clientes para ultimar diseño y envio. No hay sistema automatico de seguimiento ni emails propios.

La ruta `/success?session_id=...` verifica server-side si la sesion esta pagada y genera un comprobante PDF; el recibo oficial de Stripe se ofrece cuando Stripe proporciona `receipt_url`. La página `success` requiere acceso backend al mismo ambiente/cuenta de Stripe utilizado por esta API.

**No activar cobros reales** sin realizar primero una compra de prueba completa, incluyendo retorno a /success y comprobacion manual de los datos en Stripe.

## Pruebas

```sh
npm test
```
