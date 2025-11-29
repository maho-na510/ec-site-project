<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Admin;
use App\Models\Product;
use App\Models\Category;
use App\Services\ProductManagementService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ProductManagementServiceTest extends TestCase
{
    use RefreshDatabase;

    protected ProductManagementService $service;
    protected Admin $admin;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new ProductManagementService();
        $this->admin = Admin::factory()->create();
        $this->category = Category::factory()->create();
    }

    public function test_can_create_product_with_initial_stock(): void
    {
        $data = [
            'category_id' => $this->category->id,
            'name' => 'Test Product',
            'description' => 'Test Description',
            'price' => 99.99,
            'initial_stock' => 50,
            'is_active' => true,
        ];

        $product = $this->service->createProduct($data, $this->admin);

        $this->assertInstanceOf(Product::class, $product);
        $this->assertEquals('Test Product', $product->name);
        $this->assertEquals(50, $product->stock_quantity);
        $this->assertEquals($this->admin->id, $product->created_by);

        // Check that inventory log was created
        $this->assertDatabaseHas('inventory_logs', [
            'product_id' => $product->id,
            'admin_id' => $this->admin->id,
            'action_type' => 'initial',
            'quantity_change' => 50,
            'quantity_before' => 0,
            'quantity_after' => 50,
        ]);
    }

    public function test_can_update_product_and_log_stock_changes(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'stock_quantity' => 100,
        ]);

        $data = [
            'name' => 'Updated Name',
            'stock_quantity' => 150,
            'adjustment_note' => 'Restocked inventory',
        ];

        $updatedProduct = $this->service->updateProduct($product, $data, $this->admin);

        $this->assertEquals('Updated Name', $updatedProduct->name);
        $this->assertEquals(150, $updatedProduct->stock_quantity);

        // Check that inventory log was created for stock change
        $this->assertDatabaseHas('inventory_logs', [
            'product_id' => $product->id,
            'admin_id' => $this->admin->id,
            'action_type' => 'adjustment',
            'quantity_change' => 50,
            'quantity_before' => 100,
            'quantity_after' => 150,
            'notes' => 'Restocked inventory',
        ]);
    }

    public function test_does_not_create_log_when_stock_unchanged(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'stock_quantity' => 100,
        ]);

        $initialLogCount = $product->inventoryLogs()->count();

        $data = [
            'name' => 'Updated Name Only',
            'price' => 199.99,
        ];

        $this->service->updateProduct($product, $data, $this->admin);

        $this->assertEquals($initialLogCount, $product->inventoryLogs()->count());
    }

    public function test_can_toggle_product_suspension(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'is_suspended' => false,
        ]);

        $suspendedProduct = $this->service->toggleSuspension($product);
        $this->assertTrue($suspendedProduct->is_suspended);

        $unsuspendedProduct = $this->service->toggleSuspension($product);
        $this->assertFalse($unsuspendedProduct->is_suspended);
    }

    public function test_can_delete_product(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
        ]);

        $this->service->deleteProduct($product);

        $this->assertSoftDeleted('products', [
            'id' => $product->id,
        ]);
    }

    public function test_can_get_low_stock_products(): void
    {
        Product::factory()->create([
            'category_id' => $this->category->id,
            'stock_quantity' => 5,
        ]);

        Product::factory()->create([
            'category_id' => $this->category->id,
            'stock_quantity' => 15,
        ]);

        Product::factory()->create([
            'category_id' => $this->category->id,
            'stock_quantity' => 100,
        ]);

        $lowStockProducts = $this->service->getLowStockProducts(10);

        $this->assertCount(1, $lowStockProducts);
        $this->assertEquals(5, $lowStockProducts->first()->stock_quantity);
    }

    public function test_can_filter_products_by_criteria(): void
    {
        Product::factory()->count(3)->create([
            'category_id' => $this->category->id,
            'is_active' => true,
            'is_suspended' => false,
        ]);

        Product::factory()->count(2)->create([
            'category_id' => $this->category->id,
            'is_active' => false,
        ]);

        $filters = [
            'is_active' => true,
        ];

        $products = $this->service->getProducts($filters, 20);

        $this->assertEquals(3, $products->total());
    }
}
