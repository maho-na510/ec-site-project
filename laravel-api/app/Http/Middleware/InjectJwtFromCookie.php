<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * HttpOnly Cookie に保存された JWT を Authorization ヘッダに注入するミドルウェア
 *
 * セキュリティ方針:
 * - JWTはHttpOnly Cookieに保存することでJavaScriptからのアクセスを防ぐ（XSS対策）
 * - Authorization ヘッダが既に存在する場合はそちらを優先（後方互換性）
 */
class InjectJwtFromCookie
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->bearerToken() && $request->cookie('admin_token')) {
            $request->headers->set(
                'Authorization',
                'Bearer ' . $request->cookie('admin_token')
            );
        }

        return $next($request);
    }
}
