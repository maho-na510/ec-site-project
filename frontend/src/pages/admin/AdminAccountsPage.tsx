import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, handleApiError } from '@services/api';
import { Admin } from '@app-types/index';
import { useAuth } from '@contexts/AuthContext';
import Button from '@components/shared/Button';
import Input from '@components/shared/Input';

interface AdminListResponse {
  data: Admin[];
}

interface CreateAdminForm {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

const emptyForm: CreateAdminForm = {
  name: '',
  email: '',
  password: '',
  passwordConfirmation: '',
};

export default function AdminAccountsPage() {
  const queryClient = useQueryClient();
  const { user: currentAdmin } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateAdminForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<CreateAdminForm>>({});
  const [successMessage, setSuccessMessage] = useState('');

  // 管理者一覧取得
  const { data, isLoading, error } = useQuery<AdminListResponse>({
    queryKey: ['admin', 'accounts'],
    queryFn: async () => {
      const res = await adminApi.get('/admins');
      return res.data as AdminListResponse;
    },
  });

  // アカウント作成
  const createMutation = useMutation({
    mutationFn: (payload: CreateAdminForm) =>
      adminApi.post('/admins', {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        password_confirmation: payload.passwordConfirmation,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'accounts'] });
      setForm(emptyForm);
      setShowForm(false);
      setFormError('');
      setFieldErrors({});
      setSuccessMessage('管理者アカウントを作成しました');
      setTimeout(() => setSuccessMessage(''), 4000);
    },
    onError: (err: any) => {
      if (err?.errors) {
        const fe: Partial<CreateAdminForm> = {};
        if (err.errors.name) fe.name = err.errors.name[0];
        if (err.errors.email) fe.email = err.errors.email[0];
        if (err.errors.password) fe.password = err.errors.password[0];
        setFieldErrors(fe);
      } else {
        setFormError(handleApiError(err));
      }
    },
  });

  // アカウント削除
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.delete(`/admins/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'accounts'] });
      setSuccessMessage('管理者アカウントを削除しました');
      setTimeout(() => setSuccessMessage(''), 4000);
    },
    onError: (err) => setFormError(handleApiError(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFieldErrors({});

    if (form.password !== form.passwordConfirmation) {
      setFieldErrors({ passwordConfirmation: 'パスワードが一致しません' });
      return;
    }
    if (form.password.length < 8) {
      setFieldErrors({ password: 'パスワードは8文字以上で入力してください' });
      return;
    }

    createMutation.mutate(form);
  };

  const handleDelete = (admin: Admin) => {
    if (!window.confirm(`「${admin.name}」のアカウントを削除しますか？`)) return;
    setFormError('');
    deleteMutation.mutate(admin.id);
  };

  const handleCancel = () => {
    setShowForm(false);
    setForm(emptyForm);
    setFormError('');
    setFieldErrors({});
  };

  const admins = data?.data ?? [];

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">アカウント管理</h2>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            + 管理者を追加
          </Button>
        )}
      </div>

      {/* 成功メッセージ */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* エラーメッセージ */}
      {formError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {formError}
        </div>
      )}

      {/* 新規作成フォーム */}
      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">新しい管理者を追加</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="名前"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={fieldErrors.name}
                required
                fullWidth
                autoComplete="off"
              />
              <Input
                label="メールアドレス"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                error={fieldErrors.email}
                required
                fullWidth
                autoComplete="off"
              />
              <Input
                label="パスワード（8文字以上）"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                error={fieldErrors.password}
                required
                fullWidth
                autoComplete="new-password"
              />
              <Input
                label="パスワード（確認）"
                type="password"
                value={form.passwordConfirmation}
                onChange={(e) => setForm({ ...form, passwordConfirmation: e.target.value })}
                error={fieldErrors.passwordConfirmation}
                required
                fullWidth
                autoComplete="new-password"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" size="sm" isLoading={createMutation.isPending}>
                作成する
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                キャンセル
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 管理者一覧 */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          管理者一覧の取得に失敗しました
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">名前</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">メールアドレス</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">作成日</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                    管理者が見つかりません
                  </td>
                </tr>
              ) : (
                admins.map((admin) => {
                  const isSelf = currentAdmin?.id === admin.id;
                  return (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {admin.name}
                        {isSelf && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">自分</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{admin.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(admin.createdAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isSelf && (
                          <button
                            onClick={() => handleDelete(admin)}
                            disabled={deleteMutation.isPending}
                            className="text-xs text-red-600 hover:underline disabled:opacity-50"
                          >
                            削除
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
