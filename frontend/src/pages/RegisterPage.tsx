import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../services/authService';
import { RegisterFormData } from '../types';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const response = await authService.register(data);
      setSuccessMessage(response.message || '登録が完了しました');

      setTimeout(() => {
        navigate('/login', {
          state: { message: '登録が完了しました。ログインしてください。' },
        });
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'エラーが発生しました'
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4 py-12">
      <div className="max-w-lg w-full">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">新規登録</h1>
          <p className="text-secondary-600">アカウントを作成してください</p>
        </div>

        {/* 登録フォーム */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* エラーメッセージ */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* 成功メッセージ */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            {/* 名前 */}
            <Input
              label="名前"
              placeholder="山田 太郎"
              error={errors.name?.message}
              fullWidth
              {...register('name', {
                required: 'この項目は必須です',
                minLength: { value: 2, message: '最低2文字必要です' },
              })}
            />

            {/* メールアドレス */}
            <Input
              label="メールアドレス"
              type="email"
              placeholder="example@email.com"
              error={errors.email?.message}
              fullWidth
              {...register('email', {
                required: 'この項目は必須です',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: '有効なメールアドレスを入力してください',
                },
              })}
            />

            {/* 電話番号 */}
            <Input
              label="電話番号"
              type="tel"
              placeholder="090-1234-5678"
              error={errors.phone?.message}
              fullWidth
              {...register('phone', {
                required: 'この項目は必須です',
              })}
            />

            {/* 住所 */}
            <Input
              label="住所"
              placeholder="東京都渋谷区..."
              error={errors.address?.message}
              fullWidth
              {...register('address', {
                required: 'この項目は必須です',
              })}
            />

            {/* パスワード */}
            <Input
              label="パスワード"
              type="password"
              placeholder="パスワード（8文字以上）"
              error={errors.password?.message}
              helperText="8文字以上で入力してください"
              fullWidth
              {...register('password', {
                required: 'この項目は必須です',
                minLength: { value: 8, message: '最低8文字必要です' },
              })}
            />

            {/* パスワード確認 */}
            <Input
              label="パスワード（確認）"
              type="password"
              placeholder="パスワードを再入力"
              error={errors.passwordConfirmation?.message}
              fullWidth
              {...register('passwordConfirmation', {
                required: 'この項目は必須です',
                validate: (value) =>
                  value === password || 'パスワードが一致しません',
              })}
            />

            {/* 登録ボタン */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              disabled={!!successMessage}
            >
              新規登録
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-secondary-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-secondary-500">
                すでにアカウントをお持ちの方
              </span>
            </div>
          </div>

          <Link to="/login">
            <Button variant="outline" fullWidth>
              ログインはこちら
            </Button>
          </Link>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-secondary-600 hover:text-secondary-900">
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
