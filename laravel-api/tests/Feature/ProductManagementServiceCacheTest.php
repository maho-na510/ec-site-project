<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Product;
use App\Services\ProductManagementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ProductManagementServiceCacheTest extends TestCase
{
    use RefreshDatabase;

    private ProductManagementService $service;
    private Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(ProductManagementService::class);
        $this->admin   = Admin::factory()->create();
    }

    /** @test */
    public function get_product_returns_cached_result_without_db_hit(): void
    {
        $product = Product::factory()->create();

        $this->service->getProduct($product->id);

        DB::enableQueryLog();
        $result = $this->service->getProduct($product->id);
        $queryLog = DB::getQueryLog();
        DB::disableQueryLog();

        $this->assertEquals($product->id, $result->id);
        $this->assertCount(0, $queryLog);
    }

    /** @test */
    public function update_product_clears_individual_and_list_cache(): void
    {
        $product = Product::factory()->create();

        Cache::put("product:{$product->id}", $product, 3600);
        Cache::tags(['products_list'])->put('products:list:test', 'dummy', 3600);

        $this->service->updateProduct($product, ['name' => '更新後'], $this->admin);

        $this->assertNull(Cache::get("product:{$product->id}"));
        $this->assertNull(Cache::tags(['products_list'])->get('products:list:test'));
    }

    /** @test */
    public function create_product_clears_only_list_cache(): void
    {
        $existingProduct = Product::factory()->create();

        Cache::put("product:{$existingProduct->id}", $existingProduct, 3600);
        Cache::tags(['products_list'])->put('products:list:test', 'dummy', 3600);

        $category = \App\Models\Category::factory()->create();
        $this->service->createProduct([
            'category_id' => $category->id,
            'name'         => '新商品',
            'price'        => 1000,
        ], $this->admin);

        $this->assertNull(Cache::tags(['products_list'])->get('products:list:test'));

        $this->assertNotNull(Cache::get("product:{$existingProduct->id}"));
    }

    /** @test */
    public function delete_product_clears_individual_and_list_cache(): void
    {
        $product = Product::factory()->create();

        Cache::put("product:{$product->id}", $product, 3600);
        Cache::tags(['products_list'])->put('products:list:test', 'dummy', 3600);

        $this->service->deleteProduct($product);

        $this->assertNull(Cache::get("product:{$product->id}"));
        $this->assertNull(Cache::tags(['products_list'])->get('products:list:test'));
    }

    /** @test */
    public function toggle_suspension_clears_individual_and_list_cache(): void
    {
        $product = Product::factory()->create(['is_suspended' => false]);

        Cache::put("product:{$product->id}", $product, 3600);
        Cache::tags(['products_list'])->put('products:list:test', 'dummy', 3600);

        $this->service->toggleSuspension($product);

        $this->assertNull(Cache::get("product:{$product->id}"));
        $this->assertNull(Cache::tags(['products_list'])->get('products:list:test'));
    }

    /** @test */
    public function toggle_suspension_does_not_clear_other_products_cache(): void
    {
        $productA = Product::factory()->create(['is_suspended' => false]);
        $productB = Product::factory()->create(['is_suspended' => false]);

        Cache::put("product:{$productA->id}", $productA, 3600);
        Cache::put("product:{$productB->id}", $productB, 3600);

        $this->service->toggleSuspension($productA);

        $this->assertNull(Cache::get("product:{$productA->id}"));

        $this->assertNotNull(Cache::get("product:{$productB->id}"));
    }
}