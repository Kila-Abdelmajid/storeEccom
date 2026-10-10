'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ShoppingBagIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import React from 'react';

interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
  image: string | null;
}

interface Order {
  orderId: number;
  customer: {
    userId: number;
    name: string;
    email: string;
  };
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'canceled';
  createdAt: string;
  items: OrderItem[];
  shippingAddress?: string;
  shippingPhone?: string;
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  delivered: 'Delivered',
  canceled: 'Canceled',
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  delivered: 'bg-blue-100 text-blue-800 border-blue-200',
  canceled: 'bg-rose-100 text-rose-800 border-rose-200',
};

// --- Helpers ---
const formatCurrency = (amount: number) =>
  `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;

export default function OrdersManagementPage() {
  const { session, loading } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; orderId: number | null }>({
    isOpen: false,
    orderId: null,
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    delivered: 0,
    canceled: 0,
  });

  const fetchAllOrdersForStats = async () => {
    try {
      const res = await fetch('/api/DashboardApi/orders?limit=9999');
      if (!res.ok) throw new Error();
      const data = await res.json();
      const all = Array.isArray(data) ? data : data.orders;
      setAllOrders(all);
      const total = all.length;
      const pending = all.filter((o: Order) => o.status === 'pending').length;
      const confirmed = all.filter((o: Order) => o.status === 'confirmed').length;
      const delivered = all.filter((o: Order) => o.status === 'delivered').length;
      const canceled = all.filter((o: Order) => o.status === 'canceled').length;
      setStats({ total, pending, confirmed, delivered, canceled });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });
      const res = await fetch(`/api/DashboardApi/orders?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const ordersList = Array.isArray(data) ? data : data.orders;
      setOrders(ordersList);
      if (!Array.isArray(data)) {
        setTotalPages(data.pagination.totalPages);
      }
    } catch {
      showToast('Failed to load orders', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!session && !loading) redirect('/login');
    if (session) {
      fetchAllOrdersForStats();
      fetchOrders();
    }
  }, [session, loading, page, search, statusFilter]);

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch('/api/DashboardApi/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (!res.ok) throw new Error();
      showToast(`Order #${orderId} status updated to ${statusLabels[newStatus]}`, 'success');
      fetchOrders();
      fetchAllOrdersForStats();
    } catch {
      showToast('Failed to update order status', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const deleteOrder = async (orderId: number) => {
    try {
      const res = await fetch(`/api/DashboardApi/orders?orderId=${orderId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast(`Order #${orderId} deleted successfully`, 'success');
      fetchOrders();
      fetchAllOrdersForStats();
    } catch {
      showToast('Failed to delete order', 'error');
    }
  };

  const openConfirmDialog = (orderId: number) => {
    setConfirmDialog({ isOpen: true, orderId });
  };

  const handleConfirmDelete = () => {
    if (confirmDialog.orderId) {
      deleteOrder(confirmDialog.orderId);
    }
    setConfirmDialog({ isOpen: false, orderId: null });
  };

  const toggleExpand = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  if (loading || (isLoading && orders.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (!session || session.role !== 'admin') redirect('/');

  const getOrderNumber = (index: number) => (page - 1) * 10 + index + 1;

  const getPageNumbers = () => {
    const pages: number[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
      } else if (page >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        for (let i = page - 2; i <= page + 2; i++) pages.push(i);
      }
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/60 p-6 md:p-8">
      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <TrashIcon className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Delete Order</h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              Are you sure you want to delete this order? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog({ isOpen: false, orderId: null })}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-lg shadow-md transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent tracking-tight">
            Orders Management
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            View and manage all customer orders
          </p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard title="Total Orders" value={stats.total} icon={ShoppingBagIcon} color="indigo" />
          <StatCard title="Pending" value={stats.pending} icon={ClockIcon} color="amber" />
          <StatCard title="Confirmed" value={stats.confirmed} icon={CheckCircleIcon} color="emerald" />
          <StatCard title="Delivered" value={stats.delivered} icon={TruckIcon} color="blue" />
          <StatCard title="Canceled" value={stats.canceled} icon={XCircleIcon} color="rose" />
        </div>

        {/* Filters Bar */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-white/50 p-5 mb-8">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Order ID or customer name..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition bg-white/50"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="w-48">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl text-sm bg-white/50 focus:ring-2 focus:ring-amber-300 focus:border-amber-300 appearance-none"
                >
                  <option value="all">All status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="delivered">Delivered</option>
                  <option value="canceled">Canceled</option>
                </select>
                <FunnelIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-10"></th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order, idx) => (
                  <React.Fragment key={order.orderId}>
                    <tr className="hover:bg-amber-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleExpand(order.orderId)}
                          className="text-slate-400 hover:text-amber-600 transition"
                        >
                          {expandedOrderId === order.orderId ? (
                            <ChevronUpIcon className="w-5 h-5" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-800">
                        {getOrderNumber(idx)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{order.customer.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-600 text-sm">{order.customer.email}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">{formatCurrency(order.totalPrice)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full border ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.orderId, e.target.value)}
                            disabled={updatingOrderId === order.orderId}
                            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none disabled:opacity-50 bg-white"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="delivered">Delivered</option>
                            <option value="canceled">Canceled</option>
                          </select>
                          <button
                            onClick={() => openConfirmDialog(order.orderId)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                            title="Delete order"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedOrderId === order.orderId && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="space-y-4">
                            {/* Shipping Information */}
                            {(order.shippingAddress || order.shippingPhone) && (
                              <div className="bg-white/50 rounded-xl p-4 border border-slate-100">
                                <h4 className="font-semibold text-slate-700 flex items-center gap-2 mb-2">
                                  <span className="w-1 h-5 bg-amber-500 rounded-full" />
                                  Delivery Details
                                </h4>
                                {order.shippingAddress && (
                                  <p className="text-sm text-slate-600">
                                    <span className="font-medium">Address:</span> {order.shippingAddress}
                                  </p>
                                )}
                                {order.shippingPhone && (
                                  <p className="text-sm text-slate-600">
                                    <span className="font-medium">Phone:</span> {order.shippingPhone}
                                  </p>
                                )}
                              </div>
                            )}
                            {/* Order Items */}
                            <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                              <span className="w-1 h-5 bg-amber-500 rounded-full" />
                              Order Items
                            </h4>
                            {order.items.length === 0 ? (
                              <p className="text-slate-400 text-sm">No items found</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {order.items.map((item) => (
                                  <div
                                    key={item.productId}
                                    className="group flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-slate-100 hover:shadow-md hover:border-amber-200 transition-all duration-200"
                                  >
                                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                      <Image
                                        src={item.image || '/placeholder-product.png'}
                                        alt={item.productName}
                                        fill
                                        sizes="56px"
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-medium text-slate-800 text-sm line-clamp-1">{item.productName}</h5>
                                      <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-slate-500">
                                          {item.quantity} × {formatCurrency(item.priceAtPurchase)}
                                        </span>
                                        <span className="font-bold text-slate-800 text-sm">
                                          {formatCurrency(item.quantity * item.priceAtPurchase)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {orders.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <div className="text-sm text-slate-500">
                Showing {orders.length} of {stats.total} orders
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                >
                  <ChevronLeftIcon className="w-4 h-4" /> Previous
                </button>
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm transition ${
                      page === pageNum
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                >
                  Next <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// StatCard component
function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: React.ElementType; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-500 to-indigo-600',
    amber: 'from-amber-500 to-amber-600',
    emerald: 'from-emerald-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
    rose: 'from-rose-500 to-rose-600',
  };
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-4 border border-white/50 group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} shadow-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}