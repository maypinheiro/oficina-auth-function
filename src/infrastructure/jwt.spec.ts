import { generateKeyPairSync } from "node:crypto";
import jwt from "jsonwebtoken";

import { Rs256TokenIssuer, verifyClientToken } from "./jwt";

describe("JWT RS256", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();

  it("emite e valida claims de cliente", async () => {
    const issuer = new Rs256TokenIssuer({
      issuer: "oficina-auth",
      audience: "oficina-api",
      privateKeyPem,
      keyId: "key-1",
      expiresInSeconds: 900
    });
    const issued = await issuer.issue("cliente-1");
    await expect(verifyClientToken(issued.token, publicKeyPem, "oficina-auth", "oficina-api")).resolves.toEqual({
      clientId: "cliente-1",
      scope: "cliente"
    });
    expect(jwt.decode(issued.token, { complete: true })?.header).toMatchObject({ alg: "RS256", kid: "key-1" });
  });

  it("rejeita audience incorreta", async () => {
    const token = jwt.sign({ scope: "cliente" }, privateKeyPem, {
      algorithm: "RS256", subject: "cliente-1", issuer: "oficina-auth", audience: "outra-api"
    });
    await expect(verifyClientToken(token, publicKeyPem, "oficina-auth", "oficina-api")).rejects.toThrow();
  });
});
