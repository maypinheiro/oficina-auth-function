import { handler } from "./authenticate";

const event = (body?: string) => ({
  version: "2.0",
  routeKey: "POST /auth/clientes",
  rawPath: "/auth/clientes",
  rawQueryString: "",
  headers: {},
  requestContext: {
    accountId: "982623100545", apiId: "api", domainName: "api.example", domainPrefix: "api",
    http: { method: "POST", path: "/auth/clientes", protocol: "HTTP/1.1", sourceIp: "127.0.0.1", userAgent: "jest" },
    requestId: "request-1", routeKey: "POST /auth/clientes", stage: "test", time: "", timeEpoch: 0
  },
  isBase64Encoded: false,
  body
});

describe("handler de autenticação", () => {
  it("exige CPF", async () => {
    await expect(handler(event("{}") as never, {} as never, jest.fn())).resolves.toMatchObject({ statusCode: 400 });
  });

  it("rejeita CPF inválido antes de acessar segredos ou banco", async () => {
    const response = await handler(event(JSON.stringify({ cpf: "111.111.111-11" })) as never, {} as never, jest.fn()) as { body?: string; statusCode: number };
    expect(response).toMatchObject({ statusCode: 400 });
    expect(JSON.parse(response?.body ?? "{}")).toEqual({ message: "CPF invalido" });
  });

  it("trata JSON malformado sem expor detalhes", async () => {
    await expect(handler(event("{") as never, {} as never, jest.fn())).resolves.toMatchObject({ statusCode: 500 });
  });
});
