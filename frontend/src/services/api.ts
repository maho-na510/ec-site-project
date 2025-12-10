import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '@types/index';

// snake_case を camelCase に変換する関数（Railsのレスポンスをフロントで使いやすくする）
const snakeToCamel = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj as object).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
      (acc as Record<string, unknown>)[camelKey] = snakeToCamel((obj as Record<string, unknown>)[key]);
      return acc;
    }, {} as Record<string, unknown>);
  }
  return obj;
};

// APIクライアントの作成
const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true, // セッション管理のためCookieを送信
  });

  // リクエストインターセプター: JWTトークンをヘッダーに付与
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // レスポンスインターセプター: Rails形式のレスポンスを変換
  client.interceptors.response.use(
    (response) => {
      // snake_case → camelCase 変換
      const data = snakeToCamel(response.data) as Record<string, unknown>;

      // Railsの { success, data, meta } 形式を変換
      if (data && typeof data.success !== 'undefined') {
        if (data.meta && typeof data.meta === 'object') {
          // ページネーション付きレスポンス: { success, data: [], meta: {...} }
          const meta = data.meta as Record<string, unknown>;
          response.data = {
            data: data.data,
            pagination: {
              total: meta.totalCount,
              page: meta.currentPage,
              perPage: meta.perPage,
              totalPages: meta.totalPages,
            },
          };
        } else if ('data' in data) {
          // 通常レスポンス: { success, data: {...} }
          response.data = data.data;
        } else {
          response.data = data;
        }
      } else {
        response.data = data;
      }

      return response;
    },
    async (error: AxiosError) => {
      // 401: 認証切れはトークンを削除してログインページへ
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        window.location.href = '/login';
      }

      // エラーをApiError形式に変換
      const responseData = snakeToCamel(error.response?.data) as Record<string, unknown> | undefined;
      const apiError: ApiError = {
        message: (responseData?.message as string) || error.message || 'エラーが発生しました',
        errors: responseData?.errors as Record<string, string[]> | undefined,
        statusCode: error.response?.status || 500,
      };

      return Promise.reject(apiError);
    }
  );

  return client;
};

// ユーザー用APIクライアント (Rails: /api/v1)
export const userApi = createApiClient('/api/v1');

// 管理者用APIクライアント (Laravel: /api/admin → Viteプロキシで /api/v1/admin に書き換え)
export const adminApi = createApiClient('/api/admin');

// APIエラーメッセージを取得するヘルパー
export const handleApiError = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as ApiError).message;
  }
  return 'エラーが発生しました';
};

export default { userApi, adminApi };
