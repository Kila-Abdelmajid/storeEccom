'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import type { Product } from '@/types/product';
import { XMarkIcon, PhotoIcon, PlusIcon } from '@heroicons/react/24/outline';
import ImageModal from '@/components/ui/ImageModal';

type Category = { id: number; name: string };

export default function UpdateProductForm({
  product,
  onClose,
  onSuccess,
}: {
  product: Product;
  onClose: () => void;
  onSuccess?: (updatedProduct: Product) => void;
}) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isNew, setIsNew] = useState(product.isNew);
  const [newMainImage, setNewMainImage] = useState<File | null>(null);
  const [newMainPreview, setNewMainPreview] = useState<string | null>(null);
  const [newAdditionalImages, setNewAdditionalImages] = useState<File[]>([]);
  const [newAdditionalPreviews, setNewAdditionalPreviews] = useState<string[]>([]);
  const [existingAdditionalImages, setExistingAdditionalImages] = useState<string[]>(
    Array.isArray(product.additionalImages) ? product.additionalImages : []
  );
  // Pending image deletions (to be sent after product update)
  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
  }>({ isOpen: false, imageUrl: null });
  const [imageModalSrc, setImageModalSrc] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/DashboardApi/categories')
      .then(res => res.json())
      .then(setCategories)
      .catch(() => showToast('Failed to load categories', 'error'));
  }, [showToast]);

  useEffect(() => {
    return () => {
      if (newMainPreview) URL.revokeObjectURL(newMainPreview);
      newAdditionalPreviews.forEach(p => URL.revokeObjectURL(p));
    };
  }, [newMainPreview, newAdditionalPreviews]);

  const handleMainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (newMainPreview) URL.revokeObjectURL(newMainPreview);
    setNewMainImage(file);
    setNewMainPreview(file ? URL.createObjectURL(file) : null);
  };

  const removeNewMain = () => {
    if (newMainPreview) URL.revokeObjectURL(newMainPreview);
    setNewMainImage(null);
    setNewMainPreview(null);
  };

  const handleAdditionalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    newAdditionalPreviews.forEach(p => URL.revokeObjectURL(p));
    setNewAdditionalImages(files);
    setNewAdditionalPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeNewAdditional = (idx: number) => {
    URL.revokeObjectURL(newAdditionalPreviews[idx]);
    setNewAdditionalImages(prev => prev.filter((_, i) => i !== idx));
    setNewAdditionalPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // Mark an existing image for deletion (show confirmation first)
  const confirmDeleteImage = (imageUrl: string) => {
    setConfirmDialog({ isOpen: true, imageUrl });
  };

  const handleConfirmDelete = () => {
    if (confirmDialog.imageUrl) {
      const url = confirmDialog.imageUrl;
      setPendingDeletions(prev => [...prev, url]);
      setExistingAdditionalImages(prev => prev.filter(u => u !== url));
    }
    setConfirmDialog({ isOpen: false, imageUrl: null });
  };

  // Delete pending images after product update succeeds
  const deletePendingImages = async () => {
    if (pendingDeletions.length === 0) return;
    try {
      await Promise.all(
        pendingDeletions.map(async (imageUrl) => {
          const res = await fetch(
            `/api/DashboardApi/product-image?productId=${product.id}&imageUrl=${encodeURIComponent(imageUrl)}`,
            { method: 'DELETE' }
          );
          if (!res.ok) throw new Error();
        })
      );
      setPendingDeletions([]);
    } catch (err) {
      showToast('Some images could not be deleted', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('isNew', String(isNew));
    if (newMainImage) formData.append('mainImage', newMainImage);
    newAdditionalImages.forEach(f => formData.append('additionalImages', f));

    try {
      // Update product details (the server should not delete images here)
      const res = await fetch(`/api/DashboardApi/product?id=${product.id}`, { method: 'PUT', body: formData });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Update failed');
      }
      const updatedProduct = await res.json();

      // Now delete pending images (they were already removed from the updated list)
      await deletePendingImages();

      showToast('Product updated successfully', 'success');
      onSuccess?.(updatedProduct);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Image modal for preview */}
      {imageModalSrc && (
        <ImageModal src={imageModalSrc} alt="Product image" onClose={() => setImageModalSrc(null)} />
      )}

      {/* Custom confirmation dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white/95 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Delete Image</h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              Are you sure you want to remove this image? It will be deleted after you save the product.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog({ isOpen: false, imageUrl: null })}
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

      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-white/50">
          {/* Header */}
          <div className="sticky top-0 bg-white/80 backdrop-blur-sm px-6 py-4 border-b border-slate-100 flex justify-between items-center rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Edit Product
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
                <label className="block text-sm font-medium text-slate-700">Product name *</label>
                <input
                  name="name"
                  defaultValue={product.name}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Category *</label>
                <select
                  name="categoryId"
                  defaultValue={product.categoryId}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Price </label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue={product.price}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Old price</label>
                <input
                  name="oldPrice"
                  type="number"
                  step="0.01"
                  defaultValue={product.oldPrice || ''}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Stock *</label>
                <input
                  name="stock"
                  type="number"
                  defaultValue={product.stock}
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
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea
                name="description"
                defaultValue={product.description || ''}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl resize-none"
              />
            </div>

            {/* Current main image */}
            {product.image && !newMainPreview && (
              <div>
                <label className="text-sm font-medium text-slate-700">Current main image</label>
                <img
                  src={product.image}
                  className="w-20 h-20 rounded-xl object-cover mt-1 shadow-sm cursor-pointer"
                  onClick={() => setImageModalSrc(product.image!)}
                />
              </div>
            )}

            {/* New main image section */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Change main image (optional)</label>
              <div className="flex gap-4 flex-wrap items-center">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl shadow-md transition">
                  <PhotoIcon className="w-5 h-5" />
                  Choose new image
                  <input type="file" accept="image/*" onChange={handleMainChange} className="hidden" />
                </label>
                {newMainPreview && (
                  <div className="relative">
                    <img
                      src={newMainPreview}
                      className="w-20 h-20 rounded-xl object-cover border-2 border-amber-500 cursor-pointer"
                      onClick={() => setImageModalSrc(newMainPreview)}
                    />
                    <button
                      type="button"
                      onClick={removeNewMain}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Existing additional images */}
            {existingAdditionalImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Existing additional images</label>
                <div className="grid grid-cols-4 gap-3">
                  {existingAdditionalImages.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={url}
                        className="w-full h-24 object-cover rounded-xl border border-slate-200 cursor-pointer"
                        onClick={() => setImageModalSrc(url)}
                      />
                      <button
                        type="button"
                        onClick={() => confirmDeleteImage(url)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition w-5 h-5 flex items-center justify-center"
                      >
                        <span className="text-xs font-bold">✕</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New additional images */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Add more images</label>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition">
                <PlusIcon className="w-5 h-5" />
                Add images
                <input type="file" accept="image/*" multiple onChange={handleAdditionalChange} className="hidden" />
              </label>
              {newAdditionalPreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mt-3">
                  {newAdditionalPreviews.map((src, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={src}
                        className="w-full h-24 object-cover rounded-xl border border-slate-200 cursor-pointer"
                        onClick={() => setImageModalSrc(src)}
                      />
                      <button
                        type="button"
                        onClick={() => removeNewAdditional(idx)}
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
                    Updating...
                  </div>
                ) : (
                  'Update Product'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}