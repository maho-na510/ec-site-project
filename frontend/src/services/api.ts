import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '@app-types/index';

// セッション確認用リクエストでは401時のリダイレクトをスキップするためのカスタム設定
declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuthRedirect?: boolean;
  }
}

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

/**
 * セッション状態をインメモリで管理（localStorage非依存）
 * JWTはHttpOnly Cookieに保存されるため、JSからは直接参照しない。
 * このフラグはページリロード時にリセットされるが、
 * AuthContextのinitAuthでAPIコールによって復元される。
 */
let _hasActiveSession = false;

export const setActiveSession = (active: boolean): void => {
  _hasActiveSession = active;
};

// APIクライアントの作成
const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true, // HttpOnly Cookieを自動送信するために必須
  });

  // リクエストインターセプター: JWTはCookieで自動送信されるためヘッダー付与不要
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => config,
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
      // 401: セッションが有効だった場合（認証切れ）のみログインページへリダイレクト
      // ログイン試行中の401はリダイレクトせずエラーをそのまま返す
      // 管理者パスの場合は /admin/login へ、ユーザーパスの場合は /login へ
      // skipAuthRedirect が true のリクエスト（initAuth のセッション確認用）は
      // 401時にリダイレクトしない。initAuth の GET が login() 後に返ってきても
      // 誤リダイレクトが起きないようにする。
      if (error.response?.status === 401 && _hasActiveSession && !error.config?.skipAuthRedirect) {
        _hasActiveSession = false;
        const isAdminPath = window.location.pathname.startsWith('/admin');
        window.location.href = isAdminPath ? '/admin/login' : '/login';
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
