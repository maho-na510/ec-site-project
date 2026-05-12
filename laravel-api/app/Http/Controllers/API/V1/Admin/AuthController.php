<?php

namespace App\Http\Controllers\API\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminAuthService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    protected AdminAuthService $authService;

    public function __construct(AdminAuthService $authService)
    {
        $this->authService = $authService;
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        try {
            $result = $this->authService->login($credentials);

            $ttlMinutes = config('jwt.ttl', 60);
            $cookie = cookie(
                'admin_token',
                $result['token'],
                $ttlMinutes,
                '/',
                null,
                app()->environment('production'),
                true,
                false,
                'lax'
            );

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'admin' => $result['admin'],
                    'token_type' => $result['token_type'],
                    'expires_in' => $result['expires_in'],
                ],
            ], 200)->withCookie($cookie);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
                'errors' => $e->errors(),
            ], 401);
        } catch (\Exception $e) {
            Log::error('Admin login failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Login failed',
                'error' => 'An unexpected error occurred.',
            ], 500);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        try {
            $admin = $this->authService->getAuthenticatedAdmin();
            $this->authService->logout($admin);

            $expiredCookie = cookie('admin_token', '', -1, '/');

            return response()->json([
                'success' => true,
                'message' => 'Logout successful',
            ], 200)->withCookie($expiredCookie);
        } catch (\Exception $e) {
            Log::error('Admin logout failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Logout failed',
                'error' => 'An unexpected error occurred.',
            ], 500);
        }
    }

    public function refresh(): JsonResponse
    {
        try {
            $result = $this->authService->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Token refreshed successfully',
                'data' => $result,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Admin token refresh failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Token refresh failed',
                'error' => 'An unexpected error occurred.',
            ], 500);
        }
    }

    public function me(): JsonResponse
    {
        try {
            $admin = $this->authService->getAuthenticatedAdmin();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'created_at' => $admin->created_at,
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('Admin me failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get admin info',
                'error' => 'An unexpected error occurred.',
            ], 500);
        }
    }
}