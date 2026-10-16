import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

let cachedSecret;
const secretsClient = new SecretsManagerClient({});

export async function getStripeSecret(env = process.env, dependencies = {}) {
  if (dependencies.secret) return dependencies.secret;
  if (cachedSecret) return cachedSecret;
  const name = env.PERSONALIZED_MAT_STRIPE_SECRET_NAME;
  if (!name) throw new Error("PERSONALIZED_MAT_STRIPE_SECRET_NAME no configurado");
  const client = dependencies.client || secretsClient;
  const response = await client.send(new GetSecretValueCommand({ SecretId: name }));
  const raw = response.SecretString || (response.SecretBinary && Buffer.from(response.SecretBinary).toString("utf8"));
  if (!raw) throw new Error("Secreto Stripe vacío");
  let value = raw;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") value = parsed;
    else value = parsed.STRIPE_SECRET_KEY || parsed.PERSONALIZED_MAT_STRIPE_SECRET_KEY;
  } catch {}
  if (typeof value !== "string" || !/^sk_(test|live)_/.test(value)) throw new Error("Formato de secreto Stripe inválido");
  cachedSecret = value;
  return value;
}
