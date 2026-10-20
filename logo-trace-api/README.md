# Logo trace API (independent AWS Lambda)
Only source code is versioned here. No Lambda or AWS resources are deployed automatically.

## Local test
```bash
cd logo-trace-api
npm install
ALLOWED_ORIGIN=http://localhost:3000 npm start
```
The endpoint is POST /trace with raw PNG/JPG/WEBP bytes and Content-Type: image/png (or equivalent). Response has previewPng as base64 PNG and svg as a Potrace vector. Client uses previewPng only. Set NEXT_PUBLIC_LOGO_TRACE_API_URL=http://localhost:8080/trace in root .env.local. Restart Next.js.

## AWS Lambda
Build the Dockerfile as a Linux-compatible Lambda container, push to ECR, create Lambda and HTTP API route POST /trace (and OPTIONS), set ALLOWED_ORIGIN to your exact site origin; set client URL to API Gateway endpoint. Never put AWS credentials in NEXT_PUBLIC variables. Set memory, execution timeout, request size limits and API abuse mitigation before public release.

This converts simple, high-contrast logos. Photographs, colored marks, and detailed logos may be traced imperfectly. Users should see a clear fallback/error message. Trace results are NOT guaranteed to be LightBurn-ready. Production quality must be reviewed separately.

No logo is retained by the API and no S3 bucket is required. The customer downloads the entire customized mat PNG from the editor, not an isolated logo.
