// components/dashboard/CategoryManagement/UpdateCategory.tsx
'use client';

import { useState, useEffect } from 'react';

type Category = { id: number; name: string; slug: string; image: string | null };

export default function UpdateCategory({ category, onClose }: { category: Category; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
      if (!res.ok) throw new Error();
      onClose();
    } catch {
      alert('Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">Edit Category</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Slug</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Current image</label>
            {category.image && !preview && <img src={category.image} className="w-20 h-20 object-cover rounded-lg" />}
            <label className="block text-sm font-medium text-slate-700 mt-2">Replace image (optional)</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full" />
            {preview && (
              <div className="relative mt-2 inline-block">
                <img src={preview} className="w-20 h-20 object-cover rounded-lg" />
                <button type="button" onClick={removeNewImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs">✕</button>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">{loading ? 'Updating...' : 'Update'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}