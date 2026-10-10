'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { XMarkIcon, PhotoIcon, PlusIcon } from '@heroicons/react/24/outline';
import ImageModal from '@/components/ui/ImageModal';

type Category = { id: number; name: string };

export default function AddProduct({ onClose, onSuccess }: { onClose: () => void; onSuccess?: (product: any) => void }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainPreview, setMainPreview] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);
  const [isNew, setIsNew] = useState(true);
  const [imageModalSrc, setImageModalSrc] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/DashboardApi/categories')
      .then(res => res.json())
      .then(setCategories)
      .catch(() => showToast('Failed to load categories', 'error'));
  }, [showToast]);

  useEffect(() => {
    return () => {
      if (mainPreview) URL.revokeObjectURL(mainPreview);
      additionalPreviews.forEach(p => URL.revokeObjectURL(p));
    };
  }, [mainPreview, additionalPreviews]);

  const handleMainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (mainPreview) URL.revokeObjectURL(mainPreview);
    setMainImage(file);
    setMainPreview(file ? URL.createObjectURL(file) : null);
  };

  const removeMain = () => {
    if (mainPreview) URL.revokeObjectURL(mainPreview);
    setMainImage(null);
    setMainPreview(null);
  };

  const handleAdditionalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    additionalPreviews.forEach(p => URL.revokeObjectURL(p));
    setAdditionalImages(files);
    setAdditionalPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeAdditional = (index: number) => {
    URL.revokeObjectURL(additionalPreviews[index]);
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    setAdditionalPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!mainImage) {
      showToast('Please select a main image', 'error');
      return;
    }
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('isNew', String(isNew));
    formData.append('mainImage', mainImage);
    additionalImages.forEach(f => formData.append('additionalImages', f));

    try {
      const res = await fetch('/api/DashboardApi/product', { method: 'POST', body: formData });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add product');
      }
      const newProduct = await res.json();
      showToast('Product added successfully', 'success');
      onSuccess?.(newProduct);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Error adding product', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {imageModalSrc && (
        <ImageModal src={imageModalSrc} alt="Product image" onClose={() => setImageModalSrc(null)} />
      )}

      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-white/50">
          {/* Header */}
          <div className="sticky top-0 bg-white/80 backdrop-blur-sm px-6 py-4 border-b border-slate-100 flex justify-between items-center rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Add New Product
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product name *</label>
                <input
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select
                  name="categoryId"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                >
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price  *</label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Old price</label>
                <input
                  name="oldPrice"
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stock *</label>
                <input
                  name="stock"
                  type="number"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={isNew}
                    onChange={(e) => setIsNew(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-300"
                  />
                  Mark as New
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl resize-none"
              />
            </div>

            {/* Main image */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Main image *</label>
              <div className="flex items-center gap-4 flex-wrap">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl shadow-md transition">
                  <PhotoIcon className="w-5 h-5" />
                  Choose image
                  <input type="file" accept="image/*" onChange={handleMainChange} className="hidden" />
                </label>
                {mainPreview && (
                  <div className="relative">
                    <img
                      src={mainPreview}
                      className="w-20 h-20 rounded-xl object-cover border-2 border-amber-500 cursor-pointer"
                      onClick={() => setImageModalSrc(mainPreview)}
                    />
                    <button
                      type="button"
                      onClick={removeMain}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Additional images */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Additional images</label>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition">
                <PlusIcon className="w-5 h-5" />
                Add images
                <input type="file" accept="image/*" multiple onChange={handleAdditionalChange} className="hidden" />
              </label>
              {additionalPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  {additionalPreviews.map((src, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={src}
                        className="w-full h-24 object-cover rounded-xl border border-slate-200 cursor-pointer"
                        onClick={() => setImageModalSrc(src)}
                      />
                      <button
                        type="button"
                        onClick={() => removeAdditional(idx)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 transition"
              >
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
                    Adding...
                  </div>
                ) : (
                  'Add Product'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}