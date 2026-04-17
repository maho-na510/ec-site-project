import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi, handleApiError } from '@services/api';
import { Product } from '@app-types/index';

interface InventoryStats {
  totalProducts: number;
  activeProducts: number;
  outOfStockCount: number;
  lowStockCount: number;
  suspendedCount: number;
  totalStockValue: number;
}

function StatCard({
  label,
  value,
  highlight,
  linkTo,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
  linkTo?: string;
}) {
  const content = (
    <div className={`bg-white rounded-xl shadow p-5 ${highlight ? 'border-l-4 border-red-500' : ''}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${highlight ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
  if (linkTo) {
    return (
      <Link to={linkTo} className="block hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }
  return content;
}

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useQuery<InventoryStats>({
    queryKey: ['admin', 'inventory-stats'],
    queryFn: async () => {
      const res = await adminApi.get('/inventory/statistics');
      return res.data as InventoryStats;
    },
  });

  const { data: restockData } = useQuery<{ data: Product[] }>({
    queryKey: ['admin', 'needs-restock'],
    queryFn: async () => {
      const res = await adminApi.get('/inventory/needs-restock');
      return res.data as { data: Product[] };
    },
  });
  const restockItems = restockData?.data ?? [];

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          統計の取得に失敗しました: {handleApiError(error)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">ダッシュボード</h2>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="総商品数" value={stats?.totalProducts ?? '-'} linkTo="/admin/products" />
        <StatCard label="販売中" value={stats?.activeProducts ?? '-'} linkTo="/admin/products" />
        <StatCard
          label="在庫切れ"
          value={stats?.outOfStockCount ?? '-'}
          highlight={(stats?.outOfStockCount ?? 0) > 0}
          linkTo="/admin/inventory"
        />
        <StatCard
          label="在庫少"
          value={stats?.lowStockCount ?? '-'}
          highlight={(stats?.lowStockCount ?? 0) > 0}
          linkTo="/admin/inventory"
        />
        <StatCard label="販売停止中" value={stats?.suspendedCount ?? '-'} linkTo="/admin/products" />
        <StatCard
          label="在庫総額"
          value={stats ? `¥${stats.totalStockValue.toLocaleString()}` : '-'}
        />
      </div>

      {/* 要補充アラート */}
      {restockItems.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-red-700">補充が必要な商品</h3>
              <p className="text-xs text-red-500 mt-0.5">在庫が少ない・切れている商品です</p>
            </div>
            <Link
              to="/admin/inventory"
              className="text-xs text-red-600 hover:underline font-medium"
            >
              在庫管理へ →
            </Link>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">現在の在庫</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {restockItems.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                  <td className="px-4 py-3">
                    {product.stockQuantity === 0 ? (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full font-medium">
                        在庫切れ
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full font-medium">
                        残り {product.stockQuantity} 個
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to="/admin/inventory"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      在庫調整
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* クイックリンク */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/admin/products/new"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-5 text-center transition"
        >
          <p className="text-2xl mb-1">＋</p>
          <p className="text-sm font-semibold">商品を登録</p>
        </Link>
        <Link
          to="/admin/inventory"
          className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-5 text-center transition"
        >
          <p className="text-2xl mb-1">📦</p>
          <p className="text-sm font-semibold text-gray-700">在庫を調整</p>
        </Link>
        <Link
          to="/admin/reports"
          className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-5 text-center transition"
        >
          <p className="text-2xl mb-1">📊</p>
          <p className="text-sm font-semibold text-gray-700">レポートを作成</p>
        </Link>
      </div>
    </div>
  );
}
