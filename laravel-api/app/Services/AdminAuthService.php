<?php

namespace App\Services;

use App\Models\Admin;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redis;
use Illuminate\Validation\ValidationException;
use Tymon\JWTAuth\Facades\JWTAuth;

class AdminAuthService
{
    /**
     * Attempt to authenticate an admin.
     *
     * @param array $credentials
     * @return array
     * @throws ValidationException
     */
    public function login(array $credentials): array
    {
        $admin = Admin::where('email', $credentials['email'])->first();

        if (!$admin || !Hash::check($credentials['password'], $admin->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = JWTAuth::fromUser($admin);

        // Store session in Redis
        $this->storeSession($admin, $token);

        return [
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
            ],
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60, // Convert minutes to seconds
        ];
    }

    /**
     * Logout the authenticated admin.
     *
     * @param Admin $admin
     * @return void
     */
    public function logout(Admin $admin): void
    {
        // Invalidate the token
        JWTAuth::invalidate(JWTAuth::getToken());

        // Remove session from Redis
        $this->removeSession($admin);
    }

    /**
     * Refresh the admin's token.
     *
     * @return array
     */
    public function refresh(): array
    {
        $newToken = JWTAuth::refresh(JWTAuth::getToken());
        $admin = JWTAuth::setToken($newToken)->authenticate();

        // Update session in Redis
        $this->storeSession($admin, $newToken);

        return [
            'token' => $newToken,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60,
        ];
    }

    /**
     * Get the authenticated admin.
     *
     * @return Admin
     */
    public function getAuthenticatedAdmin(): Admin
    {
        return JWTAuth::authenticate();
    }

    /**
     * Store admin session in Redis.
     *
     * @param Admin $admin
     * @param string $token
     * @return void
     */
    private function storeSession(Admin $admin, string $token): void
    {
        $sessionKey = "session:admin:{$admin->id}:" . md5($token);
        $sessionData = [
            'admin_id' => $admin->id,
            'email' => $admin->email,
            'created_at' => now()->toIso8601String(),
            'last_accessed' => now()->toIso8601String(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ];

        // Store with TTL matching JWT expiration
        Redis::setex(
            $sessionKey,
            config('jwt.ttl') * 60,
            json_encode($sessionData)
        );
    }

    /**
     * Remove admin session from Redis.
     *
     * @param Admin $admin
     * @return void
     */
    private function removeSession(Admin $admin): void
    {
        $token = JWTAuth::getToken();
        $sessionKey = "session:admin:{$admin->id}:" . md5($token);
        Redis::del($sessionKey);
    }

    /**
     * Check if admin session exists.
     *
     * @param Admin $admin
     * @param string $token
     * @return bool
     */
    public function sessionExists(Admin $admin, string $token): bool
    {
        $sessionKey = "session:admin:{$admin->id}:" . md5($token);
        return Redis::exists($sessionKey);
    }
}
