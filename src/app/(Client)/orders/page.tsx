'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/utils/format';

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
  status: 'pending' | 'confirmed' | 'delivered';
  createdAt: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/ClientApi/orders');
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        setError('Unable to load your orders.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">⏳ Pending</span>;
      case 'confirmed':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">✓ Confirmed</span>;
      case 'delivered':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✅ Delivered</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#c9a96e] text-white rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-6">Looks like you haven’t placed any orders.</p>
        <Link href="/products" className="px-6 py-3 bg-[#c9a96e] text-white rounded-full hover:bg-[#b88a4a] transition">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">My Orders</h1>

      <div className="space-y-8">
        {orders.map((order) => (
          <div key={order.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {/* Order header */}
            <div className="p-5 bg-gray-50 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
              <div>
                <p className="text-sm text-gray-500">Order #{order.id}</p>
                <p className="text-xs text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(order.status)}
                <span className="font-bold text-gray-900">{formatPrice(order.total)}</span>
              </div>
            </div>
            {/* Order items */}
            <div className="p-5 space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-16 h-16 relative bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      unoptimized={!item.image?.startsWith('/')}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} × {formatPrice(item.priceAtPurchase)}
                    </p>
                  </div>
                  <div className="text-right font-semibold text-gray-900">
                    {formatPrice(item.quantity * item.priceAtPurchase)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}