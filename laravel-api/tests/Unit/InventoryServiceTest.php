<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Product;
use App\Models\Admin;
use App\Models\Category;
use App\Models\InventoryLog;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class InventoryServiceTest extends TestCase
{
    use RefreshDatabase;

    protected InventoryService $inventoryService;
    protected Admin $admin;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->inventoryService = new InventoryService();

        // Create test data
        $this->admin = Admin::factory()->create();

        $category = Category::factory()->create();

        $this->product = Product::factory()->create([
            'category_id' => $category->id,
            'stock_quantity' => 100,
        ]);
    }

    public function test_adjusts_stock_and_logs_change(): void
    {
        $result = $this->inventoryService->adjustStock(
            $this->product,
            50,
            InventoryLog::ACTION_RESTOCK,
            $this->admin,
            'Test restock'
        );

        $this->assertEquals(150, $result->stock_quantity);

        $this->assertDatabaseHas('inventory_logs', [
            'product_id' => $this->product->id,
            'admin_id' => $this->admin->id,
            'quantity_before' => 100,
            'quantity_after' => 150,
            'action_type' => InventoryLog::ACTION_RESTOCK,
        ]);
    }

    public function test_prevents_negative_stock(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->inventoryService->adjustStock(
            $this->product,
            -150,
            InventoryLog::ACTION_ADJUSTMENT,
            $this->admin
        );
    }

    public function test_sets_stock_to_specific_quantity(): void
    {
        $result = $this->inventoryService->setStock(
            $this->product,
            75,
            $this->admin,
            'Setting stock to 75'
        );

        $this->assertEquals(75, $result->stock_quantity);

        $this->assertDatabaseHas('inventory_logs', [
            'product_id' => $this->product->id,
            'quantity_before' => 100,
            'quantity_after' => 75,
            'action_type' => InventoryLog::ACTION_ADJUSTMENT,
        ]);
    }

    public function test_gets_inventory_statistics(): void
    {
        // Create additional products with different stock levels
        Product::factory()->create([
            'category_id' => $this->product->category_id,
            'stock_quantity' => 0,
        ]);

        Product::factory()->create([
            'category_id' => $this->product->category_id,
            'stock_quantity' => 5,
        ]);

        $stats = $this->inventoryService->getInventoryStatistics();

        $this->assertArrayHasKey('total_products', $stats);
        $this->assertArrayHasKey('out_of_stock', $stats);
        $this->assertArrayHasKey('low_stock', $stats);
        $this->assertGreaterThan(0, $stats['total_products']);
    }
}
