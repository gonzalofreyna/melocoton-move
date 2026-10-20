# Melocotón Logo Trace — AWS Lambda independiente (ZIP)

El código permanece en el mismo repositorio, pero se ejecuta en AWS Lambda, separado de Next.js y Amplify Hosting.

## Infraestructura de pruebas
- Lambda: `melocoton-logo-trace` (Node.js 22.x, x86_64, 1024 MB, timeout 30 s, handler `index.handler`).
- API Gateway HTTP API: `POST https://fl1yl99528.execute-api.us-east-1.amazonaws.com/default/trace`.
- CORS del gateway: permitir `http://localhost:3000`, método POST y header Content-Type; antes de publicar, añadir el dominio real de la tienda.
- La respuesta JSON contiene `previewPng`, un PNG con transparencia codificado en base64.

## Conectar la web local
Agregar en el `.env.local` de la raíz del repositorio:

```env
NEXT_PUBLIC_LOGO_TRACE_API_URL=https://fl1yl99528.execute-api.us-east-1.amazonaws.com/default/trace
```

Reiniciar `npm run dev`. El componente `components/MatCustomizer.tsx` ya consume esta variable; no hay servidor Next.js adicional para procesar logos. Para producción, configurar la misma variable en Amplify **antes de compilar**, después de comprobar seguridad, CORS y calidad.

## Preparar actualizaciones del ZIP desde macOS Apple Silicon

Desde la raíz del proyecto:

```bash
mkdir -p lambda-package
cp logo-trace-api/package.json lambda-package/package.json
npm install --prefix lambda-package --omit=dev --include=optional --os=linux --cpu=x64 --libc=glibc
cp logo-trace-api/src/process.mjs lambda-package/process.mjs
```

Crear `lambda-package/index.mjs` con una exportación `handler` que lea el cuerpo binario de API Gateway v2 (`event.isBase64Encoded`) y llame a `traceLogo`. El `index.mjs` subido a AWS por consola es la fuente de verdad del handler actual; **el antiguo `src/lambda.mjs` del proyecto no es idéntico y no debe sustituirlo sin adaptarlo**. Crear ZIP con `index.mjs`, `process.mjs`, `package.json` y `node_modules/` en la raíz, y subirlo por la consola Lambda (Code → Upload from → .zip file). Los artefactos locales están ignorados por Git.

## Validación
Una solicitud `curl` con Content-Type image/png a la ruta de API Gateway respondió HTTP 200 y `previewPng`. Eso confirma el funcionamiento del procesador desde línea de comandos, **no valida todavía CORS del navegador, fidelidad de todos los logos, ni despliegue de Amplify**.

No persistimos archivos de logos ni los almacenamos en S3. El editor mantiene la compra accesible cuando hay un fallo de trazado. Antes de producción: revisar las dependencias con vulnerabilidades, limitar solicitudes/tamaño, configurar alertas de costes y probar trazados reales y el checkout.
