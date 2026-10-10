'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBagIcon,
  UsersIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import RevenueChart from '@/components/dashboard/RevenueChart';
import DailyRevenueChart from '@/components/dashboard/DailyRevenueChart';

// --- Interfaces (unchanged) ---
interface Stats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

interface Order {
  orderId: number;
  customerName: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface Product {
  productId: number;
  productName: string;
  price: number;
  productImage: string | null;
  totalSold: number;
}

// --- Helpers ---
const formatCurrency = (amount: number) =>
  `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  delivered: 'Delivered',
  canceled: 'Canceled',
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-l-2 border-amber-400',
  confirmed: 'bg-sky-100 text-sky-800 border-l-2 border-sky-400',
  delivered: 'bg-emerald-100 text-emerald-800 border-l-2 border-emerald-400',
  canceled: 'bg-rose-100 text-rose-800 border-l-2 border-rose-400',
};

// --- MAIN DASHBOARD COMPONENT (Redesigned) ---
export default function DashboardPage() {
  const { session, loading } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; revenue: number }[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<{ day: string; revenue: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  useEffect(() => {
    if (!session && !loading) {
      redirect('/login');
    }
    if (session) fetchData();
  }, [session, loading]);
  
  const fetchData = async (showRefreshToast = false) => {
    try {
      const [statsRes, ordersRes, productsRes, monthlyRes, dailyRes] = await Promise.all([
        fetch('/api/DashboardApi/stats'),
        fetch('/api/DashboardApi/orders?limit=5'),
        fetch('/api/DashboardApi/top-products?limit=5'),
        fetch('/api/DashboardApi/monthly-revenue'),
        fetch('/api/DashboardApi/daily-revenue'),
      ]);

      if (!statsRes.ok || !ordersRes.ok || !productsRes.ok || !monthlyRes.ok || !dailyRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();
      const monthlyData = await monthlyRes.json();
      const dailyData = await dailyRes.json();

      const ordersList = Array.isArray(ordersData) ? ordersData : (ordersData.orders || []);
      const mappedOrders = ordersList.map((order: any) => ({
        orderId: order.orderId,
        customerName: order.customer?.name || 'Unknown',
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt,
      }));

      setStats(statsData);
      setRecentOrders(mappedOrders);
      setTopProducts(productsData);
      setMonthlyRevenue(monthlyData);
      setDailyRevenue(dailyData);

      if (showRefreshToast) {
        showToast('Dashboard data refreshed successfully', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading dashboard data', 'error');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (!session) return null;
  if (session.role !== 'admin') redirect('/');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/60 p-6 md:p-8">
      {/* Animated background accent */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header with glass effect */}
        <div className="flex flex-wrap justify-between items-center mb-10 gap-4">
          <div className="relative">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent tracking-tight">
              Dashboard
            </h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Welcome back, Admin #{session.userId}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="group relative flex items-center gap-2 px-5 py-2.5 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-50 hover:border-amber-200"
          >
            <ArrowPathIcon className={`w-5 h-5 text-amber-500 transition-transform duration-500 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            <span className="text-sm font-medium text-slate-700">{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>

        {/* Stats Cards - Redesigned with gradients and hover effects */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={UsersIcon}
              gradient="from-indigo-500 to-indigo-600"
              bgGradient="from-indigo-50 to-indigo-100/50"
              borderColor="indigo"
            />
            <StatCard
              title="Total Products"
              value={stats.totalProducts}
              icon={CubeIcon}
              gradient="from-emerald-500 to-teal-600"
              bgGradient="from-emerald-50 to-emerald-100/50"
              borderColor="emerald"
            />
            <StatCard
              title="Completed Orders"
              value={stats.totalOrders}
              icon={ShoppingBagIcon}
              gradient="from-amber-500 to-orange-600"
              bgGradient="from-amber-50 to-amber-100/50"
              borderColor="amber"
            />
            <StatCard
              title="Revenue"
              value={formatCurrency(stats.totalRevenue)}
              icon={CurrencyDollarIcon}
              gradient="from-rose-500 to-pink-600"
              bgGradient="from-rose-50 to-rose-100/50"
              borderColor="rose"
            />
          </div>
        )}

