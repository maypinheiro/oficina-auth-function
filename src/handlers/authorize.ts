import { APIGatewayRequestAuthorizerEventV2, APIGatewaySimpleAuthorizerWithContextResult } from "aws-lambda";

import { verifyClientToken } from "../infrastructure/jwt";
import { log } from "../shared/logger";

type AuthorizerContext = { clientId: string; scope: string };

export async function handler(
  event: APIGatewayRequestAuthorizerEventV2
): Promise<APIGatewaySimpleAuthorizerWithContextResult<AuthorizerContext>> {
  const correlationId = event.headers?.["x-correlation-id"] ?? event.requestContext.requestId;
  try {
    const authorization = event.headers?.authorization ?? event.headers?.Authorization;
    if (!authorization?.startsWith("Bearer ")) return { isAuthorized: false, context: emptyContext() };
    const publicKeyPem = Buffer.from(requiredEnv("JWT_PUBLIC_KEY_BASE64"), "base64").toString("utf8");
    const identity = await verifyClientToken(
      authorization.slice("Bearer ".length),
      publicKeyPem,
      requiredEnv("JWT_ISSUER"),
      requiredEnv("JWT_AUDIENCE")
    );
    log("info", "authorization_succeeded", { correlationId, clientId: identity.clientId });
    return { isAuthorized: true, context: identity };
  } catch {
    log("warn", "authorization_denied", { correlationId });
    return { isAuthorized: false, context: emptyContext() };
  }
}

function emptyContext(): AuthorizerContext {
  return { clientId: "", scope: "" };
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variavel obrigatoria ausente: ${name}`);
  return value;
}
