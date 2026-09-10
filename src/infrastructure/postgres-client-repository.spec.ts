import { Pool } from "pg";

import { PostgresClientRepository } from "./postgres-client-repository";

describe("PostgresClientRepository", () => {
  it("usa consulta parametrizada e retorna identidade mínima", async () => {
    const query = jest.fn().mockResolvedValue({ rows: [{ id: "cliente-1", status: "ATIVO" }] });
    const repository = new PostgresClientRepository({ query } as unknown as Pool);
    await expect(repository.findByCpf("52998224725")).resolves.toEqual({ id: "cliente-1", status: "ATIVO" });
    expect(query).toHaveBeenCalledWith(expect.stringContaining('WHERE "cpfCnpj" = $1'), ["52998224725"]);
  });

  it("retorna null quando não encontra", async () => {
    const repository = new PostgresClientRepository({ query: jest.fn().mockResolvedValue({ rows: [] }) } as unknown as Pool);
    await expect(repository.findByCpf("52998224725")).resolves.toBeNull();
  });
});
