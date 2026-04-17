import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.requestPasswordReset(email);
      setIsSubmitted(true);
    } catch {
      setError('送信に失敗しました。しばらくしてからお試しください');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">パスワードをお忘れですか？</h1>
          <p className="text-secondary-600">
            登録済みのメールアドレスを入力してください
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg text-sm">
                パスワードリセットの手順をメールで送信しました。
                メールが届かない場合は、迷惑メールフォルダをご確認ください。
              </div>
              <Link to="/login">
                <Button variant="outline" fullWidth>
                  ログイン画面に戻る
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Input
                label="メールアドレス"
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                autoComplete="email"
              />

              <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
                リセットメールを送信
              </Button>
            </form>
          )}
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

export default ForgotPasswordPage;
