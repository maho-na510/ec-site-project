import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi, userApi, handleApiError } from '@services/api';
import { Category } from '@app-types/index';
import Input from '@components/shared/Input';
import Button from '@components/shared/Button';

export default function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await userApi.get<Category[]>('/categories');
      return res.data as Category[];
    },
  });

  // Fetch existing product if editing
  useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: async () => {
      const res = await adminApi.get(`/products/${id}`);
      return res.data;
    },
    enabled: isEdit,
    gcTime: 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (data: any) => {
      setName(data.name ?? '');
      setDescription(data.description ?? '');
      setPrice(String(data.price ?? ''));
      setCategoryId(String(data.categoryId ?? ''));
      setIsActive(data.isActive ?? true);
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('category_id', categoryId);
    formData.append('is_active', String(isActive));
    if (!isEdit) formData.append('initial_stock', initialStock);
    images.forEach((file) => formData.append('images[]', file));

    try {
      if (isEdit) {
        await adminApi.put(`/products/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await adminApi.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      navigate('/admin/products');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? '商品編集' : '商品登録'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl shadow p-6">
        <Input
          label="商品名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">説明</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Input
          label="価格 (円)"
          type="number"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          fullWidth
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">カテゴリ</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {!isEdit && (
          <Input
            label="初期在庫数"
            type="number"
            min="0"
            value={initialStock}
            onChange={(e) => setInitialStock(e.target.value)}
            required
            fullWidth
          />
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            商品画像 (複数可・JPEG/PNG/GIF/WebP・各5MBまで)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files ?? []))}
            className="text-sm text-gray-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isActive"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
            販売中（チェックを外すと非公開）
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" isLoading={isLoading}>
            {isEdit ? '更新する' : '登録する'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  );
}
