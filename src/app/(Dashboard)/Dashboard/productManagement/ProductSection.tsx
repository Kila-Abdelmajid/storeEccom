// app/dashboard/ProductSection.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import type { Product } from '@/types/product';
import AddProduct from '@/components/dashboard/ProductManagement/AddProduct';
import UpdateProductForm from '@/components/dashboard/ProductManagement/UpdateProduct';
import ReviewsModal from '@/components/dashboard/ProductManagement/ReviewsModal';
import ImageModal from '@/components/ui/ImageModal';

const ITEMS_PER_PAGE = 8;

export default function ProductSection() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [debouncedSearch] = useDebounce(search, 300);

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [reviewsProduct, setReviewsProduct] = useState<Product | null>(null);
  const [imageModalSrc, setImageModalSrc] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/DashboardApi/product');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch products');
      }
      const data = await res.json();
      setProducts(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const deleteProduct = async (productId: number) => {
    if (!confirm('Are you sure? This will delete all images and reviews.')) return;
    try {
      const res = await fetch(`/api/DashboardApi/product?id=${productId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await fetchProducts();
    } catch {
      alert('Delete failed');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setCategory('all');
    setStockStatus('all');
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
  };

  // ===== Memoized derived data (only expensive operations) =====
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['all', ...Array.from(cats).sort()];
  }, [products]);

  const stats = useMemo(() => {
    const total = products.length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length;
    const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
    return { total, outOfStock, lowStock, totalValue };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (debouncedSearch && !product.name.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      if (category !== 'all' && product.category !== category) return false;
      if (stockStatus === 'in-stock' && product.stock <= 0) return false;
      if (stockStatus === 'low-stock' && (product.stock <= 0 || product.stock > 10)) return false;
      if (stockStatus === 'out-of-stock' && product.stock > 0) return false;
      if (minPrice && product.price < Number(minPrice)) return false;
      if (maxPrice && product.price > Number(maxPrice)) return false;
      return true;
    });
  }, [products, debouncedSearch, category, stockStatus, minPrice, maxPrice]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
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
      <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-200 rounded-lg"></div><div className="space-y-2"><div className="h-4 bg-slate-200 rounded w-32"></div><div className="h-3 bg-slate-200 rounded w-48"></div></div></div></td>
      <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-20"></div></td>
      <td className="px-6 py-4"><div className="h-5 bg-slate-200 rounded w-16"></div></td>
      <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-24"></div></td>
      <td className="px-6 py-4"><div className="flex gap-1"><div className="w-8 h-8 bg-slate-200 rounded-md"></div><div className="w-6 h-6 bg-slate-200 rounded-full"></div></div></td>
      <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-16"></div></td>
      <td className="px-6 py-4"><div className="flex gap-2"><div className="w-5 h-5 bg-slate-200 rounded"></div><div className="w-5 h-5 bg-slate-200 rounded"></div><div className="w-5 h-5 bg-slate-200 rounded"></div></div></td>
    </tr>
  );

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={fetchProducts} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Products</h1>
            <p className="text-slate-500 mt-1">Manage your product inventory</p>
          </div>
          <button
            onClick={() => setShowAddProduct(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Product
          </button>
        </div>

        {/* Modals */}
        {showAddProduct && <AddProduct onClose={() => setShowAddProduct(false)} onSuccess={fetchProducts} />}
        {editingProduct && <UpdateProductForm product={editingProduct} onClose={() => { setEditingProduct(null); fetchProducts(); }} />}
        {reviewsProduct && <ReviewsModal product={reviewsProduct} onClose={() => setReviewsProduct(null)} onReviewDeleted={fetchProducts} />}
        {imageModalSrc && <ImageModal src={imageModalSrc} alt="Product image" onClose={() => setImageModalSrc(null)} />}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
            <div><p className="text-slate-500 text-sm">Total Products</p><p className="text-3xl font-bold text-slate-800">{loading ? '-' : stats.total}</p></div>
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center"><svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
            <div><p className="text-slate-500 text-sm">Out of Stock</p><p className="text-3xl font-bold text-rose-600">{loading ? '-' : stats.outOfStock}</p></div>
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center"><svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
            <div><p className="text-slate-500 text-sm">Low Stock (≤10)</p><p className="text-3xl font-bold text-amber-600">{loading ? '-' : stats.lowStock}</p></div>
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center"><svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
            <div><p className="text-slate-500 text-sm">Inventory Value</p><p className="text-3xl font-bold text-emerald-600">${loading ? '-' : stats.totalValue.toFixed(2)}</p></div>
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center"><svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-45">
              <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
              <input type="text" placeholder="Product name..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div className="w-48">
              <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
              <select value={category} onChange={(e) => { setCategory(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>)}
              </select>
            </div>
            <div className="w-48">
              <label className="block text-xs font-medium text-slate-500 mb-1">Stock Status</label>
              <select value={stockStatus} onChange={(e) => { setStockStatus(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="all">All</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock (≤10)</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-slate-500 mb-1">Min Price ($)</label>
              <input type="number" placeholder="Min" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-slate-500 mb-1">Max Price ($)</label>
              <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <button onClick={resetFilters} className="mt-5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition">Reset Filters</button>
            </div>
          </div>
        </div>

        {/* Table with skeleton loader */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Images</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <SkeletonRow key={i} />)
                ) : (
                  paginatedProducts.map(product => (
                    <tr key={product.id} className="hover:bg-indigo-50/30 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                          <div>
                            <p className="font-medium text-slate-800">{product.name}</p>
                            <p className="text-xs text-slate-400 truncate max-w-xs">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{product.category}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">${product.price.toFixed(2)}</span>
                        {product.oldPrice && <span className="ml-2 text-xs text-slate-400 line-through">${product.oldPrice.toFixed(2)}</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{stockBadge(product.stock)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <img src={product.image} className="w-8 h-8 rounded-md object-cover cursor-pointer ring-1 ring-slate-200 hover:ring-indigo-300 transition" onClick={() => setImageModalSrc(product.image)} alt="main" />
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
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">New</span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Regular</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingProduct(product)} className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition" title="Edit">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => deleteProduct(product.id)} className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition" title="Delete">
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
                {!loading && paginatedProducts.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">No products match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredProducts.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
              <div className="text-sm text-slate-500">
                Showing {(currentPage-1)*ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-50">Previous</button>
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum = currentPage;
                  if (totalPages <= 5) pageNum = i+1;
                  else if (currentPage <= 3) pageNum = i+1;
                  else if (currentPage >= totalPages-2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`px-3 py-1.5 rounded-lg text-sm ${currentPage === pageNum ? 'bg-indigo-600 text-white' : 'border border-slate-300 hover:bg-white'}`}>
                      {pageNum}
                    </button>
                  );
                })}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}