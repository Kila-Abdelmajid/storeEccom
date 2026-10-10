'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';

type Category = { id: number; name: string; slug: string; image: string | null };

export default function UpdateCategory({
  category,
  onClose,
  onSuccess,
}: {
  category: Category;
  onClose: () => void;
  onSuccess?: (updatedCategory: Category) => void;
}) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (preview) URL.revokeObjectURL(preview);
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const removeNewImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setImage(null);
    setPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('slug', slug);
    if (image) formData.append('image', image);
    try {
      const res = await fetch(`/api/DashboardApi/categories?id=${category.id}`, { method: 'PUT', body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Update failed');
      }
      const updatedCategory = await res.json();
      showToast('Category updated successfully', 'success');
      onSuccess?.(updatedCategory);
      onClose();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md border border-white/50">
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm px-6 py-4 border-b border-slate-100 flex justify-between items-center rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Edit Category
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current image</label>
            {category.image && !preview && (
              <img src={category.image} className="w-20 h-20 rounded-xl object-cover mt-1" />
            )}
            <label className="block text-sm font-medium text-slate-700 mt-3 mb-1">Replace image (optional)</label>
            <div className="flex items-center gap-4 flex-wrap">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl shadow-md transition">
                <PhotoIcon className="w-5 h-5" />
                Choose image
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              {preview && (
                <div className="relative">
                  <img src={preview} className="w-20 h-20 rounded-xl object-cover border-2 border-amber-500" />
                  <button
                    type="button"
                    onClick={removeNewImage}
                    className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl shadow-md disabled:opacity-50 transition"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </div>
              ) : (
                'Update Category'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}