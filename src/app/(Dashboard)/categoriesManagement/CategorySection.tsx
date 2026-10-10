'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import AddCategory from '@/components/dashboard/CategoryManagement/AddCategory';
import UpdateCategory from '@/components/dashboard/CategoryManagement/UpdateCategory';
import ImageModal from '@/components/ui/ImageModal';

type Category = {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  userId: number | null;
  createdAt: string;
};

type DeletedCategory = Category & { deletedAt: string };

const ITEMS_PER_PAGE = 8;
type TabType = 'active' | 'deleted';

export default function CategorySection() {
  const { showToast } = useToast();
  const [activeCategories, setActiveCategories] = useState<Category[]>([]);
  const [deletedCategories, setDeletedCategories] = useState<DeletedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [imageModalSrc, setImageModalSrc] = useState<string | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    categoryId: number | null;
    action: 'delete' | 'restore';
  }>({ isOpen: false, categoryId: null, action: 'delete' });

  // Fetch active categories
  const fetchActiveCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/DashboardApi/categories');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setActiveCategories(data);
    } catch {
      showToast('Failed to load categories', 'error');
    }
  }, [showToast]);

  // Fetch deleted categories
  const fetchDeletedCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/DashboardApi/categories/deleted');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDeletedCategories(data);
    } catch {
      showToast('Failed to load deleted categories', 'error');
    }
  }, [showToast]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchActiveCategories(), fetchDeletedCategories()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Optimistic archive (soft delete)
  const archiveCategory = async (categoryId: number) => {
    try {
      const res = await fetch(`/api/DashboardApi/categories?id=${categoryId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Archive failed');
      }
      const archived = activeCategories.find(c => c.id === categoryId);
      if (archived) {
        setActiveCategories(prev => prev.filter(c => c.id !== categoryId));
        setDeletedCategories(prev => [{ ...archived, deletedAt: new Date().toISOString() }, ...prev]);
      }
      showToast('Category and its products archived', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
      await fetchActiveCategories(); // fallback refresh
    }
  };

  // Optimistic restore
  const restoreCategory = async (categoryId: number) => {
    try {
      const res = await fetch(`/api/DashboardApi/categories/restore?id=${categoryId}`, { method: 'PUT' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Restore failed');
      }
      const restored = deletedCategories.find(c => c.id === categoryId);
      if (restored) {
        setDeletedCategories(prev => prev.filter(c => c.id !== categoryId));
        const { deletedAt, ...active } = restored;
        setActiveCategories(prev => [active, ...prev]);
      }
      showToast('Category and its products restored', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
      await fetchDeletedCategories();
    }
  };

  const openConfirmDialog = (categoryId: number, action: 'delete' | 'restore') => {
    setConfirmDialog({ isOpen: true, categoryId, action });
  };

  const handleConfirmAction = () => {
    if (confirmDialog.categoryId) {
      if (confirmDialog.action === 'delete') {
        archiveCategory(confirmDialog.categoryId);
      } else {
        restoreCategory(confirmDialog.categoryId);
      }
    }
    setConfirmDialog({ isOpen: false, categoryId: null, action: 'delete' });
  };

  // Add category optimistic (used by AddCategory)
  const addCategoryOptimistic = () => {
    fetchActiveCategories(); // simple refresh – but you could implement full optimistic if needed
  };

  // Update category optimistic (used by UpdateCategory)
  const updateCategoryOptimistic = (updatedCategory: Category) => {
    setActiveCategories(prev =>
      prev.map(c => (c.id === updatedCategory.id ? updatedCategory : c))
    );
  };

  // Filter & pagination
  const filteredActive = useMemo(() => {
    if (!search) return activeCategories;
    return activeCategories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [activeCategories, search]);

  const totalPages = Math.ceil(filteredActive.length / ITEMS_PER_PAGE);
  const paginatedActive = filteredActive.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Stats
  const stats = {
    totalActive: activeCategories.length,
    totalArchived: deletedCategories.length,
  };

  if (loading && activeTab === 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
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
              <div className={`w-10 h-10 rounded-full ${confirmDialog.action === 'delete' ? 'bg-rose-100' : 'bg-emerald-100'} flex items-center justify-center`}>
                {confirmDialog.action === 'delete' ? (
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
                {confirmDialog.action === 'delete' ? 'Archive Category' : 'Restore Category'}
              </h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              {confirmDialog.action === 'delete'
                ? 'This will archive the category and all its products. You can restore later.'
                : 'This will restore the category and all products that were archived with it.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog({ isOpen: false, categoryId: null, action: 'delete' })}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md transition ${
                  confirmDialog.action === 'delete'
                    ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                }`}
              >
                {confirmDialog.action === 'delete' ? 'Archive' : 'Restore'}
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
              Categories
            </h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Manage product categories
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium rounded-xl shadow-md transition transform hover:scale-[1.02]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          <StatsCard
            title="Active Categories"
            value={loading ? '-' : stats.totalActive}
            icon="Folder"
            color="emerald"
          />
          <StatsCard
            title="Archived Categories"
            value={loading ? '-' : stats.totalArchived}
            icon="Archive"
            color="amber"
          />
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
            Active Categories
            {stats.totalActive > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                {stats.totalActive}
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
            Archived Categories
            {stats.totalArchived > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                {stats.totalArchived}
              </span>
            )}
          </button>
        </div>

        {/* Modals */}
        {showAddModal && (
          <AddCategory
            onClose={() => setShowAddModal(false)}
            onSuccess={addCategoryOptimistic}
          />
        )}
        {editingCategory && (
          <UpdateCategory
            category={editingCategory}
            onClose={() => setEditingCategory(null)}
            // onSuccess={updateCategoryOptimistic}
          />
        )}
        {imageModalSrc && (
          <ImageModal src={imageModalSrc} alt="Category image" onClose={() => setImageModalSrc(null)} />
        )}

        {/* Active Categories View */}
        {activeTab === 'active' && (
          <>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-white/50 p-5 mb-8">
              <input
                type="text"
                placeholder="Search categories..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full max-w-sm px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300 bg-white/50"
              />
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100/80">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">#</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">Slug</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Image</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedActive.map((cat, idx) => (
                      <tr key={cat.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-500">{(currentPage-1)*ITEMS_PER_PAGE + idx+1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {cat.image && (
                              <img
                                src={cat.image}
                                className="w-10 h-10 rounded-xl object-cover cursor-pointer ring-1 ring-slate-200"
                                onClick={() => setImageModalSrc(cat.image!)}
                              />
                            )}
                            <span className="font-semibold text-slate-800">{cat.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell">{cat.slug}</td>
                        <td className="px-6 py-4">
                          {cat.image ? (
                            <img
                              src={cat.image}
                              className="w-10 h-10 rounded-xl object-cover cursor-pointer ring-1 ring-slate-200 hover:ring-amber-400 transition"
                              onClick={() => setImageModalSrc(cat.image!)}
                            />
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingCategory(cat)}
                              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => openConfirmDialog(cat.id, 'delete')}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                              title="Archive"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginatedActive.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                          No categories found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                  <div className="text-sm text-slate-500">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-50 hover:bg-white transition"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-50 hover:bg-white transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Deleted Categories View */}
        {activeTab === 'deleted' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">Slug</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Archived At</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deletedCategories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                        No archived categories.
                      </td>
                    </tr>
                  ) : (
                    deletedCategories.map(cat => (
                      <tr key={cat.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {cat.image && (
                              <img
                                src={cat.image}
                                className="w-10 h-10 rounded-xl object-cover opacity-75 cursor-pointer"
                                onClick={() => setImageModalSrc(cat.image!)}
                              />
                            )}
                            <span className="font-semibold text-slate-800">{cat.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell">{cat.slug}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{new Date(cat.deletedAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => openConfirmDialog(cat.id, 'restore')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition text-sm font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Restore
                          </button>
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

// Stats Card component (reused from product section)
function StatsCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
  };
  const IconComponent = () => {
    if (icon === 'Folder') {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    );
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