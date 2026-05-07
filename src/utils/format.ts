// utils/format.ts

export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};

export const calculateDiscountPercentage = (price: number, originalPrice?: number, discount?: number): number => {
  if (discount) return discount;
  if (originalPrice && originalPrice > price) {
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  }
  return 0;
};