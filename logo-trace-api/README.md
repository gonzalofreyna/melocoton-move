# Melocotón Logo Trace — independent AWS Lambda

The code stays in the same GitHub repository, but is deployed independently as a Lambda **container image**. It is NOT imported by Next.js or AWS Amplify Hosting.

## Deployment
1. Build the `logo-trace-api/Dockerfile` into a Linux AWS Lambda container image, publish it to ECR, and create/update the Lambda from that image.
2. Expose the function with an API Gateway HTTP API route `POST /trace` and CORS preflight `OPTIONS /trace`, or an equivalent HTTPS endpoint that passes API Gateway v2 events.
3. Configure `ALLOWED_ORIGIN` on Lambda with the exact browser origin. For local testing use `http://localhost:3000`; for production use the actual storefront domain. A single-origin configuration needs extending before testing a second origin. Configure CORS on the gateway to allow the same origin, POST/OPTIONS, and the Content-Type header.
4. Set `NEXT_PUBLIC_LOGO_TRACE_API_URL` in the frontend environment (local `.env.local` and in Amplify environment variables before production deployment) to the **complete** HTTPS URL ending in `/trace`. Restart or rebuild Next.js after changing it.

The editor uploads raster PNG/JPG/WEBP to that URL. SVG is used directly. The response uses `previewPng` (base64 transparent PNG). On failure, the original image stays available for manual review; checkout is never blocked.

## Local isolated API testing
```bash
cd logo-trace-api
npm install --include=optional
ALLOWED_ORIGIN=http://localhost:3000 npm start
```
Then set `NEXT_PUBLIC_LOGO_TRACE_API_URL=http://localhost:8080/trace` in the Next.js root `.env.local`.

## Cautions
- Never embed AWS keys in `NEXT_PUBLIC_*` variables.
- Binary trace results can alter holes and fine lines; review real logos and test before enabling the feature in production.
- The service does not persist user logos; it processes them in memory.
- There is no ZIP to upload when using the provided Dockerfile; the standard path is ECR + Lambda container image.
- Avoid merging until actual AWS tracing and checkout have been tested.
