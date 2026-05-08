import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // トークンがURLにない場合は無効なリンクとして扱う
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-md p-8 text-center space-y-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-lg text-sm">
              無効なパスワードリセットリンクです。
              リンクの有効期限が切れているか、URLが正しくありません。
            </div>
            <Link to="/forgot-password">
              <Button variant="outline" fullWidth>
                再度リセットメールを送信する
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirmation) {
      setError('パスワードが一致しません');
      return;
    }

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('パスワードは8文字以上、英字・数字を含めてください');
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword(token, password);
      navigate('/login', {
        state: { message: 'パスワードを変更しました。新しいパスワードでログインしてください。' },
      });
    } catch (err: any) {
      const status = err?.statusCode;
      if (status === 401) {
        setError('リセットリンクの有効期限が切れています。再度メールを送信してください。');
      } else {
        setError('パスワードの変更に失敗しました。しばらくしてからお試しください');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">新しいパスワードを設定</h1>
          <p className="text-secondary-600">8文字以上のパスワードを入力してください</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              label="新しいパスワード"
              type="password"
              placeholder="新しいパスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="new-password"
            />

            <Input
              label="パスワード（確認）"
              type="password"
              placeholder="パスワードをもう一度入力"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              fullWidth
              autoComplete="new-password"
            />

            <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
              パスワードを変更する
            </Button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link to="/login" className="text-sm text-secondary-600 hover:text-secondary-900">
            ログイン画面に戻る
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
