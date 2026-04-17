<?php

namespace App\Http\Middleware;

use Illuminate\Cookie\Middleware\EncryptCookies as Middleware;

class EncryptCookies extends Middleware
{
    /**
     * The names of the cookies that should not be encrypted.
     *
     * @var array<int, string>
     */
    protected $except = [
        // JWTは自己署名されているためLaravel暗号化は不要
        // 二重暗号化を避け、InjectJwtFromCookieで生のJWTを直接取得できるようにする
        'admin_token',
    ];
}
