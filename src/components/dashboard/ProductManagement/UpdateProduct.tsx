// components/dashboard/ProductManagement/UpdateProduct.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types/product';

type Category = { id: number; name: string };

export default function UpdateProductForm({ product, onClose }: { product: Product; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isNew, setIsNew] = useState(product.isNew);
  const [newMainImage, setNewMainImage] = useState<File | null>(null);
  const [newMainPreview, setNewMainPreview] = useState<string | null>(null);
  const [newAdditionalImages, setNewAdditionalImages] = useState<File[]>([]);
  const [newAdditionalPreviews, setNewAdditionalPreviews] = useState<string[]>([]);
  const [existingAdditionalImages, setExistingAdditionalImages] = useState<string[]>(Array.isArray(product.additionalImages) ? product.additionalImages : []);
  const [deletingImages, setDeletingImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/DashboardApi/categories').then(res => res.json()).then(setCategories).catch(console.error);
  }, []);

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

  const removeExistingImage = async (imageUrl: string) => {
    if (!confirm('Delete this image?')) return;
    setDeletingImages(prev => new Set(prev).add(imageUrl));
    try {
      const res = await fetch(`/api/DashboardApi/product-image?productId=${product.id}&imageUrl=${encodeURIComponent(imageUrl)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setExistingAdditionalImages(prev => prev.filter(url => url !== imageUrl));
    } catch (err) {
      alert('Failed to delete image');
    } finally {
      setDeletingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageUrl);
        return newSet;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('isNew', String(isNew));
    if (newMainImage) formData.append('mainImage', newMainImage);
    newAdditionalImages.forEach(f => formData.append('additionalImages', f));
    // optional: send list of images to delete (existingAdditionalImages already removed client-side, but we also call API separately)

    try {
      const res = await fetch(`/api/DashboardApi/product?id=${product.id}`, { method: 'PUT', body: formData });
      if (!res.ok) throw new Error();
      router.refresh();
      onClose();
    } catch (err) {
      alert('Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Edit Product</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block text-sm font-medium text-gray-700">Product name *</label><input name="name" defaultValue={product.name} required className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Category *</label><select name="categoryId" defaultValue={product.categoryId} required className="w-full px-3 py-2 border rounded-lg">{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700">Price (DH) *</label><input name="price" type="number" step="0.01" defaultValue={product.price} required className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Old price</label><input name="oldPrice" type="number" step="0.01" defaultValue={product.oldPrice || ''} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Stock *</label><input name="stock" type="number" defaultValue={product.stock} required className="w-full px-3 py-2 border rounded-lg" /></div>
            <div className="flex items-center"><label className="flex items-center gap-2"><input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} className="w-4 h-4 text-indigo-600" /> Mark as New</label></div>
          </div>

          <div><label className="block text-sm font-medium text-gray-700">Description</label><textarea name="description" defaultValue={product.description || ''} rows={3} className="w-full px-3 py-2 border rounded-lg"></textarea></div>

          {/* Current main image */}
          {product.image && !newMainPreview && <div><label className="text-sm font-medium">Current main image</label><img src={product.image} className="w-20 h-20 object-cover rounded-lg mt-1" /></div>}
          {/* New main image */}
          <div><label className="block text-sm font-medium">Change main image (optional)</label><div className="flex gap-4"><label className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-lg">Choose new image<input type="file" accept="image/*" onChange={handleMainChange} className="hidden" /></label>{newMainPreview && <div className="relative"><img src={newMainPreview} className="w-20 h-20 rounded-lg border-2 border-indigo-500" /><button type="button" onClick={removeNewMain} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">✕</button></div>}</div></div>

          {/* Existing additional images */}
          {existingAdditionalImages.length > 0 && (
            <div><label className="block text-sm font-medium">Existing additional images</label><div className="grid grid-cols-4 gap-3 mt-2">{existingAdditionalImages.map((url, idx) => (<div key={idx} className="relative"><img src={url} className="w-full h-24 object-cover rounded-lg border" /><button type="button" onClick={() => removeExistingImage(url)} disabled={deletingImages.has(url)} className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 text-xs">{deletingImages.has(url) ? '...' : '✕'}</button></div>))}</div></div>
          )}

          {/* New additional images */}
          <div><label className="block text-sm font-medium">Add more images</label><label className="cursor-pointer inline-flex gap-2 bg-gray-100 px-4 py-2 rounded-lg">Add images<input type="file" accept="image/*" multiple onChange={handleAdditionalChange} className="hidden" /></label>{newAdditionalPreviews.length > 0 && <div className="grid grid-cols-4 gap-3 mt-3">{newAdditionalPreviews.map((src, idx) => (<div key={idx} className="relative"><img src={src} className="w-full h-24 object-cover rounded-lg" /><button type="button" onClick={() => removeNewAdditional(idx)} className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1">✕</button></div>))}</div>}</div>

          <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button><button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">{loading ? 'Updating...' : 'Update Product'}</button></div>
        </form>
      </div>
    </div>
  );
}