        {/* Charts Section with glassmorphic cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="group bg-white/60 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 transition-all duration-500 hover:shadow-2xl hover:bg-white/80 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
                Monthly Revenue
              </h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Last 6 months</span>
            </div>
            <div className="h-80 w-full">
              <RevenueChart data={monthlyRevenue} formatCurrency={formatCurrency} />
            </div>
          </div>

          <div className="group bg-white/60 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 transition-all duration-500 hover:shadow-2xl hover:bg-white/80 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
                Daily Revenue
              </h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Last 30 days</span>
            </div>
            <div className="h-80 w-full">
              <DailyRevenueChart data={dailyRevenue} formatCurrency={formatCurrency} />
            </div>
          </div>
        </div>

        {/* Tables Section - Modern card design */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders Table */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 overflow-hidden transition-all duration-500 hover:shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50/50 to-transparent">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ShoppingBagIcon className="w-5 h-5 text-amber-500" />
                Recent Orders
              </h2>
              <Link href="/ordersManagement" className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-all hover:underline decoration-2 underline-offset-4">
                View All →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 text-slate-500">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Order ID</th>
                    <th className="px-6 py-3 text-left font-semibold">Customer</th>
                    <th className="px-6 py-3 text-left font-semibold">Amount</th>
                    <th className="px-6 py-3 text-left font-semibold">Status</th>
                    <th className="px-6 py-3 text-left font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <tr key={order.orderId} className="hover:bg-amber-50/30 transition-colors duration-200">
                      <td className="px-6 py-3 font-mono text-slate-700 font-medium">#{order.orderId}</td>
                      <td className="px-6 py-3 text-slate-600">{order.customerName}</td>
                      <td className="px-6 py-3 font-semibold text-slate-800">{formatCurrency(order.totalPrice)}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg shadow-sm ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400 italic">
                        No orders yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Products Table */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 overflow-hidden transition-all duration-500 hover:shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50/50 to-transparent">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CubeIcon className="w-5 h-5 text-amber-500" />
                Top Selling Products
              </h2>
              <Link href="/productsManagement" className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-all hover:underline decoration-2 underline-offset-4">
                View All →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 text-slate-500">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Product</th>
                    <th className="px-6 py-3 text-left font-semibold">Price</th>
                    <th className="px-6 py-3 text-left font-semibold">Sold</th>
                    <th className="px-6 py-3 text-left font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProducts.map((product) => (
                    <tr key={product.productId} className="hover:bg-amber-50/30 transition-colors duration-200">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl overflow-hidden flex-shrink-0 shadow-inner">
                            <Image
                              src={product.productImage || '/placeholder-product.png'}
                              alt={product.productName}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <span className="font-semibold text-slate-800">{product.productName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-600">{formatCurrency(product.price)}</td>
                      <td className="px-6 py-3 font-bold text-slate-800">{product.totalSold}</td>
                      <td className="px-6 py-3 text-amber-700 font-medium">{formatCurrency(product.price * product.totalSold)}</td>
                    </tr>
                  ))}
                  {topProducts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-400 italic">
                        No products sold yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Enhanced StatCard with glassmorphism and micro-interactions ---
function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  bgGradient,
  borderColor,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  bgGradient: string;
  borderColor: string;
}) {
  return (
    <div className={`group relative overflow-hidden bg-white/60 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 border-l-4 border-${borderColor}-400 hover:scale-[1.02]`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative p-6 z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 uppercase tracking-wide font-medium mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg flex items-center justify-center text-white group-hover:rotate-6 transition-transform duration-300`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
       
      </div>
      {/* animated shine effect */}
      <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shine" />
    </div>
  );
}