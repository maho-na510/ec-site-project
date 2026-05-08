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
  } = useForm<RegisterFormData>({ mode: 'onChange' });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await authService.register(data);
      setSuccessMessage('登録が完了しました');

      setTimeout(() => {
        navigate('/login', {
          state: { message: '登録が完了しました。ログインしてください。' },
        });
      }, 2000);
    } catch (err) {
      setError('登録に失敗しました');
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
                required: '名前を入力してください',
                minLength: { value: 2, message: '名前は2文字以上で入力してください' },
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
                required: 'メールアドレスを入力してください',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: '正しいメールアドレスを入力してください',
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
              {...register('phone')}
            />

            {/* 住所 */}
            <Input
              label="住所"
              placeholder="東京都渋谷区..."
              error={errors.address?.message}
              fullWidth
              {...register('address')}
            />

            {/* パスワード */}
            <Input
              label="パスワード"
              type="password"
              placeholder="パスワード（8文字以上、英字・数字を含む）"
              error={errors.password?.message}
              helperText="8文字以上、英字・数字を含めてください"
              fullWidth
              {...register('password', {
                required: 'パスワードを入力してください',
                minLength: { value: 8, message: 'パスワードは8文字以上で入力してください' },
                validate: (value) => {
                  if (!/[A-Za-z]/.test(value)) return 'パスワードには英字を含めてください';
                  if (!/[0-9]/.test(value)) return 'パスワードには数字を含めてください';
                  return true;
                },
              })}
            />

            {/* パスワード確認 */}
            <Input
              label="パスワード (確認)"
              type="password"
              placeholder="パスワードを再入力"
              error={errors.passwordConfirmation?.message}
              fullWidth
              {...register('passwordConfirmation', {
                required: 'パスワード（確認）を入力してください',
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
