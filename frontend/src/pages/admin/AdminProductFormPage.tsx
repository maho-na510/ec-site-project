import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi, userApi, handleApiError } from '@services/api';
import { Category } from '@app-types/index';
import Input from '@components/shared/Input';
import Button from '@components/shared/Button';
import { X, ImagePlus } from 'lucide-react';

interface ExistingImage {
  id: number;
  imageUrl: string;
  fullUrl: string;
  displayOrder: number;
}

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
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [, setReplaceImages] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await userApi.get<Category[]>('/categories');
      return res.data as Category[];
    },
  });

  // Fetch existing product for editing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: productData, isLoading: isProductLoading } = useQuery<any>({
    queryKey: ['admin', 'product', id],
    queryFn: async () => {
      const res = await adminApi.get(`/products/${id}`);
      return res.data;
    },
    enabled: isEdit,
    gcTime: 0,
  });

  // Populate form fields when product data arrives
  useEffect(() => {
    if (!productData) return;
    setName(productData.name ?? '');
    setDescription(productData.description ?? '');
    setPrice(String(productData.price ?? ''));
    setCategoryId(String(productData.categoryId ?? ''));
    setIsActive(productData.isActive ?? true);
    setExistingImages(productData.images ?? []);
  }, [productData]);

  // Generate preview URLs for newly selected files
  useEffect(() => {
    const urls = newImages.map((f) => URL.createObjectURL(f));
    setNewImagePreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [newImages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setNewImages(files);
    if (files.length > 0) setReplaceImages(true);
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) setReplaceImages(false);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('category_id', categoryId);
    formData.append('is_active', isActive ? '1' : '0');

    if (!isEdit) {
      formData.append('initial_stock', initialStock);
    }

    // 新規画像が選択されている場合のみ送信（バックエンドで既存画像を置き換える）
    if (newImages.length > 0) {
      newImages.forEach((file) => formData.append('images[]', file));
    }

    try {
      if (isEdit) {
        // PHP は PUT + multipart/form-data を解析できないため、
        // POST で送信しつつ _method=PUT でメソッドスプーフィングする（Laravel 標準の対処法）
        formData.append('_method', 'PUT');
        await adminApi.post(`/products/${id}`, formData, {
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
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? '商品編集' : '商品登録'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-xl shadow p-6">

        {/* 商品名 */}
        <Input
          label="商品名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
        />

        {/* 説明 */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">説明</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* 価格 */}
        <Input
          label="価格 (円)"
          type="number"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          fullWidth
        />

        {/* カテゴリ */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            カテゴリ <span className="text-red-500">*</span>
          </label>
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

        {/* 初期在庫（新規登録時のみ） */}
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

        {/* 公開状態 */}
        <div className="flex items-center gap-2">
          <input
            id="isActive"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
            販売中（チェックを外すと非公開）
          </label>
        </div>

        {/* ---- 画像セクション ---- */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-gray-700">商品画像</label>

          {/* 登録済み画像（編集時のみ表示） */}
          {isEdit && existingImages.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">
                現在の画像（新しい画像を選択すると置き換えられます）
              </p>
              <div className="flex flex-wrap gap-2">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                      src={img.fullUrl || img.imageUrl}
                      alt="商品画像"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 新規画像プレビュー */}
          {newImagePreviews.length > 0 && (
            <div>
              {isEdit && (
                <p className="text-xs text-orange-600 mb-2 font-medium">
                  ※ 保存すると上記の既存画像はすべて削除され、以下の画像に置き換わります
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {newImagePreviews.map((url, i) => (
                  <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-blue-300 bg-gray-50 group">
                    <img
                      src={url}
                      alt={`追加画像 ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ファイル選択 */}
          <label className="flex items-center gap-2 w-fit cursor-pointer px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-sm text-gray-600">
            <ImagePlus className="w-4 h-4 text-gray-400" />
            {newImages.length > 0
              ? `${newImages.length}枚選択中（クリックで変更）`
              : isEdit
              ? '新しい画像を選択（既存画像を置き換え）'
              : '画像を選択（複数可）'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-400">JPEG / PNG / GIF / WebP・各5MBまで</p>
        </div>

        {/* 送信ボタン */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting || (isEdit && isProductLoading)}>
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
