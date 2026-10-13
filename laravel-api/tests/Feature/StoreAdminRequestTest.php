<?php

namespace Tests\Feature;

use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreAdminRequestTest extends TestCase
{
    use RefreshDatabase;

    private Admin $authAdmin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->authAdmin = Admin::factory()->create();
    }

    private function validPayload(): array
    {
        return [
            'name'                  => 'テスト管理者',
            'email'                 => 'test@example.com',
            'password'              => 'Password1!',
            'password_confirmation' => 'Password1!',
        ];
    }

    /** @test */
    public function store_admin_succeeds_with_valid_data(): void
    {
        $response = $this->actingAs($this->authAdmin, 'api')
            ->postJson('/api/v1/admin/admins', $this->validPayload());

        $response->assertStatus(201)
                 ->assertJsonPath('success', true);
    }

    /** @test */
    public function store_admin_fails_without_name(): void
    {
        $payload = $this->validPayload();
        unset($payload['name']);

        $response = $this->actingAs($this->authAdmin, 'api')
            ->postJson('/api/v1/admin/admins', $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['name']);
    }

    /** @test */
    public function store_admin_fails_with_duplicate_email(): void
    {
        Admin::factory()->create(['email' => 'test@example.com']);

        $response = $this->actingAs($this->authAdmin, 'api')
            ->postJson('/api/v1/admin/admins', $this->validPayload());

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function store_admin_fails_when_passwords_do_not_match(): void
    {
        $payload = $this->validPayload();
        $payload['password_confirmation'] = 'DifferentPassword1!';

        $response = $this->actingAs($this->authAdmin, 'api')
            ->postJson('/api/v1/admin/admins', $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['password']);
    }

    /** @test */
    public function store_admin_fails_with_short_password(): void
    {
        $payload = $this->validPayload();
        $payload['password']              = 'short';
        $payload['password_confirmation'] = 'short';

        $response = $this->actingAs($this->authAdmin, 'api')
            ->postJson('/api/v1/admin/admins', $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['password']);
    }
}