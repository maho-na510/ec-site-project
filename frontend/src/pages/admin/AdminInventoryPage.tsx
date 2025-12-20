import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, handleApiError } from '@services/api';
import { Product, InventoryLog } from '@app-types/index';
import Button from '@components/shared/Button';

type ActionType = 'restock' | 'adjustment' | 'return';

interface AdjustForm {
  productId: number | '';
  quantity: string;
  actionType: ActionType;
  notes: string;
}

export default function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AdjustForm>({
    productId: '',
    quantity: '',
    actionType: 'restock',
    notes: '',
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  // 全商品リスト（商品選択に使用）
  const { data: productsData } = useQuery<{ data: Product[] }>({
    queryKey: ['admin', 'products-all'],
    queryFn: async () => {
      const res = await adminApi.get('/products', { params: { perPage: 200 } });
      return res.data as { data: Product[] };
    },
  });
  const products = productsData?.data ?? [];

  // 在庫ログ
  const { data: logsData, isLoading: logsLoading } = useQuery<{ data: InventoryLog[] }>({
    queryKey: ['admin', 'inventory-logs'],
    queryFn: async () => {
      const res = await adminApi.get('/inventory/logs');
      return res.data as { data: InventoryLog[] };
    },
  });
  const logs = logsData?.data ?? [];

  const adjustMutation = useMutation({
    mutationFn: async () => {
      const { productId, quantity, actionType, notes } = form;
      return adminApi.post(`/inventory/${productId}/adjust`, {
        quantity: Number(quantity),
        action_type: actionType,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      setSuccessMsg('在庫を更新しました');
      setForm({ productId: '', quantity: '', actionType: 'restock', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory-logs'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory-stats'] });
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => setError(handleApiError(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.productId || !form.quantity) return;
    adjustMutation.mutate();
  };

  const actionTypeLabel: Record<ActionType, string> = {
    restock: '入荷',
    adjustment: '調整',
    return: '返品',
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">在庫管理</h2>

      {/* Adjust form */}
      <div className="bg-white rounded-xl shadow p-6 mb-8 max-w-lg">
        <h3 className="text-lg font-semibold mb-4">在庫調整</h3>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
        )}
        {successMsg && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">{successMsg}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">商品</label>
            <select
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value ? Number(e.target.value) : '' })}
              required
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">選択してください</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}（現在: {p.stockQuantity}個）
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">操作種別</label>
            <select
              value={form.actionType}
              onChange={(e) => setForm({ ...form, actionType: e.target.value as ActionType })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="restock">入荷（数量を増やす）</option>
              <option value="adjustment">調整（数量を変更）</option>
              <option value="return">返品（数量を増やす）</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">数量</label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 10（減らす場合は -10）"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">メモ（任意）</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="調整理由など"
            />
          </div>

          <Button type="submit" isLoading={adjustMutation.isPending}>
            在庫を更新する
          </Button>
        </form>
      </div>

      {/* Inventory logs */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">在庫操作履歴（直近30日）</h3>
        </div>

        {logsLoading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日時</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">変更前</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">変更後</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    履歴がありません
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{log.productId}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {actionTypeLabel[log.actionType as ActionType] ?? log.actionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.quantityBefore}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{log.quantityAfter}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
