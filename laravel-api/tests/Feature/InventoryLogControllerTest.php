<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Admin;
use App\Models\Product;
use App\Models\Category;
use App\Models\InventoryLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tymon\JWTAuth\Facades\JWTAuth;

class InventoryLogControllerTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin;
    protected string $token;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = Admin::factory()->create();
        $this->token = JWTAuth::fromUser($this->admin);

        $category = Category::factory()->create();
        $this->product = Product::factory()->create([
            'category_id' => $category->id,
        ]);
    }

    public function test_can_list_inventory_logs(): void
    {
        InventoryLog::factory()->count(5)->create([
            'product_id' => $this->product->id,
            'admin_id' => $this->admin->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/admin/inventory-logs');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'product_id',
                        'admin_id',
                        'action_type',
                        'quantity_change',
                        'quantity_before',
                        'quantity_after',
                    ],
                ],
                'meta',
            ]);
    }

    public function test_can_filter_inventory_logs_by_product(): void
    {
        InventoryLog::factory()->count(3)->create([
            'product_id' => $this->product->id,
            'admin_id' => $this->admin->id,
        ]);

        $anotherProduct = Product::factory()->create([
            'category_id' => $this->product->category_id,
        ]);
        InventoryLog::factory()->count(2)->create([
            'product_id' => $anotherProduct->id,
            'admin_id' => $this->admin->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("/api/v1/admin/inventory-logs?product_id={$this->product->id}");

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
    }

    public function test_can_filter_inventory_logs_by_admin(): void
    {
        InventoryLog::factory()->count(2)->create([
            'product_id' => $this->product->id,
            'admin_id' => $this->admin->id,
        ]);

        $anotherAdmin = Admin::factory()->create();
        InventoryLog::factory()->count(3)->create([
            'product_id' => $this->product->id,
            'admin_id' => $anotherAdmin->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("/api/v1/admin/inventory-logs?admin_id={$this->admin->id}");

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));
    }

    public function test_can_filter_inventory_logs_by_action_type(): void
    {
        InventoryLog::factory()->count(2)->create([
            'product_id' => $this->product->id,
            'admin_id' => $this->admin->id,
            'action_type' => 'adjustment',
        ]);

        InventoryLog::factory()->create([
            'product_id' => $this->product->id,
            'admin_id' => $this->admin->id,
            'action_type' => 'sale',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/admin/inventory-logs?action_type=adjustment');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));
    }

    public function test_requires_authentication_to_view_inventory_logs(): void
    {
        $response = $this->getJson('/api/v1/admin/inventory-logs');
        $response->assertStatus(401);
    }
}
