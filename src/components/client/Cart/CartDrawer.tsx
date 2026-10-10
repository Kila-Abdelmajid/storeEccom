'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { XMarkIcon, TrashIcon, PlusIcon, MinusIcon, UserIcon } from '@heroicons/react/24/outline';
import { formatPrice } from '@/utils/format';
import { useToast } from '@/contexts/ToastContext';
import { triggerCartUpdate } from '@/lib/cartEvents';
import CheckoutModal from './CheckoutModal';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import * as cartStorage from '@/lib/cartStorage';

interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subtotal, setSubtotal] = useState(0);
  const [updating, setUpdating] = useState<number | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const { showToast } = useToast();

  const isLoggedIn = !!session;

  const fetchCart = async () => {
    if (isLoggedIn) {
      // Fetch from API
      try {
        setLoading(true);
        const res = await fetch('/api/ClientApi/cart');
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCart(data);
        const total = data.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);
        setSubtotal(total);
      } catch {
        showToast('Failed to load cart', 'error');
      } finally {
        setLoading(false);
      }
    } else {
      // Use localStorage
      const guestCart = cartStorage.getGuestCart();
      setCart(guestCart);
      const total = guestCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      setSubtotal(total);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !authLoading) {
      fetchCart();
    }
  }, [isOpen, authLoading, isLoggedIn]);

  const updateQuantity = async (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdating(item.id);
    if (isLoggedIn) {
      try {
        const res = await fetch('/api/ClientApi/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItemId: item.id, quantity: newQuantity }),
        });
        if (res.ok) {
          await fetchCart();
          triggerCartUpdate();
          showToast('Quantity updated', 'success');
        } else {
          const error = await res.json();
          throw new Error(error.error);
        }
      } catch (err: any) {
        showToast(err.message || 'Update failed', 'error');
      } finally {
        setUpdating(null);
      }
    } else {
      // Update guest cart
      const updatedCart = cartStorage.updateGuestCartQuantity(item.productId, newQuantity);
      setCart(updatedCart);
      const total = updatedCart.reduce((sum, i) => sum + i.price * i.quantity, 0);
      setSubtotal(total);
      setUpdating(null);
      triggerCartUpdate(); // update badge
    }
  };

  const removeItem = async (item: CartItem) => {
    setUpdating(item.id);
    if (isLoggedIn) {
      try {
        const res = await fetch(`/api/ClientApi/cart?cartItemId=${item.id}`, { method: 'DELETE' });
        if (res.ok) {
          await fetchCart();
          triggerCartUpdate();
          showToast('Item removed', 'success');
        } else {
          const error = await res.json();
          throw new Error(error.error);
        }
      } catch (err: any) {
        showToast(err.message || 'Remove failed', 'error');
      } finally {
        setUpdating(null);
      }
    } else {
      const updatedCart = cartStorage.removeFromGuestCart(item.productId);
      setCart(updatedCart);
      const total = updatedCart.reduce((sum, i) => sum + i.price * i.quantity, 0);
      setSubtotal(total);
      setUpdating(null);
      triggerCartUpdate();
    }
  };

  const handleCheckoutClick = () => {
    if (!isLoggedIn) {
      // Save current URL to redirect back after login
      showToast('Please log in to proceed to checkout', 'error');
      return;
    }
    if (cart.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }
    setCheckoutModalOpen(true);
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999] overflow-hidden">
        <div
          className="absolute left-0 top-[64px] md:top-[80px] w-full h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="absolute right-0 top-[64px] md:top-[80px] h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-l border-white/50 animate-slideIn">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
                <h2 className="text-xl font-bold text-slate-800">My Cart</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition">
                <XMarkIcon className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {authLoading ? (
                <div className="text-center py-8 text-slate-500">Loading...</div>
              ) : loading ? (
                <div className="text-center py-8 text-slate-500">Loading...</div>
              ) : cart.length === 0 ? (
                <div className="text-center py-8 text-slate-500">Your cart is empty</div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-3 pb-4 border-b border-slate-100">
                    <div className="w-20 h-20 relative bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-800">{item.name}</h3>
                      <div className="text-sm text-amber-600">{formatPrice(item.price)}</div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 border border-slate-200 rounded-full px-2 py-0.5">
                          <button
                            onClick={() => updateQuantity(item, item.quantity - 1)}
                            disabled={updating === item.id}
                            className="p-1 text-slate-500 hover:text-amber-600 disabled:opacity-50"
                          >
                            <MinusIcon className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item, item.quantity + 1)}
                            disabled={updating === item.id}
                            className="p-1 text-slate-500 hover:text-amber-600 disabled:opacity-50"
                          >
                            <PlusIcon className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item)}
                          className="p-1 text-rose-500 hover:text-rose-700 transition"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="font-semibold text-slate-800">{formatPrice(item.price * item.quantity)}</div>
                  </div>
                ))
              )}
            </div>

            {/* Footer – show only if cart has items */}
            {cart.length > 0 && (
              <div className="border-t border-slate-100 p-5 space-y-4 bg-white/80">
                <div className="flex justify-between text-lg font-bold text-slate-800">
                  <span>Total</span>
                  <span className="text-amber-600">{formatPrice(subtotal)}</span>
                </div>
                <button
                  onClick={handleCheckoutClick}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  Checkout
                </button>
                <button onClick={onClose} className="w-full text-sm text-slate-500 hover:text-slate-700 transition">
                  Continue shopping
                </button>
              </div>
            )}
          </div>
        </div>
        <style jsx>{`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          .animate-slideIn {
            animation: slideIn 0.3s ease-out;
          }
        `}</style>
      </div>
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onSuccess={() => {
          setCheckoutModalOpen(false);
          onClose();
          triggerCartUpdate();
        }}
        subtotal={subtotal}
        itemsCount={cart.reduce((s, i) => s + i.quantity, 0)}
      />
    </>,
    document.body
  );
}