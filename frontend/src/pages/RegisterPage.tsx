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

  // Watch password to validate password confirmation
  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const response = await authService.register(data);
      setSuccessMessage(
        response.message || '登録が完了しました'
      );

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login', {
          state: { message: '登録が完了しました' },
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
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">新規登録</h1>
          <p className="text-secondary-600">新規登録</p>
        </div>

        {/* Registration Form Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            {/* Personal Information */}
            <div>
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                個人情報
              </h2>
              <div className="space-y-4">
                <Input
                  label="名前"
                  placeholder="名前"
                  error={errors.name?.message}
                  fullWidth
                  {...register('name', {
                    required: 'この項目は必須です',
                    minLength: {
                      value: 2,
                      message: '最低2文字必要です',
                    },
                  })}
                />

                <Input
                  label="メールアドレス"
                  type="email"
                  placeholder="メールアドレス"
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

                <Input
                  label="電話番号"
                  type="tel"
                  placeholder="電話番号"
                  error={errors.phoneNumber?.message}
                  fullWidth
                  {...register('phoneNumber', {
                    required: 'この項目は必須です',
                    pattern: {
                      value: /^[\d\s\-\(\)]+$/,
                      message: '無効な形式です',
                    },
                  })}
                />
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                住所
              </h2>
              <div className="space-y-4">
                <Input
                  label="住所"
                  placeholder="住所"
                  error={errors.address?.message}
                  fullWidth
                  {...register('address', {
                    required: 'この項目は必須です',
                  })}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="住所"
                    placeholder="住所"
                    error={errors.city?.message}
                    fullWidth
                    {...register('city', {
                      required: 'この項目は必須です',
                    })}
                  />

                  <Input
                    label="住所"
                    placeholder="住所"
                    error={errors.state?.message}
                    fullWidth
                    {...register('state', {
                      required: 'この項目は必須です',
                    })}
                  />

                  <Input
                    label="住所"
                    placeholder="住所"
                    error={errors.postalCode?.message}
                    fullWidth
                    {...register('postalCode', {
                      required: 'この項目は必須です',
                      pattern: {
                        value: /^\d{5}(-\d{4})?$/,
                        message: '無効な形式です',
                      },
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Password Information */}
            <div>
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                パスワード
              </h2>
              <div className="space-y-4">
                <Input
                  label="パスワード"
                  type="password"
                  placeholder="パスワード"
                  error={errors.password?.message}
                  helperText="最低6文字必要です"
                  fullWidth
                  {...register('password', {
                    required: 'この項目は必須です',
                    minLength: {
                      value: 6,
                      message: '最低6文字必要です',
                    },
                  })}
                />

                <Input
                  label="パスワード（確認）"
                  type="password"
                  placeholder="パスワード（確認）"
                  error={errors.passwordConfirmation?.message}
                  fullWidth
                  {...register('passwordConfirmation', {
                    required: 'この項目は必須です',
                    validate: (value) =>
                      value === password || 'パスワードが一致しません',
                  })}
                />
              </div>
            </div>

            {/* Submit Button */}
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

          {/* Divider */}
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

          {/* Login Link */}
          <Link to="/login">
            <Button variant="outline" fullWidth>
              サインイン
            </Button>
          </Link>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-secondary-600 hover:text-secondary-900">
            戻る
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
