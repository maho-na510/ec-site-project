<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class InventoryServiceBulkAdjustTest extends TestCase
{
    use RefreshDatabase;

    private InventoryService $service;
    private Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new InventoryService();
        $this->admin = Admin::factory()->create();
    }

    /** @test */
    public function bulk_adjust_issues_only_one_select_for_products(): void
    {
        $products = Product::factory()->count(5)->create(['stock_quantity' => 100]);

        $adjustments = $products->map(fn($p) => [
            'product_id' => $p->id,
            'quantity'   => 10,
            'action_type' => 'restock',
        ])->toArray();

        DB::enableQueryLog();

        $this->service->bulkAdjustStock($adjustments, $this->admin);

        $queryLog = DB::getQueryLog();
        DB::disableQueryLog();

        // productsテーブルへのSELECTが1回だけであること（N+1になっていないこと）
        $productSelectQueries = array_filter(
            $queryLog,
            fn($q) => stripos($q['query'], 'select') !== false
                   && stripos($q['query'], 'products') !== false
                   && stripos($q['query'], ' in (') !== false
        );

        $this->assertCount(1, $productSelectQueries);
    }

    /** @test */
    public function bulk_adjust_updates_all_products_correctly(): void
    {
        $products = Product::factory()->count(3)->create(['stock_quantity' => 50]);

        $adjustments = $products->map(fn($p) => [
            'product_id' => $p->id,
            'quantity'   => 20,
            'action_type' => 'restock',
        ])->toArray();

        $results = $this->service->bulkAdjustStock($adjustments, $this->admin);

        $this->assertCount(3, $results);
        foreach ($results as $updatedProduct) {
            $this->assertEquals(70, $updatedProduct->stock_quantity);
        }
    }

    /** @test */
    public function bulk_adjust_throws_exception_for_missing_product(): void
    {
        $this->expectException(ModelNotFoundException::class);

        $adjustments = [
            ['product_id' => 99999, 'quantity' => 10, 'action_type' => 'restock'],
        ];

        $this->service->bulkAdjustStock($adjustments, $this->admin);
    }

    /** @test */
    public function bulk_adjust_rolls_back_all_on_failure(): void
    {
        $products = Product::factory()->count(2)->create(['stock_quantity' => 50]);

        $adjustments = [
            ['product_id' => $products[0]->id, 'quantity' => 10, 'action_type' => 'restock'],
            ['product_id' => 99999, 'quantity' => 10, 'action_type' => 'restock'],
        ];

        try {
            $this->service->bulkAdjustStock($adjustments, $this->admin);
        } catch (ModelNotFoundException $e) {
            // 例外が発生した場合でも最初の商品の在庫は変わっていないこと
            $this->assertEquals(50, $products[0]->fresh()->stock_quantity);
        }
    }
}