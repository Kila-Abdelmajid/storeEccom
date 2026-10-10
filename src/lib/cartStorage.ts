// lib/cartStorage.ts
export interface CartItem {
  id: number;          // temporary client-side id (Date.now())
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
}

const STORAGE_KEY = 'guest_cart';

export function getGuestCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveGuestCart(cart: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

export function clearGuestCart() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function addToGuestCart(product: Omit<CartItem, 'id' | 'quantity'>) {
  const cart = getGuestCart();
  const existing = cart.find(item => item.productId === product.productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: Date.now(),
      productId: product.productId,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
      stock: product.stock,
    });
  }
  saveGuestCart(cart);
  return cart;
}

export function updateGuestCartQuantity(productId: number, quantity: number) {
  const cart = getGuestCart();
  const item = cart.find(i => i.productId === productId);
  if (item) {
    item.quantity = quantity;
    if (item.quantity <= 0) {
      return removeFromGuestCart(productId);
    }
    saveGuestCart(cart);
  }
  return cart;
}

export function removeFromGuestCart(productId: number) {
  const cart = getGuestCart().filter(i => i.productId !== productId);
  saveGuestCart(cart);
  return cart;
}

export function getGuestCartCount(): number {
  const cart = getGuestCart();
  return cart.reduce((sum, i) => sum + i.quantity, 0);
}