import { userApi, adminApi } from './api';
import { LoginFormData, RegisterFormData, User, Admin } from '@app-types/index';

/**
 * 認証サービス
 *
 * セキュリティ方針:
 * - JWTはサーバー側でHttpOnly Cookieにセットされる（XSS対策）
 * - フロントエンドはトークン文字列を一切保持しない
 * - ログイン状態はReact Context（インメモリ）で管理する
 */
export const authService = {
  // ユーザーログイン（サーバーがHttpOnly CookieにJWTをセット）
  async login(credentials: LoginFormData): Promise<{ user: User }> {
    const response = await userApi.post<{ user: User }>('/auth/login', credentials);
    return response.data as { user: User };
  },

  // 新規会員登録
  async register(data: RegisterFormData): Promise<{ user: User }> {
    const response = await userApi.post<{ user: User }>('/auth/register', data);
    return response.data as { user: User };
  },

  // パスワードリセットのメール送信
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await userApi.post('/passwords/forgot', { email });
    return response.data as { message: string };
  },

  // パスワードリセット実行
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await userApi.post('/passwords/reset', {
      token,
      password: newPassword,
      passwordConfirmation: newPassword,
    });
    return response.data as { message: string };
  },

  // ログアウト（サーバー側でCookieを削除）
  async logout(): Promise<void> {
    await userApi.post('/auth/logout');
  },

  // 管理者ログイン（サーバーがHttpOnly CookieにJWTをセット）
  async adminLogin(credentials: LoginFormData): Promise<{ admin: Admin }> {
    const response = await adminApi.post<{ admin: Admin }>('/auth/login', credentials);
    return response.data as { admin: Admin };
  },

  // 管理者ログアウト（サーバー側でCookieを削除）
  async adminLogout(): Promise<void> {
    await adminApi.post('/auth/logout');
  },

  // ログイン中のユーザー情報取得（Cookieが有効なら成功）
  // skipAuthRedirect: initAuth のセッション確認リクエストが login() 後に 401 で返っても
  // 誤リダイレクトが起きないよう、401時のリダイレクトをスキップする
  async getCurrentUser(): Promise<User> {
    const response = await userApi.get<User>('/users/me', { skipAuthRedirect: true });
    return response.data as User;
  },

  // ログイン中の管理者情報取得（Cookieが有効なら成功）
  // skipAuthRedirect: 同上
  async getCurrentAdmin(): Promise<Admin> {
    const response = await adminApi.get<Admin>('/auth/me', { skipAuthRedirect: true });
    return response.data as Admin;
  },

  // ユーザー情報更新
  async updateUser(data: { name?: string; address?: string; phone?: string }): Promise<User> {
    const response = await userApi.put('/users/me', data);
    return response.data as User;
  },

  // パスワード変更（ログイン中のユーザー用）
  async changePassword(currentPassword: string, newPassword: string, newPasswordConfirmation: string): Promise<{ message: string }> {
    const response = await userApi.put('/users/me/password', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPasswordConfirmation,
    });
    return response.data as { message: string };
  },
};
