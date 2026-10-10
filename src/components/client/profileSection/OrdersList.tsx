'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/utils/format';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import OrderPrint from '@/components/client/profileSection/OrderPrint'; // adjust path

interface OrderItem {
  productId: number;
  name: string;
  image: string;
  quantity: number;
  priceAtPurchase: number;
}

interface Order {
  id: number;
  total: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'canceled';
  createdAt: string;
  items: OrderItem[];
}

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/ClientApi/orders');
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
            <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50">
        <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <p className="text-slate-500 font-medium">No orders yet</p>
        <Link href="/#shop" className="inline-block mt-2 text-amber-600 text-sm hover:underline">
          Start shopping →
        </Link>
      </div>
    );
  }

  const statusConfig = {
    pending: { label: 'Pending', class: 'bg-amber-100 text-amber-800' },
    confirmed: { label: 'Confirmed', class: 'bg-emerald-100 text-emerald-800' },
    delivered: { label: 'Delivered', class: 'bg-blue-100 text-blue-800' },
    canceled: { label: 'Canceled', class: 'bg-rose-100 text-rose-800' },
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {orders.map((order, idx) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all border border-white/50 overflow-hidden"
          >
            <div className="p-5">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-slate-500">#ORD-{order.id}</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig[order.status].class}`}>
                      {statusConfig[order.status].label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Total</p>
                    <p className="text-xl font-bold text-amber-600">{formatPrice(order.total)}</p>
                  </div>
                  <div className="flex gap-2">
                    <OrderPrint order={order} />
                    <button
                      onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                      className="p-2 text-slate-400 hover:text-amber-600 transition-colors"
                    >
                      {expandedId === order.id ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {expandedId === order.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 pt-0 space-y-4 border-t border-slate-100">
                    <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                      <span>📦 Items ({order.items.length})</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {order.items.map((item) => (
                        <div key={item.productId} className="flex gap-3 items-center bg-white/50 rounded-xl p-3 shadow-sm hover:shadow-md transition">
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shadow-sm flex-shrink-0">
                            <Image src={item.image || '/placeholder-product.png'} alt={item.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-slate-800">{item.name}</h5>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-sm text-slate-500">{item.quantity} x {formatPrice(item.priceAtPurchase)}</span>
                              <span className="font-semibold text-slate-800">{formatPrice(item.quantity * item.priceAtPurchase)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}