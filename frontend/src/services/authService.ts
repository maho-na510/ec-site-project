import { userApi, adminApi } from './api';
import { LoginFormData, RegisterFormData, LoginResponse, User, Admin } from '@app-types/index';

export const authService = {
  // ユーザーログイン
  async login(credentials: LoginFormData): Promise<LoginResponse> {
    const response = await userApi.post<LoginResponse>('/auth/login', credentials);
    // Railsは { user, accessToken } を返す (api.tsのインターセプターでsnake→camel変換済み)
    const data = response.data as unknown as { user: User; accessToken: string };
    localStorage.setItem('token', data.accessToken);
    return { user: data.user, accessToken: data.accessToken };
  },

  // 新規会員登録
  async register(data: RegisterFormData): Promise<{ message: string }> {
    const response = await userApi.post('/auth/register', data);
    return response.data as { message: string };
  },

  // パスワードリセットのメール送信
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await userApi.post('/passwords/forgot', { email });
    return response.data as { message: string };
  },

  // パスワードリセット実行
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // Railsは { token, password, passwordConfirmation } を期待（snake_case変換後に password_confirmation）
    const response = await userApi.post('/passwords/reset', {
      token,
      password: newPassword,
      passwordConfirmation: newPassword,
    });
    return response.data as { message: string };
  },

  // ログアウト
  async logout(): Promise<void> {
    try {
      await userApi.post('/auth/logout');
    } finally {
      this.clearTokens();
    }
  },

  // ログイン中のユーザー情報取得
  async getCurrentUser(): Promise<User> {
    const response = await userApi.get<User>('/users/me');
    return response.data as User;
  },

  // 管理者ログイン
  async adminLogin(credentials: LoginFormData): Promise<LoginResponse> {
    const response = await adminApi.post<LoginResponse>('/auth/login', credentials);
    const data = response.data as unknown as { user: Admin; accessToken: string };
    localStorage.setItem('token', data.accessToken);
    return { user: data.user, accessToken: data.accessToken };
  },

  // 管理者ログアウト
  async adminLogout(): Promise<void> {
    try {
      await adminApi.post('/auth/logout');
    } finally {
      this.clearTokens();
    }
  },

  // ログイン中の管理者情報取得
  async getCurrentAdmin(): Promise<Admin> {
    const response = await adminApi.get<Admin>('/auth/me');
    return response.data as Admin;
  },

  // トークン管理
  setToken(token: string): void {
    localStorage.setItem('token', token);
  },

  clearTokens(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
