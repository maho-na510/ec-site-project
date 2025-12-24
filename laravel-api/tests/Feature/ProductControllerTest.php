<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Admin;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tymon\JWTAuth\Facades\JWTAuth;

class ProductControllerTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin;
    protected string $token;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = Admin::factory()->create();
        $this->token = JWTAuth::fromUser($this->admin);
        $this->category = Category::factory()->create();
    }

    public function test_can_list_products(): void
    {
        Product::factory()->count(3)->create([
            'category_id' => $this->category->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/admin/products');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'price',
                        'stock_quantity',
                    ],
                ],
                'meta',
            ]);
    }

    public function test_can_create_product(): void
    {
        $productData = [
            'category_id' => $this->category->id,
            'name' => 'Test Product',
            'description' => 'Test Description',
            'price' => 99.99,
            'initial_stock' => 100,
            'is_active' => true,
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/admin/products', $productData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'name',
                    'price',
                    'stock_quantity',
                ],
            ]);

        $this->assertDatabaseHas('products', [
            'name' => 'Test Product',
            'price' => 99.99,
        ]);
    }

    public function test_can_update_product(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'created_by_admin_id' => $this->admin->id,
        ]);

        $updateData = [
            'name' => 'Updated Product Name',
            'price' => 149.99,
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->putJson("/api/v1/admin/products/{$product->id}", $updateData);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Updated Product Name',
            'price' => 149.99,
        ]);
    }

    public function test_can_delete_product(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/admin/products/{$product->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertSoftDeleted('products', [
            'id' => $product->id,
        ]);
    }

    public function test_requires_authentication_to_create_product(): void
    {
        $productData = [
            'category_id' => $this->category->id,
            'name' => 'Test Product',
            'price' => 99.99,
        ];

        $response = $this->postJson('/api/v1/admin/products', $productData);

        $response->assertStatus(401);
    }
}
