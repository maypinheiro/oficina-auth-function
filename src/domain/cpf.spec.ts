import { InvalidCpfError, normalizeCpf } from "./cpf";

describe("CPF", () => {
  it("normaliza e valida CPF", () => {
    expect(normalizeCpf("529.982.247-25")).toBe("52998224725");
  });

  it.each(["123", "111.111.111-11", "529.982.247-00"])("rejeita %s", (cpf) => {
    expect(() => normalizeCpf(cpf)).toThrow(InvalidCpfError);
  });
});
