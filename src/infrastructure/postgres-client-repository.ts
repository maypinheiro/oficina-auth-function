import { Pool } from "pg";

import { ClientIdentity, ClientRepository, ClientStatus } from "../application/authenticate-client";

type ClientRow = { id: string; status: ClientStatus };

export class PostgresClientRepository implements ClientRepository {
  constructor(private readonly pool: Pool) {}

  async findByCpf(cpf: string): Promise<ClientIdentity | null> {
    const result = await this.pool.query<ClientRow>(
      'SELECT id, status FROM "Cliente" WHERE "cpfCnpj" = $1 LIMIT 1',
      [cpf]
    );
    return result.rows[0] ?? null;
  }
}
