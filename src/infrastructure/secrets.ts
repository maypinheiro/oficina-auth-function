import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({});
const cache = new Map<string, string>();

export async function getSecretJson<T>(secretId: string): Promise<T> {
  const cached = cache.get(secretId);
  if (cached) return JSON.parse(cached) as T;

  const response = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
  if (!response.SecretString) throw new Error(`Secret ${secretId} sem SecretString`);
  cache.set(secretId, response.SecretString);
  return JSON.parse(response.SecretString) as T;
}
