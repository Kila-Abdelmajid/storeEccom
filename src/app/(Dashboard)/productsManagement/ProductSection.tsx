'use client';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { useToast } from '@/contexts/ToastContext';
import type { Product } from '@/types/product';
import AddProduct from '@/components/dashboard/ProductManagement/AddProduct';
import UpdateProductForm from '@/components/dashboard/ProductManagement/UpdateProduct';
import ReviewsModal from '@/components/dashboard/ProductManagement/ReviewsModal';
import ImageModal from '@/components/ui/ImageModal';

const ITEMS_PER_PAGE = 8;
type TabType = 'active' | 'deleted';

type DeletedProduct = Product & {
  deletedAt: string;
  archivedByCategory: boolean;
};

export default function ProductSection() {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeProducts, setActiveProducts] = useState<Product[]>([]);
  const [deletedProducts, setDeletedProducts] = useState<DeletedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('active');

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch] = useDebounce(search, 300);

  // Modals
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [reviewsProduct, setReviewsProduct] = useState<Product | null>(null);
  const [imageModalSrc, setImageModalSrc] = useState<string | null>(null);

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    productId: number | null;
    action: 'archive' | 'restore';
  }>({ isOpen: false, productId: null, action: 'archive' });

  // --- Fetch initial data ---
  const fetchActiveProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/DashboardApi/product');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setActiveProducts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
      showToast('Failed to load products', 'error');
    }
  }, [router, showToast]);

  const fetchDeletedProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/DashboardApi/product/deleted');
      if (!res.ok) throw new Error('Failed to fetch deleted products');
      const data = await res.json();
      setDeletedProducts(data);
    } catch (err: any) {
      showToast('Failed to load deleted products', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchActiveProducts(), fetchDeletedProducts()]);
      setLoading(false);
    };
    init();
  }, [fetchActiveProducts, fetchDeletedProducts]);

  // --- Optimistic CRUD (no extra refetch) ---
  const addProductOptimistic = (newProduct: Product) => {
    setActiveProducts(prev => [newProduct, ...prev]);
  };

  const updateProductOptimistic = (updatedProduct: Product) => {
    setActiveProducts(prev =>
      prev.map(p => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  const archiveProduct = async (productId: number) => {
    try {
      const res = await fetch(`/api/DashboardApi/product?id=${productId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Archive failed');
      }
      const archived = activeProducts.find(p => p.id === productId);
      if (archived) {
        setActiveProducts(prev => prev.filter(p => p.id !== productId));
        const deletedProduct: DeletedProduct = {
          ...archived,
          deletedAt: new Date().toISOString(),
          archivedByCategory: false,
        };
        setDeletedProducts(prev => [deletedProduct, ...prev]);
      }
      showToast('Product archived successfully', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
      await fetchActiveProducts(); // fallback refresh
    }
  };

  const restoreProduct = async (productId: number) => {
    try {
      const res = await fetch(`/api/DashboardApi/product/restore?id=${productId}`, { method: 'PUT' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Restore failed');
      }
      const restored = deletedProducts.find(p => p.id === productId);
      if (restored) {
        setDeletedProducts(prev => prev.filter(p => p.id !== productId));
        const { deletedAt, archivedByCategory, ...activeProduct } = restored;
        setActiveProducts(prev => [activeProduct as Product, ...prev]);
      }
      showToast('Product restored successfully', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
      await fetchDeletedProducts(); // fallback refresh
    }
  };

  const openConfirmDialog = (productId: number, action: 'archive' | 'restore') => {
    setConfirmDialog({ isOpen: true, productId, action });
  };

  const handleConfirmAction = () => {
    if (confirmDialog.productId) {
      if (confirmDialog.action === 'archive') {
        archiveProduct(confirmDialog.productId);
      } else {
        restoreProduct(confirmDialog.productId);
      }
    }
    setConfirmDialog({ isOpen: false, productId: null, action: 'archive' });
  };

  // Reset filters
  const resetFilters = () => {
    setSearch('');
    setCategory('all');
    setStockStatus('all');
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
  };

  // Memoized data
  const categories = useMemo(() => {
    const cats = new Set(activeProducts.map(p => p.category).filter(Boolean));
    return ['all', ...Array.from(cats).sort()];
  }, [activeProducts]);

  const stats = useMemo(() => {
    const total = activeProducts.length;
    const outOfStock = activeProducts.filter(p => p.stock === 0).length;
    const lowStock = activeProducts.filter(p => p.stock > 0 && p.stock <= 10).length;
    const totalValue = activeProducts.reduce((sum, p) => sum + p.price * p.stock, 0);
    return { total, outOfStock, lowStock, totalValue };
  }, [activeProducts]);

  const filteredActive = useMemo(() => {
    return activeProducts.filter(product => {
      if (debouncedSearch && !product.name.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      if (category !== 'all' && product.category !== category) return false;
      if (stockStatus === 'in-stock' && product.stock <= 0) return false;
      if (stockStatus === 'low-stock' && (product.stock <= 0 || product.stock > 10)) return false;
      if (stockStatus === 'out-of-stock' && product.stock > 0) return false;
      if (minPrice && product.price < Number(minPrice)) return false;
      if (maxPrice && product.price > Number(maxPrice)) return false;
      return true;
    });
  }, [activeProducts, debouncedSearch, category, stockStatus, minPrice, maxPrice]);

  const totalPages = Math.ceil(filteredActive.length / ITEMS_PER_PAGE);
  const paginatedActive = filteredActive.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stockBadge = (stock: number) => {
    if (stock === 0) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">Out of Stock</span>;
    if (stock <= 10) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Low Stock ({stock})</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">In Stock ({stock})</span>;
  };

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-200 rounded-xl"></div><div className="space-y-2"><div className="h-4 bg-slate-200 rounded w-32"></div><div className="h-3 bg-slate-200 rounded w-48"></div></div></div></td>
      <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-20"></div></td>
      <td className="px-6 py-4"><div className="h-5 bg-slate-200 rounded w-16"></div></td>
      <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-24"></div></td>
      <td className="px-6 py-4"><div className="flex gap-1"><div className="w-8 h-8 bg-slate-200 rounded-md"></div><div className="w-6 h-6 bg-slate-200 rounded-full"></div></div></td>
      <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-16"></div></td>
      <td className="px-6 py-4"><div className="flex gap-2"><div className="w-5 h-5 bg-slate-200 rounded"></div><div className="w-5 h-5 bg-slate-200 rounded"></div><div className="w-5 h-5 bg-slate-200 rounded"></div></div></td>
    </tr>
  );

  if (loading && activeTab === 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && activeTab === 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-slate-200">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => { fetchActiveProducts(); fetchDeletedProducts(); }} className="px-4 py-2 bg-amber-500 text-white rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/60">
      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full ${confirmDialog.action === 'archive' ? 'bg-rose-100' : 'bg-emerald-100'} flex items-center justify-center`}>
                {confirmDialog.action === 'archive' ? (
                  <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                {confirmDialog.action === 'archive' ? 'Archive Product' : 'Restore Product'}
              </h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              {confirmDialog.action === 'archive'
                ? 'Are you sure you want to archive this product? It will be moved to deleted products and can be restored later.'
                : 'Are you sure you want to restore this product? It will reappear in your active product list.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog({ isOpen: false, productId: null, action: 'archive' })}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md transition ${
                  confirmDialog.action === 'archive'
                    ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                }`}
              >
                {confirmDialog.action === 'archive' ? 'Archive' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent tracking-tight">
              Products
            </h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Manage your product inventory
            </p>
          </div>
          <button
            onClick={() => setShowAddProduct(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium rounded-xl shadow-md transition-all duration-200 transform hover:scale-[1.02] focus:ring-2 focus:ring-amber-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Product
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button
            onClick={() => { setActiveTab('active'); setCurrentPage(1); }}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
              activeTab === 'active'
                ? 'bg-white text-amber-600 border-b-2 border-amber-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Active Products
            {activeProducts.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                {activeProducts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('deleted'); setCurrentPage(1); }}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
              activeTab === 'deleted'
                ? 'bg-white text-amber-600 border-b-2 border-amber-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Deleted Products
            {deletedProducts.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                {deletedProducts.length}
              </span>
            )}
          </button>
        </div>

        {/* Modals with optimistic callbacks */}
        {showAddProduct && (
          <AddProduct
            onClose={() => setShowAddProduct(false)}
            onSuccess={addProductOptimistic}
          />
        )}
        
        {editingProduct && (
          <UpdateProductForm
            product={editingProduct}
            onClose={() => setEditingProduct(null)}
            onSuccess={updateProductOptimistic}
          />
        )}
        {reviewsProduct && (
          <ReviewsModal
            product={reviewsProduct}
            onClose={() => setReviewsProduct(null)}
            onReviewDeleted={() => {
              // Optionally refresh product rating – can be done by refetching one product
              // For simplicity, you can call fetchActiveProducts() but that's a refetch.
              // I'll leave it as is; you can implement a single product update.
            }}
          />
        )}
        {imageModalSrc && (
          <ImageModal src={imageModalSrc} alt="Product image" onClose={() => setImageModalSrc(null)} />
        )}

        {/* ========== ACTIVE PRODUCTS VIEW ========== */}
        {activeTab === 'active' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <StatCard title="Total Products" value={loading ? '-' : stats.total} icon="Package" color="indigo" />
              <StatCard title="Out of Stock" value={loading ? '-' : stats.outOfStock} icon="AlertCircle" color="rose" />
              <StatCard title="Low Stock (≤10)" value={loading ? '-' : stats.lowStock} icon="Clock" color="amber" />
              <StatCard title="Inventory Value" value={loading ? '-' : `${stats.totalValue} MAD`} icon="DollarSign" color="emerald" />
            </div>

            {/* Filters Bar */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-white/50 p-5 mb-8">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Product name..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition bg-white/50"
                  />
                </div>
                <div className="w-48">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setCurrentPage(1); }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white/50"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>)}
                  </select>
                </div>
                <div className="w-48">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Stock Status</label>
                  <select
                    value={stockStatus}
                    onChange={(e) => { setStockStatus(e.target.value); setCurrentPage(1); }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white/50"
                  >
                    <option value="all">All</option>
                    <option value="in-stock">In Stock</option>
                    <option value="low-stock">Low Stock (≤10)</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>
                <div className="w-32">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Min Price</label>
                  <input type="number" placeholder="Min" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white/50" />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Max Price</label>
                  <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white/50" />
                </div>
                <div>
                  <button onClick={resetFilters} className="mt-5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm transition font-medium shadow-sm">
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Active Products Table */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100/80">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Images</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <SkeletonRow key={i} />)
                    ) : (
                      paginatedActive.map((product, index) => (
                        // Use product.id as the primary key, fallback to index if id is missing (should not happen)
                        <tr key={product.id ?? index} className="hover:bg-amber-50/30 transition-colors duration-150 group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <img src={product.image} alt={product.name} className="w-10 h-10 rounded-xl object-cover shadow-sm ring-1 ring-slate-200" />
                              <div>
                                <p className="font-semibold text-slate-800">{product.name}</p>
                                <p className="text-xs text-slate-400 truncate max-w-xs">{product.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{product.category}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-bold text-slate-800">{product.price} MAD</span>
                            {product.oldPrice && <span className="ml-2 text-xs text-slate-400 line-through">{product.oldPrice} MAD</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{stockBadge(product.stock)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <img src={product.image} className="w-8 h-8 rounded-lg object-cover cursor-pointer ring-1 ring-slate-200 hover:ring-amber-400 transition" onClick={() => setImageModalSrc(product.image)} alt="main" />
                              {Array.isArray(product.additionalImages) && product.additionalImages.length > 0 && (
                                <div className="flex -space-x-1 ml-1">
                                  {product.additionalImages.slice(0, 3).map((img, idx) => (
                                    <img key={idx} src={img} className="w-7 h-7 rounded-full border-2 border-white object-cover cursor-pointer hover:scale-110 transition" onClick={() => setImageModalSrc(img)} alt={`additional ${idx}`} />
                                  ))}
                                  {product.additionalImages.length > 3 && <span className="text-xs text-slate-500 ml-1.5 font-medium">+{product.additionalImages.length - 3}</span>}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {product.isNew ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">New</span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Regular</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(product as any).categoryDeleted ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                Category deleted
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Active</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button onClick={() => setEditingProduct(product)} className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition" title="Edit">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                              <button onClick={() => openConfirmDialog(product.id, 'archive')} className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition" title="Archive">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                              <button onClick={() => setReviewsProduct(product)} className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition" title="Reviews">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                    {!loading && paginatedActive.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">No products match your filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!loading && filteredActive.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                  <div className="text-sm text-slate-500">
                    Showing {(currentPage-1)*ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredActive.length)} of {filteredActive.length}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-50 hover:bg-white transition">Previous</button>
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      let pageNum = currentPage;
                      if (totalPages <= 5) pageNum = i+1;
                      else if (currentPage <= 3) pageNum = i+1;
                      else if (currentPage >= totalPages-2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;
                      return (
                        <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`px-3 py-1.5 rounded-lg text-sm transition ${currentPage === pageNum ? 'bg-amber-600 text-white shadow-md' : 'border border-slate-300 hover:bg-white'}`}>
                          {pageNum}
                        </button>
                      );
                    })}
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-50 hover:bg-white transition">Next</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ========== DELETED PRODUCTS VIEW ========== */}
        {activeTab === 'deleted' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Archived At</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deletedProducts.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No archived products.</td></tr>
                  ) : (
                    deletedProducts.map((product, index) => (
                      <tr key={product.id ?? index} className="hover:bg-amber-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <img src={product.image} className="w-10 h-10 rounded-xl object-cover opacity-75" alt={product.name} />
                            <span className="font-semibold text-slate-800">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{product.category}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">${product.price}</td>
                        <td className="px-6 py-4 text-slate-500 text-sm">{new Date(product.deletedAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          {product.archivedByCategory ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                              Archived due to category deletion
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Manually archived</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {product.archivedByCategory ? (
                            <span className="text-xs text-slate-400 italic">Restore category to recover</span>
                          ) : (
                            <button onClick={() => openConfirmDialog(product.id, 'restore')} className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition text-sm font-medium">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                              Restore
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- StatCard Component (same as dashboard) ---
function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-500 to-indigo-600',
    rose: 'from-rose-500 to-rose-600',
    amber: 'from-amber-500 to-amber-600',
    emerald: 'from-emerald-500 to-emerald-600',
  };
  const IconComponent = () => {
    switch (icon) {
      case 'Package': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
      case 'AlertCircle': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'Clock': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'DollarSign': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      default: return null;
    }
  };
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-5 border border-white/50 group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} shadow-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200`}>
          <IconComponent />
        </div>
      </div>
    </div>
  );
}