import { generateKeyPairSync } from "node:crypto";
import jwt from "jsonwebtoken";

import { handler } from "./authorize";

const event = (authorization?: string) => ({
  version: "2.0",
  type: "REQUEST",
  routeArn: "arn:aws:execute-api:us-east-1:982623100545:api/stage/GET/resource",
  identitySource: authorization ? [authorization] : [],
  routeKey: "GET /resource",
  rawPath: "/resource",
  rawQueryString: "",
  headers: authorization ? { authorization } : {},
  requestContext: {
    accountId: "982623100545", apiId: "api", domainName: "api.example", domainPrefix: "api",
    http: { method: "GET", path: "/resource", protocol: "HTTP/1.1", sourceIp: "127.0.0.1", userAgent: "jest" },
    requestId: "request-1", routeKey: "GET /resource", stage: "test", time: "", timeEpoch: 0
  }
});

describe("Lambda Authorizer", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });

  beforeAll(() => {
    process.env.JWT_PUBLIC_KEY_BASE64 = Buffer.from(publicKey.export({ type: "spki", format: "pem" })).toString("base64");
    process.env.JWT_ISSUER = "oficina-auth";
    process.env.JWT_AUDIENCE = "oficina-api";
  });

  it("nega quando não há bearer token", async () => {
    await expect(handler(event() as never)).resolves.toMatchObject({ isAuthorized: false });
  });

  it("autoriza token de cliente válido", async () => {
    const token = jwt.sign({ scope: "cliente" }, privateKey, {
      algorithm: "RS256", subject: "cliente-1", issuer: "oficina-auth", audience: "oficina-api"
    });
    await expect(handler(event(`Bearer ${token}`) as never)).resolves.toEqual({
      isAuthorized: true,
      context: { clientId: "cliente-1", scope: "cliente" }
    });
  });

  it("nega token inválido", async () => {
    await expect(handler(event("Bearer invalido") as never)).resolves.toMatchObject({ isAuthorized: false });
  });
});
