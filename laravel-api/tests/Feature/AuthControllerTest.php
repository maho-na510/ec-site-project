<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_login_with_valid_credentials(): void
    {
        Admin::factory()->create([
            'email' => 'admin@test.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/v1/admin/auth/login', [
            'email' => 'admin@test.com',
            'password' => 'password123',
        ]);

        // トークンはHttpOnly Cookieにセットされるため、レスポンスボディには含まれない
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'admin' => ['id', 'name', 'email'],
                    'token_type',
                    'expires_in',
                ],
            ])
            ->assertJson([
                'success' => true,
                'data' => ['token_type' => 'bearer'],
            ]);

        // JWTがSet-CookieヘッダーでHttpOnly Cookieにセットされていることを確認
        $setCookieHeader = $response->headers->get('Set-Cookie') ?? '';
        $this->assertStringContainsString('admin_token', $setCookieHeader);
    }

    public function test_admin_cannot_login_with_invalid_credentials(): void
    {
        Admin::factory()->create([
            'email' => 'admin@test.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/v1/admin/auth/login', [
            'email' => 'admin@test.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJson(['success' => false]);
    }

    public function test_admin_can_logout(): void
    {
        $admin = Admin::factory()->create();
        // テストではJWTを直接生成してAuthorizationヘッダーで渡す
        $token = JWTAuth::fromUser($admin);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/auth/logout');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_can_get_authenticated_admin_info(): void
    {
        $admin = Admin::factory()->create();
        $token = JWTAuth::fromUser($admin);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/auth/me');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => ['id', 'name', 'email'],
            ])
            ->assertJson([
                'success' => true,
                'data' => ['email' => $admin->email],
            ]);
    }

    public function test_login_stores_ip_address_and_user_agent_in_session(): void
    {
        $admin = Admin::factory()->create([
            'email' => 'admin@test.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->withHeaders([
            'User-Agent' => 'TestBrowser/1.0',
        ])->postJson('/api/v1/admin/auth/login', [
            'email' => 'admin@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);

        // CookieからJWTトークンを取得してキーを構築
        $cookies = $response->headers->getCookies();
        $tokenCookie = collect($cookies)->first(fn($c) => $c->getName() === 'admin_token');
        $token = $tokenCookie->getValue();

        // サービスと同じキー生成ロジックで直接取得
        $sessionKey = "session:admin:{$admin->id}:" . md5($token);
        $sessionData = json_decode(\Illuminate\Support\Facades\Redis::get($sessionKey), true);

        $this->assertNotNull($sessionData);
        $this->assertArrayHasKey('ip_address', $sessionData);
        $this->assertArrayHasKey('user_agent', $sessionData);
        $this->assertEquals('TestBrowser/1.0', $sessionData['user_agent']);
    }

    public function test_refresh_stores_updated_ip_and_user_agent_in_session(): void
    {
        $admin = Admin::factory()->create();
        $token = JWTAuth::fromUser($admin);

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'User-Agent' => 'RefreshBrowser/2.0',
        ])->postJson('/api/v1/admin/auth/refresh');

        $response->assertStatus(200);

        $newToken = $response->json('data.token');
        $sessionKey = "session:admin:{$admin->id}:" . md5($newToken);
        $sessionData = json_decode(\Illuminate\Support\Facades\Redis::get($sessionKey), true);

        $this->assertNotNull($sessionData);
        $this->assertEquals('RefreshBrowser/2.0', $sessionData['user_agent']);
    }
}
