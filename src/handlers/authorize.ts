import { APIGatewayRequestAuthorizerEventV2, APIGatewaySimpleAuthorizerWithContextResult } from "aws-lambda";

import jwt from "jsonwebtoken";

import { verifyAdminToken, verifyClientToken } from "../infrastructure/jwt";
import { getSecretJson } from "../infrastructure/secrets";
import { log } from "../shared/logger";

type AuthorizerContext = { clientId: string; scope: string };

export async function handler(
  event: APIGatewayRequestAuthorizerEventV2
): Promise<APIGatewaySimpleAuthorizerWithContextResult<AuthorizerContext>> {
  const correlationId = event.headers?.["x-correlation-id"] ?? event.requestContext.requestId;
  try {
    const authorization = event.headers?.authorization ?? event.headers?.Authorization;
    if (!authorization?.startsWith("Bearer ")) return { isAuthorized: false, context: emptyContext() };
    const token = authorization.slice("Bearer ".length);
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || decoded.header.alg === "none") throw new Error("Algoritmo invalido");

    let identity: AuthorizerContext;
    if (decoded.header.alg === "RS256") {
      const publicKeyPem = Buffer.from(requiredEnv("JWT_PUBLIC_KEY_BASE64"), "base64").toString("utf8");
      identity = await verifyClientToken(
        token,
        publicKeyPem,
        requiredEnv("JWT_ISSUER"),
        requiredEnv("JWT_AUDIENCE")
      );
    } else if (decoded.header.alg === "HS256") {
      const adminSecret = await getSecretJson<{ JWT_SECRET: string }>(requiredEnv("ADMIN_AUTH_SECRET_ID"));
      identity = verifyAdminToken(token, adminSecret.JWT_SECRET);
    } else {
      throw new Error("Algoritmo nao permitido");
    }
    log("info", "authorization_succeeded", { correlationId, clientId: identity.clientId, scope: identity.scope });
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
