export class InvalidCpfError extends Error {
  constructor() {
    super("CPF invalido");
    this.name = "InvalidCpfError";
  }
}

export function normalizeCpf(rawValue: string): string {
  const value = rawValue.replace(/\D/g, "");
  if (value.length !== 11 || /^(\d)\1{10}$/.test(value)) {
    throw new InvalidCpfError();
  }

  const digits = value.split("").map(Number);
  const first = calculateDigit(digits.slice(0, 9), 10);
  const second = calculateDigit([...digits.slice(0, 9), first], 11);

  if (digits[9] !== first || digits[10] !== second) {
    throw new InvalidCpfError();
  }

  return value;
}

function calculateDigit(digits: number[], initialWeight: number): number {
  const total = digits.reduce((sum, digit, index) => sum + digit * (initialWeight - index), 0);
  const remainder = (total * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}
