import { AccessDeniedError, AuthenticateClient, ClientRepository, TokenIssuer } from "./authenticate-client";

describe("AuthenticateClient", () => {
  const tokens: TokenIssuer = { issue: jest.fn().mockResolvedValue({ token: "jwt", expiresIn: 900 }) };

  it("emite token somente para cliente ativo", async () => {
    const clients: ClientRepository = { findByCpf: jest.fn().mockResolvedValue({ id: "cliente-1", status: "ATIVO" }) };
    await expect(new AuthenticateClient(clients, tokens).execute("52998224725")).resolves.toEqual({
      token: "jwt",
      tokenType: "Bearer",
      expiresIn: 900
    });
  });

  it.each([null, { id: "cliente-1", status: "INATIVO" }, { id: "cliente-1", status: "BLOQUEADO" }])(
    "nega cliente inexistente ou impedido",
    async (client) => {
      const clients: ClientRepository = { findByCpf: jest.fn().mockResolvedValue(client) };
      await expect(new AuthenticateClient(clients, tokens).execute("52998224725")).rejects.toBeInstanceOf(AccessDeniedError);
    }
  );
});
