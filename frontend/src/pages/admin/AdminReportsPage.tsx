import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminApi, handleApiError } from '@services/api';
import Button from '@components/shared/Button';

interface Report {
  filename: string;
  size: number;
  createdAt: string;
  type: 'inventory' | 'sales';
}

interface ReportListResponse {
  data: Report[];
}

export default function AdminReportsPage() {
  const [salesStart, setSalesStart] = useState('');
  const [salesEnd, setSalesEnd] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data: reportsData, isLoading, refetch } = useQuery<ReportListResponse>({
    queryKey: ['admin', 'reports'],
    queryFn: async () => {
      const res = await adminApi.get('/reports');
      return res.data as ReportListResponse;
    },
  });
  const reports = reportsData?.data ?? [];

  const inventoryMutation = useMutation({
    mutationFn: () => adminApi.post('/reports/inventory', {}),
    onSuccess: () => {
      setSuccessMsg('在庫レポートを生成しました');
      setErrorMsg('');
      refetch();
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err) => {
      setErrorMsg(handleApiError(err));
      setSuccessMsg('');
    },
  });

  const salesMutation = useMutation({
    mutationFn: () =>
      adminApi.post('/reports/sales', {
        start_date: salesStart,
        end_date: salesEnd,
      }),
    onSuccess: () => {
      setSuccessMsg('売上レポートを生成しました');
      setErrorMsg('');
      setSalesStart('');
      setSalesEnd('');
      refetch();
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err) => {
      setErrorMsg(handleApiError(err));
      setSuccessMsg('');
    },
  });

  const handleSalesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesStart || !salesEnd) return;
    setErrorMsg('');
    salesMutation.mutate();
  };

  const handleDownload = async (filename: string) => {
    setDownloading(filename);
    try {
      const res = await adminApi.get('/reports/download', {
        params: { filename },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMsg(handleApiError(err));
    } finally {
      setDownloading(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const typeLabel = (type: string) =>
    type === 'inventory' ? '在庫レポート' : type === 'sales' ? '売上レポート' : type;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">レポート</h2>

      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 在庫レポート */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-2">在庫レポート</h3>
          <p className="text-sm text-gray-500 mb-4">
            現在の全商品の在庫状況をCSVで出力します。
          </p>
          <Button
            onClick={() => inventoryMutation.mutate()}
            isLoading={inventoryMutation.isPending}
          >
            レポートを生成
          </Button>
        </div>

        {/* 売上レポート */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-2">売上レポート</h3>
          <p className="text-sm text-gray-500 mb-4">
            指定期間の売上データをCSVで出力します。
          </p>
          <form onSubmit={handleSalesSubmit} className="space-y-3">
            <div className="flex gap-2 items-center">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-medium text-gray-600">開始日</label>
                <input
                  type="date"
                  value={salesStart}
                  onChange={(e) => setSalesStart(e.target.value)}
                  required
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-medium text-gray-600">終了日</label>
                <input
                  type="date"
                  value={salesEnd}
                  onChange={(e) => setSalesEnd(e.target.value)}
                  required
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <Button type="submit" isLoading={salesMutation.isPending}>
              レポートを生成
            </Button>
          </form>
        </div>
      </div>

      {/* レポート一覧 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">生成済みレポート</h3>
          <button
            onClick={() => refetch()}
            className="text-sm text-blue-600 hover:underline"
          >
            更新
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            生成されたレポートはありません
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ファイル名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">種別</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">サイズ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">作成日時</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.filename} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 font-mono">{report.filename}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        report.type === 'inventory'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {typeLabel(report.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatSize(report.size)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(report.createdAt).toLocaleString('ja-JP')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDownload(report.filename)}
                      disabled={downloading === report.filename}
                      className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {downloading === report.filename ? 'ダウンロード中...' : 'ダウンロード'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
