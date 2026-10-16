# Crea tu Mat — API independiente

Esta API **no** modifica `checkout-api` ni el checkout normal de la tienda.

## Endpoints (Lambda Node.js 20+)

Handler: `src/index.handler` (ES module)

- `POST /quote`: body `{"quantity":5,"promotion":"fiveFour"}`
- `POST /checkout`: mismo body; crea una sesion de Stripe cuando la API este habilitada.
- `GET /session?session_id=cs_...`: valida el pago con Stripe en Lambda y devuelve datos limitados para el comprobante de Next.js; requiere configurar esta ruta en API Gateway.
- `POST /webhook`: recibe eventos firmados de Stripe con cuerpo **raw**, sin alterarlo y sin autenticacion de API Gateway que impida a Stripe enviar eventos. Verifica firma, fuente y total en backend; no guarda pedidos en otra base de datos.
- `OPTIONS`: preflight CORS para el origen permitido.

En API Gateway HTTP API / Lambda Function URL se deben definir correctamente la ruta y CORS; no dar acceso publico a secretos. La API solo acepta promocion y cantidad. No guarda logos, ni exige diseño.

## Variables de entorno de la Lambda

- `PERSONALIZED_MAT_STRIPE_SECRET_NAME`: nombre o ARN del secreto dedicado en AWS Secrets Manager. El secreto contiene la clave `sk_test_...` o `sk_live_...` como texto o JSON `{"STRIPE_SECRET_KEY":"..."}`. La Lambda necesita permiso IAM `secretsmanager:GetSecretValue` **solo para este secreto**. No guardar la clave directamente en Lambda ni en Amplify.
- `PERSONALIZED_MAT_SITE_ORIGIN`: origen publico exacto del sitio, por ejemplo `https://www.melocotonmove.com`, sin slash final, query ni ruta. Usado en Stripe redirects y CORS.
- `PERSONALIZED_MAT_WEBHOOK_SECRET`: secreto `whsec_...` del destino Webhook de **esta API**, distinto al webhook de ecommerce. Necesario para verificar notificaciones; no compartir ni subir a GitHub.
- `PERSONALIZED_MAT_CHECKOUT_READY=true`: habilita el inicio de Checkout solo despues de configurar y validar Stripe en test mode. En otro caso devuelve 503.

## Variable publica del frontend

- `NEXT_PUBLIC_PERSONALIZED_MAT_API_URL`: URL base publica de la API independiente (sin `/checkout` ni slash final). La app envia solo cantidad y promocion.

**Importante:** un `npm run build` exitoso del frontend no despliega esta Lambda. Para desplegar, instalar dependencias dentro de esta carpeta con `npm install` y empaquetar `src/` + `node_modules/` + `package.json` para AWS. Comprobar configuracion TLS, CORS, rutas y URL de retorno en entorno de prueba.

## Registro y seguimiento

Stripe Checkout es el registro de los pagos. Las sesiones guardan metadata `source=melocoton_personalized_mat`, cantidad fisica de mats, promocion, unidades bonificadas, total, plazo y envio por cotizar; Stripe recopila email y telefono. El equipo debe consultar las ventas en Stripe y contactar a los clientes para ultimar diseño y envio. No hay sistema automatico de seguimiento ni emails propios.

La ruta `/success?session_id=...` verifica server-side si la sesion esta pagada y genera un comprobante PDF; el recibo oficial de Stripe se ofrece cuando Stripe proporciona `receipt_url`. La página `success` consulta `GET /session` de esta Lambda y no necesita una segunda clave Stripe en Amplify. La tienda normal sigue usando su propia clave y webhook.

**No activar cobros reales** sin realizar primero una compra de prueba completa, incluyendo retorno a /success y comprobacion manual de los datos en Stripe.

## Pruebas

```sh
npm test
```

## Activación de webhook de prueba

1. Subir nuevo ZIP de esta API, mantener el handler `src/index.handler`.
2. API Gateway HTTP API: crear `POST /webhook`, vinculada a la misma Lambda; no requiere CORS, pues Stripe realiza llamadas servidor a servidor. No usar un authorizer de navegador para esta ruta.
3. En Stripe **modo prueba** > Webhooks/Event destinations, crear destino HTTPS `https://0d9zytaxhf.execute-api.us-east-1.amazonaws.com/default/webhook` y seleccionar los eventos `checkout.session.completed` y `checkout.session.async_payment_succeeded`. Confirmar stage real antes de registrar URL.
4. Copiar **sin mostrarlo aquí** el signing secret `whsec_...` del destino a `PERSONALIZED_MAT_WEBHOOK_SECRET` de esta Lambda. No reutilizar el webhook secreto de la tienda normal.
5. Hacer una entrega de prueba desde Stripe y comprobar HTTP 200 en Webhooks; un evento ajeno o no pagado se ignora, firma incorrecta devuelve 400 y una cantidad/importe incoherente devuelve 500 para permitir el reintento.

**Alcance:** Stripe es el registro; el webhook verifica la notificación y escribe confirmaciones sin datos personales en CloudWatch, pero no añade automáticamente órdenes al panel administrativo, ni notifica al equipo, ni crea una lista de pedidos pendiente. Para seguimiento, revisar los pagos y metadatos en Stripe. El recibo de `/success` consulta la sesión en Stripe y no depende de que haya llegado el webhook.

## Antes de desplegar la nueva versión

1. Crear secreto **independiente** en Secrets Manager; no reutilizar ni modificar el secreto del checkout normal.
2. Asignar a la función IAM únicamente `secretsmanager:GetSecretValue` sobre el ARN del nuevo secreto y configurar `PERSONALIZED_MAT_STRIPE_SECRET_NAME`.
3. Agregar ruta **GET /session** al API Gateway de esta Lambda (además de POST /quote, /checkout y /webhook). No asignar authorizer que impida la consulta SSR de Amplify; el session_id es un token de acceso no adivinable y la respuesta lleva no-store.
4. Publicar nuevo ZIP desde `bash personalized-mat-api/package-lambda.sh` y comprobar el flujo de prueba de nuevo antes de pasar a modo real.
5. Mantener `NEXT_PUBLIC_PERSONALIZED_MAT_API_URL` en Amplify y `STRIPE_SECRET_KEY` existente de la tienda normal. Eliminar `PERSONALIZED_MAT_STRIPE_SECRET_KEY` en Amplify **después** de validar el nuevo comprobante.
6. Para producción, actualizar el secreto dedicado con la clave Live y configurar el webhook Live correspondiente; ajustar `PERSONALIZED_MAT_SITE_ORIGIN=https://www.melocotonmove.com`.

El runtime de AWS Lambda Node.js incluye AWS SDK v3 utilizado para leer Secrets Manager.
