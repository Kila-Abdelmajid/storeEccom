// components/dashboard/ProductManagement/AddProduct.tsx
'use client';

import { useState, useEffect } from 'react';

type Category = { id: number; name: string };

export default function AddProduct({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainPreview, setMainPreview] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);
  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
    fetch('/api/DashboardApi/categories')
      .then(res => res.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

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
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('isNew', String(isNew));
    if (mainImage) formData.append('mainImage', mainImage);
    additionalImages.forEach(f => formData.append('additionalImages', f));

    try {
      const res = await fetch('/api/DashboardApi/product', { method: 'POST', body: formData });
      if (!res.ok) throw new Error();
      onSuccess?.();       // refresh product list
      onClose();           // close modal
    } catch (err) {
      alert('Error adding product');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Add New Product</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product name *</label>
              <input name="name" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select name="categoryId" required className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Select</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (DH) *</label>
              <input name="price" type="number" step="0.01" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Old price</label>
              <input name="oldPrice" type="number" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
              <input name="stock" type="number" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} className="w-4 h-4 text-indigo-600" />
                Mark as New
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg"></textarea>
          </div>

          {/* Main image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Main image</label>
            <div className="flex items-center gap-4 flex-wrap">
              <label className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Choose image
                <input type="file" accept="image/*" onChange={handleMainChange} className="hidden" />
              </label>
              {mainPreview && (
                <div className="relative">
                  <img src={mainPreview} className="w-20 h-20 object-cover rounded-lg border-2 border-indigo-500" />
                  <button type="button" onClick={removeMain} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">✕</button>
                </div>
              )}
            </div>
          </div>

          {/* Additional images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional images</label>
            <label className="cursor-pointer inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add images
              <input type="file" accept="image/*" multiple onChange={handleAdditionalChange} className="hidden" />
            </label>
            {additionalPreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                {additionalPreviews.map((src, idx) => (
                  <div key={idx} className="relative">
                    <img src={src} className="w-full h-24 object-cover rounded-lg border" />
                    <button type="button" onClick={() => removeAdditional(idx)} className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 text-xs">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
              {loading ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}