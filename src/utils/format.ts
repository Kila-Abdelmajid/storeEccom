// utils/format.ts

export const formatPrice = (price: number | string): string => {
  const numericPrice = typeof price === 'number' ? price : parseFloat(price);
  if (isNaN(numericPrice)) return '0.00 MAD';
  return `${numericPrice.toFixed(2)} MAD`;
};

export const calculateDiscountPercentage = (price: number, originalPrice?: number, discount?: number): number => {
  if (discount) return discount;
  const numericPrice = typeof price === 'number' ? price : parseFloat(price);
  const numericOriginal = typeof originalPrice === 'number' ? originalPrice : parseFloat(originalPrice as any);
  if (!isNaN(numericOriginal) && numericOriginal > numericPrice) {
    return Math.round(((numericOriginal - numericPrice) / numericOriginal) * 100);
  }
  return 0;
};