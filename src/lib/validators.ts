// lib/validators.ts
export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  return re.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const re = /^(?:(?:\+|00)212|0)[5-7]\d{8}$/; // Maroc +212 / 06... / 05...
  return re.test(phone);
};

export const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score === 0) return { score: 0, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' };
  if (score <= 4) return { score: 2, label: 'Medium', color: 'bg-yellow-500' };
  return { score: 3, label: 'Strong', color: 'bg-green-500' };
};