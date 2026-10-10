// lib/cartEvents.ts
export const triggerCartUpdate = () => {
  window.dispatchEvent(new Event('cart-updated'));
};