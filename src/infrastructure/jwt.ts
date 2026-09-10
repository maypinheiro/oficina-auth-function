import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

import { TokenIssuer } from "../application/authenticate-client";

export type JwtConfiguration = {
  issuer: string;
  audience: string;
  privateKeyPem: string;
  keyId: string;
  expiresInSeconds: number;
};

export class Rs256TokenIssuer implements TokenIssuer {
  constructor(private readonly config: JwtConfiguration) {}

  async issue(clientId: string): Promise<{ token: string; expiresIn: number }> {
    const token = jwt.sign({ scope: "cliente" }, this.config.privateKeyPem, {
      algorithm: "RS256",
      keyid: this.config.keyId,
      subject: clientId,
      issuer: this.config.issuer,
      audience: this.config.audience,
      jwtid: randomUUID(),
      expiresIn: this.config.expiresInSeconds
    });
    return { token, expiresIn: this.config.expiresInSeconds };
  }
}

export async function verifyClientToken(token: string, publicKeyPem: string, issuer: string, audience: string) {
  const payload = jwt.verify(token, publicKeyPem, { issuer, audience, algorithms: ["RS256"] });
  if (typeof payload === "string" || payload.scope !== "cliente" || !payload.sub) throw new Error("Escopo invalido");
  return { clientId: payload.sub, scope: "cliente" };
}
