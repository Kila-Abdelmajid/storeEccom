// app/dashboard/CategorySection.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
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

const ITEMS_PER_PAGE = 8;

export default function CategorySection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [imageModalSrc, setImageModalSrc] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/DashboardApi/categories');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCategories(data);
      setError(null);
    } catch {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const deleteCategory = async (id: number) => {
    if (!confirm('Delete this category? It will also delete all products in this category (if any).')) return;
    try {
      const res = await fetch(`/api/DashboardApi/categories?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await fetchCategories();
    } catch {
      alert('Delete failed');
    }
  };

  const filtered = useMemo(() => {
    if (!search) return categories;
    return categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [categories, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  if (loading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div></div>;
  if (error) return <div className="text-center text-red-500 p-8">{error}</div>;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Categories</h1>
            <p className="text-slate-500 text-sm">Manage product categories</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl shadow-md flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Category
          </button>
        </div>

        {/* Modals */}
        {showAddModal && <AddCategory onClose={() => { setShowAddModal(false); fetchCategories(); }} />}
        {editingCategory && (
          <UpdateCategory
            category={editingCategory}
            onClose={() => { setEditingCategory(null); fetchCategories(); }}
          />
        )}
        {imageModalSrc && <ImageModal src={imageModalSrc} alt="Category image" onClose={() => setImageModalSrc(null)} />}

        {/* Search & table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b">
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full max-w-sm px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="w-12 px-4 py-3 text-left text-xs font-semibold text-slate-600">#</th>
                  <th className="w-[40%] px-4 py-3 text-left text-xs font-semibold text-slate-600">Category</th>
                  <th className="w-[25%] px-4 py-3 text-left text-xs font-semibold text-slate-600 hidden md:table-cell">Slug</th>
                  <th className="w-[15%] px-4 py-3 text-left text-xs font-semibold text-slate-600">Image</th>
                  <th className="w-[20%] px-4 py-3 text-left text-xs font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-indigo-50/30">
                    <td className="px-4 py-3 text-sm text-slate-500">{(currentPage-1)*ITEMS_PER_PAGE + idx+1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {cat.image && (
                          <img src={cat.image} className="w-8 h-8 rounded-md object-cover cursor-pointer" onClick={() => setImageModalSrc(cat.image!)} />
                        )}
                        <span className="font-medium text-slate-800">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 hidden md:table-cell">{cat.slug}</td>
                    <td className="px-4 py-3">
                      {cat.image ? (
                        <img src={cat.image} className="w-8 h-8 rounded-md object-cover cursor-pointer" onClick={() => setImageModalSrc(cat.image!)} />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setEditingCategory(cat)} className="p-1 text-indigo-500 hover:text-indigo-700" title="Edit">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => deleteCategory(cat.id)} className="p-1 text-rose-500 hover:text-rose-700" title="Delete">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-400">No categories found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t flex justify-between items-center bg-slate-50 text-sm">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="px-3 py-1 border rounded disabled:opacity-40">Previous</button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}