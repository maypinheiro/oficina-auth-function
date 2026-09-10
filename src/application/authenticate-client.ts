export type ClientStatus = "ATIVO" | "INATIVO" | "BLOQUEADO";

export type ClientIdentity = {
  id: string;
  status: ClientStatus;
};

export interface ClientRepository {
  findByCpf(cpf: string): Promise<ClientIdentity | null>;
}

export interface TokenIssuer {
  issue(clientId: string): Promise<{ token: string; expiresIn: number }>;
}

export class AccessDeniedError extends Error {
  constructor() {
    super("Acesso nao autorizado");
    this.name = "AccessDeniedError";
  }
}

export class AuthenticateClient {
  constructor(
    private readonly clients: ClientRepository,
    private readonly tokens: TokenIssuer
  ) {}

  async execute(cpf: string): Promise<{ token: string; tokenType: "Bearer"; expiresIn: number }> {
    const client = await this.clients.findByCpf(cpf);
    if (!client || client.status !== "ATIVO") {
      throw new AccessDeniedError();
    }

    const issued = await this.tokens.issue(client.id);
    return { token: issued.token, tokenType: "Bearer", expiresIn: issued.expiresIn };
  }
}
