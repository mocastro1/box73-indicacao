/**
 * Utilitários para máscaras e validações de CPF e telefone
 */

export function formatCpfMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (!digits.length) return ''
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function formatTelefoneMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (!digits.length) return ''
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export function formatCpfDisplay(cpf: string): string {
  if (!cpf) return '-'
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatTelefoneDisplay(telefone: string): string {
  if (!telefone) return '-'
  const digits = telefone.replace(/\D/g, '')
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return telefone
}

export function cleanDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  
  if (!digits || digits.length !== 11 || /^([0-9])\1+$/.test(digits)) {
    return false
  }
  
  const nums = digits.split('').map(Number)
  
  for (let t = 9; t < 11; t += 1) {
    const sum = nums
      .slice(0, t)
      .reduce((acc, num, index) => acc + num * (t + 1 - index), 0)
    const check = (sum * 10) % 11 % 10
    if (check !== nums[t]) return false
  }
  
  return true
}
