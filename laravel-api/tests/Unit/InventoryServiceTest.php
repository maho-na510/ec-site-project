<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Product;
use App\Models\Admin;
use App\Models\Category;
use App\Models\InventoryLog;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

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
        $this->assertArrayHasKey('out_of_stock_count', $stats);
        $this->assertArrayHasKey('low_stock_count', $stats);
        $this->assertGreaterThan(0, $stats['total_products']);
    }

    public function test_adjust_stock_uses_latest_db_value_not_stale_object(): void
    {
        $staleProduct = Product::find($this->product->id);
        $this->assertEquals(100, $staleProduct->stock_quantity);

        DB::table('products')
            ->where('id', $this->product->id)
            ->update(['stock_quantity' => 30]);

        $result = $this->inventoryService->adjustStock(
            $staleProduct,
            20,
            InventoryLog::ACTION_RESTOCK,
            $this->admin
        );

        $this->assertEquals(50, $result->stock_quantity, 'DBの最新値をベースに計算されるべき');
    }

    public function test_set_stock_logs_correct_old_quantity_from_db(): void
    {
        DB::table('products')
            ->where('id', $this->product->id)
            ->update(['stock_quantity' => 30]);

        $result = $this->inventoryService->setStock(
            $this->product,
            50,
            $this->admin
        );

        $this->assertEquals(50, $result->stock_quantity);

        $this->assertDatabaseHas('inventory_logs', [
            'product_id'      => $this->product->id,
            'quantity_before' => 30,
            'quantity_after'  => 50,
        ]);
    }

    public function test_bulk_adjust_updates_all_products(): void
    {
        $category = Category::factory()->create();
        $productA = Product::factory()->create(['category_id' => $category->id, 'stock_quantity' => 100]);
        $productB = Product::factory()->create(['category_id' => $category->id, 'stock_quantity' => 50]);

        $adjustments = [
            ['product_id' => $productA->id, 'quantity' => 10, 'action_type' => InventoryLog::ACTION_RESTOCK],
            ['product_id' => $productB->id, 'quantity' => -20, 'action_type' => InventoryLog::ACTION_ADJUSTMENT],
        ];

        $results = $this->inventoryService->bulkAdjustStock($adjustments, $this->admin);

        $this->assertEquals(110, $results->firstWhere('id', $productA->id)->stock_quantity);
        $this->assertEquals(30, $results->firstWhere('id', $productB->id)->stock_quantity);
    }
}
