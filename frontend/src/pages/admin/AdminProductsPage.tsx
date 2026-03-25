import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, handleApiError } from '@services/api';
import { Product } from '@app-types/index';
import Button from '@components/shared/Button';

interface AdminProductListResponse {
  data: Product[];
  pagination: { total: number; page: number; perPage: number; totalPages: number };
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery<AdminProductListResponse>({
    queryKey: ['admin', 'products', search, page],
    queryFn: async () => {
      const res = await adminApi.get('/products', { params: { search, page, perPage: 20 } });
      return res.data as AdminProductListResponse;
    },
  });

  const toggleSuspendMutation = useMutation({
    mutationFn: (id: number) => adminApi.patch(`/products/${id}/toggle-suspension`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
    onError: (err) => setError(handleApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.delete(`/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
    onError: (err) => setError(handleApiError(err)),
  });

  const handleDelete = (product: Product) => {
    if (!window.confirm(`「${product.name}」を削除しますか？`)) return;
    setError('');
    deleteMutation.mutate(product.id);
  };

  const products = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">商品管理</h2>
        <Link to="/admin/products/new">
          <Button size="sm">+ 新規商品登録</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="商品名で検索..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">価格</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">在庫</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">
                      商品が見つかりません
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">¥{product.price.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {product.stockQuantity === 0 ? (
                          <span className="text-red-600 font-medium">在庫切れ</span>
                        ) : (
                          product.stockQuantity
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {product.isSuspended ? (
                          <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">販売停止</span>
                        ) : product.isActive ? (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">販売中</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">非公開</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Link
                          to={`/admin/products/${product.id}/edit`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          編集
                        </Link>
                        <button
                          onClick={() => toggleSuspendMutation.mutate(product.id)}
                          className="text-xs text-yellow-600 hover:underline"
                        >
                          {product.isSuspended ? '停止解除' : '販売停止'}
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                前へ
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                {page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                次へ
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
