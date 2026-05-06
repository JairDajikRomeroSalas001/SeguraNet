export function maskDni(dni: string): string {
  if (!dni || dni.length < 8) return dni;
  return `${dni.substring(0, 3)}****${dni.substring(7)}`;
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 9) return phone;
  return `${phone.substring(0, 3)}***${phone.substring(6)}`;
}
