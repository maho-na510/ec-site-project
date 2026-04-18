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
 *
 * 実装上の注意:
 * - $request->headers->set() だけでは tymon/jwt-auth が参照する
 *   内部リクエストオブジェクトに反映されないケースがある。
 * - そのため ServerBag ($request->server) も同時に更新することで
 *   すべての経路から同じトークンが参照されるようにする。
 */
class InjectJwtFromCookie
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->bearerToken() && $request->cookie('admin_token')) {
            $token = $request->cookie('admin_token');
            // HeaderBag と ServerBag の両方を更新する
            $request->headers->set('Authorization', 'Bearer ' . $token);
            $request->server->set('HTTP_AUTHORIZATION', 'Bearer ' . $token);
        }

        return $next($request);
    }
}
