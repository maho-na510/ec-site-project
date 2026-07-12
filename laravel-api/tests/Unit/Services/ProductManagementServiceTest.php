<?php

namespace Tests\Unit\Services;

use App\Models\Admin;
use App\Models\Category;
use App\Models\InventoryLog;
use App\Models\Product;
use App\Services\ImageUploadService;
use App\Services\InventoryService;
use App\Services\ProductManagementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductManagementServiceTest extends TestCase
{
    use RefreshDatabase;

    private ProductManagementService $service;
    private Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new ProductManagementService(
            new ImageUploadService(),
            new InventoryService()
        );

        $this->admin = Admin::factory()->create();
    }

    /** @test */
    public function it_logs_inventory_change_when_stock_is_updated()
    {
        $category = Category::factory()->create();
        $product = Product::factory()->create([
            'stock_quantity' => 10,
            'category_id' => $category->id,
            'created_by_admin_id' => $this->admin->id,
        ]);

        $this->service->updateProduct($product, [
            'stock_quantity' => 20,
            'adjustment_note' => 'テスト用在庫追加',
        ], $this->admin);

        // 在庫が更新されていること
        $this->assertEquals(20, $product->fresh()->stock_quantity);

        // InventoryLogが1件記録されていること
        $this->assertDatabaseHas('inventory_logs', [
            'product_id'      => $product->id,
            'admin_id'        => $this->admin->id,
            'quantity_before' => 10,
            'quantity_after'  => 20,
            'action_type'     => 'adjustment',
        ]);
    }

    /** @test */
    public function it_does_not_log_when_stock_is_unchanged()
    {
        $category = Category::factory()->create();
        $product = Product::factory()->create([
            'stock_quantity' => 10,
            'category_id' => $category->id,
            'created_by_admin_id' => $this->admin->id,
        ]);

        $this->service->updateProduct($product, [
            'stock_quantity' => 10,  // 同じ値
        ], $this->admin);

        // InventoryLogが記録されていないこと
        $this->assertDatabaseCount('inventory_logs', 0);
    }

    /** @test */
    public function it_throws_exception_when_negative_stock_is_specified()
    {
        $category = Category::factory()->create();
        $product = Product::factory()->create([
            'stock_quantity' => 10,
            'category_id' => $category->id,
            'created_by_admin_id' => $this->admin->id,
        ]);

        $this->expectException(\InvalidArgumentException::class);

        $this->service->updateProduct($product, [
            'stock_quantity' => -1,
        ], $this->admin);
    }
}