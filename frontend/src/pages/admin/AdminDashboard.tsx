import { useQuery } from '@tanstack/react-query';
import { adminApi, handleApiError } from '@services/api';

interface InventoryStats {
  totalProducts: number;
  activeProducts: number;
  outOfStockCount: number;
  lowStockCount: number;
  suspendedCount: number;
  totalStockValue: number;
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`bg-white rounded-xl shadow p-5 ${highlight ? 'border-l-4 border-red-500' : ''}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${highlight ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useQuery<InventoryStats>({
    queryKey: ['admin', 'inventory-stats'],
    queryFn: async () => {
      const res = await adminApi.get('/inventory/statistics');
      return res.data as InventoryStats;
    },
  });

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

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="総商品数" value={stats?.totalProducts ?? '-'} />
        <StatCard label="販売中" value={stats?.activeProducts ?? '-'} />
        <StatCard label="在庫切れ" value={stats?.outOfStockCount ?? '-'} highlight={(stats?.outOfStockCount ?? 0) > 0} />
        <StatCard label="在庫少" value={stats?.lowStockCount ?? '-'} highlight={(stats?.lowStockCount ?? 0) > 0} />
        <StatCard label="販売停止中" value={stats?.suspendedCount ?? '-'} />
        <StatCard
          label="在庫総額"
          value={stats ? `¥${stats.totalStockValue.toLocaleString()}` : '-'}
        />
      </div>
    </div>
  );
}
