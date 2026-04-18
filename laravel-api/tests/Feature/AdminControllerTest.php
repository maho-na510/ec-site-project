<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * AdminController の Feature テスト
 *
 * テスト対象:
 *   GET    /api/v1/admin/admins       → index  (管理者一覧)
 *   POST   /api/v1/admin/admins       → store  (管理者作成)
 *   DELETE /api/v1/admin/admins/{id}  → destroy (管理者削除)
 *
 * 認証: JWTAuth::fromUser() でトークン生成（HttpOnly Cookieのため postJson で取得不可）
 */
class AdminControllerTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = Admin::factory()->create([
            'email'    => 'admin@test.com',
            'password' => Hash::make('password123'),
        ]);

        // JWT トークンを直接生成する（ログインエンドポイントは Cookie を使うため）
        $this->token = JWTAuth::fromUser($this->admin);
    }

    private function authHeader(): array
    {
        return ['Authorization' => "Bearer {$this->token}"];
    }

    // ---- 管理者一覧 (index) ----

    public function test_index_returns_admin_list(): void
    {
        Admin::factory()->create(['email' => 'other@test.com']);

        $response = $this->getJson('/api/v1/admin/admins', $this->authHeader());

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'name', 'email', 'created_at', 'updated_at'],
                ],
            ])
            ->assertJson(['success' => true]);

        $this->assertCount(2, $response->json('data'));
    }

    public function test_index_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/admin/admins');

        $response->assertStatus(401);
    }

    // ---- 管理者作成 (store) ----

    public function test_store_creates_new_admin(): void
    {
        $response = $this->postJson('/api/v1/admin/admins', [
            'name'                  => '新管理者',
            'email'                 => 'new@test.com',
            'password'              => 'Password123!',
            'password_confirmation' => 'Password123!',
        ], $this->authHeader());

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => '管理者アカウントを作成しました',
                'data'    => [
                    'name'  => '新管理者',
                    'email' => 'new@test.com',
                ],
            ]);

        $this->assertDatabaseHas('admins', ['email' => 'new@test.com']);
    }

    public function test_store_rejects_duplicate_email(): void
    {
        $response = $this->postJson('/api/v1/admin/admins', [
            'name'                  => '重複管理者',
            'email'                 => 'admin@test.com', // 既存のメールアドレス
            'password'              => 'Password123!',
            'password_confirmation' => 'Password123!',
        ], $this->authHeader());

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_store_rejects_missing_fields(): void
    {
        $response = $this->postJson('/api/v1/admin/admins', [], $this->authHeader());

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_store_rejects_password_mismatch(): void
    {
        $response = $this->postJson('/api/v1/admin/admins', [
            'name'                  => '管理者',
            'email'                 => 'mismatch@test.com',
            'password'              => 'Password123!',
            'password_confirmation' => 'DifferentPass!',
        ], $this->authHeader());

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_store_requires_authentication(): void
    {
        $response = $this->postJson('/api/v1/admin/admins', [
            'name'                  => 'unauth',
            'email'                 => 'unauth@test.com',
            'password'              => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(401);
    }

    // ---- 管理者削除 (destroy) ----

    public function test_destroy_deletes_other_admin(): void
    {
        $other = Admin::factory()->create(['email' => 'deleteme@test.com']);

        $response = $this->deleteJson(
            "/api/v1/admin/admins/{$other->id}",
            [],
            $this->authHeader()
        );

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => '管理者アカウントを削除しました',
            ]);

        $this->assertDatabaseMissing('admins', ['id' => $other->id]);
    }

    public function test_destroy_prevents_self_deletion(): void
    {
        $response = $this->deleteJson(
            "/api/v1/admin/admins/{$this->admin->id}",
            [],
            $this->authHeader()
        );

        $response->assertStatus(422)
            ->assertJson(['success' => false]);

        $this->assertDatabaseHas('admins', ['id' => $this->admin->id]);
    }

    public function test_destroy_returns_404_for_nonexistent_admin(): void
    {
        $response = $this->deleteJson(
            '/api/v1/admin/admins/99999',
            [],
            $this->authHeader()
        );

        $response->assertStatus(404)
            ->assertJson(['success' => false]);
    }

    public function test_destroy_requires_authentication(): void
    {
        $other = Admin::factory()->create(['email' => 'other@test.com']);

        $response = $this->deleteJson("/api/v1/admin/admins/{$other->id}");

        $response->assertStatus(401);
    }
}
