import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { Pool } from "pg";

import { AccessDeniedError, AuthenticateClient } from "../application/authenticate-client";
import { InvalidCpfError, normalizeCpf } from "../domain/cpf";
import { Rs256TokenIssuer } from "../infrastructure/jwt";
import { PostgresClientRepository } from "../infrastructure/postgres-client-repository";
import { getSecretJson } from "../infrastructure/secrets";
import { log } from "../shared/logger";

type DatabaseSecret = { DATABASE_URL: string; caPem: string };
type SigningSecret = { privateKeyPem: string; keyId: string };

let useCasePromise: Promise<AuthenticateClient> | undefined;

async function buildUseCase(): Promise<AuthenticateClient> {
  const databaseSecretArn = requiredEnv("DATABASE_SECRET_ARN");
  const signingSecretArn = requiredEnv("JWT_PRIVATE_KEY_SECRET_ARN");
  const [database, signing] = await Promise.all([
    getSecretJson<DatabaseSecret>(databaseSecretArn),
    getSecretJson<SigningSecret>(signingSecretArn)
  ]);
  const pool = new Pool({
    connectionString: database.DATABASE_URL,
    max: 2,
    ssl: { ca: database.caPem, rejectUnauthorized: true }
  });
  return new AuthenticateClient(
    new PostgresClientRepository(pool),
    new Rs256TokenIssuer({
      privateKeyPem: signing.privateKeyPem,
      keyId: signing.keyId,
      issuer: requiredEnv("JWT_ISSUER"),
      audience: requiredEnv("JWT_AUDIENCE"),
      expiresInSeconds: Number(process.env.JWT_EXPIRES_IN_SECONDS ?? "900")
    })
  );
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const correlationId = event.headers?.["x-correlation-id"] ?? event.requestContext.requestId;
  const startedAt = Date.now();
  try {
    const body = event.body ? JSON.parse(event.body) as { cpf?: unknown } : {};
    if (typeof body.cpf !== "string") return response(400, "CPF obrigatorio", correlationId);
    const cpf = normalizeCpf(body.cpf);
    useCasePromise ??= buildUseCase();
    const result = await (await useCasePromise).execute(cpf);
    log("info", "authentication_succeeded", { correlationId, durationMs: Date.now() - startedAt });
    return { statusCode: 200, headers: headers(correlationId), body: JSON.stringify(result) };
  } catch (error) {
    if (error instanceof InvalidCpfError) {
      log("warn", "authentication_invalid_cpf", { correlationId, durationMs: Date.now() - startedAt });
      return response(400, "CPF invalido", correlationId);
    }
    if (error instanceof AccessDeniedError) {
      log("warn", "authentication_denied", { correlationId, durationMs: Date.now() - startedAt });
      return response(401, "Acesso nao autorizado", correlationId);
    }
    log("error", "authentication_failed", {
      correlationId,
      durationMs: Date.now() - startedAt,
      errorType: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : "Erro desconhecido"
    });
    return response(500, "Erro interno", correlationId);
  }
};

function response(statusCode: number, message: string, correlationId: string) {
  return { statusCode, headers: headers(correlationId), body: JSON.stringify({ message }) };
}

function headers(correlationId: string) {
  return { "content-type": "application/json", "x-correlation-id": correlationId };
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variavel obrigatoria ausente: ${name}`);
  return value;
}
