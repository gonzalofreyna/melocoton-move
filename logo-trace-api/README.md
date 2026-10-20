# Logo tracing module for Next.js / Amplify Hosting

The logo tracing module lives in this repository and runs inside Next.js, using the **same-origin** `POST /api/trace-logo` route defined in `pages/api/trace-logo.js`. It does not require a separately deployed AWS Lambda, API Gateway, S3 or Docker image.

The root package's `predev` and `prebuild` install the dependencies inside this folder. Amplify Hosting must deploy Next.js with SSR support (not static export), Node 20, and must run `npm run build` so the prebuild script executes. Test the live Amplify deployment after publishing.

## Local test
```bash
# from repository root:
npm run dev
```
No second terminal or `NEXT_PUBLIC_LOGO_TRACE_API_URL` is necessary; remove the old variable from `.env.local`.

The API accepts raw PNG/JPG/WEBP in a POST request with its image content type, max 5 MB, returning a base64 transparent PNG as `previewPng`. SVG files bypass this API in the editor. On processing errors the editor falls back to its browser-side cleanup with a visible message; payment remains accessible.

Images are processed in memory and not stored. This is a bitmap-to-vector approximation intended for preview, **not** a guarantee of laser-ready production art. Review detailed or multicolor logos.

Legacy standalone Lambda, server and Docker scaffolding remains in `src/lambda.mjs`, `src/server.mjs` and `Dockerfile` for now, but none of them runs in Amplify. They can be removed in a separate cleanup after deployment verification.

Before merging, test `npm run build`, uploads through `/api/trace-logo`, downloads, and the checkout flow locally, then validate deployment in an Amplify preview environment.
