<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Admin;
use App\Models\InventoryLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class InventoryService
{
    /**
     * Adjust product stock quantity.
     *
     * @param Product $product
     * @param int $quantity
     * @param string $actionType
     * @param Admin $admin
     * @param string|null $notes
     * @return Product
     */
    public function adjustStock(
        Product $product,
        int $quantity,
        string $actionType,
        Admin $admin,
        ?string $notes = null
    ): Product {
        return DB::transaction(function () use ($product, $quantity, $actionType, $admin, $notes) {
            $oldQuantity = $product->stock_quantity;
            $newQuantity = $oldQuantity + $quantity;

            // Ensure stock doesn't go negative
            if ($newQuantity < 0) {
                throw new \InvalidArgumentException('Stock quantity cannot be negative');
            }

            // Update product stock
            $product->update(['stock_quantity' => $newQuantity]);

            // Log the change
            $this->logInventoryChange(
                $product,
                $oldQuantity,
                $newQuantity,
                $actionType,
                $admin,
                $notes
            );

            return $product->fresh();
        });
    }

    /**
     * Set product stock to a specific quantity.
     *
     * @param Product $product
     * @param int $quantity
     * @param Admin $admin
     * @param string|null $notes
     * @return Product
     */
    public function setStock(
        Product $product,
        int $quantity,
        Admin $admin,
        ?string $notes = null
    ): Product {
        return DB::transaction(function () use ($product, $quantity, $admin, $notes) {
            $oldQuantity = $product->stock_quantity;

            if ($quantity < 0) {
                throw new \InvalidArgumentException('Stock quantity cannot be negative');
            }

            // Update product stock
            $product->update(['stock_quantity' => $quantity]);

            // Log the change
            $this->logInventoryChange(
                $product,
                $oldQuantity,
                $quantity,
                InventoryLog::ACTION_ADJUSTMENT,
                $admin,
                $notes ?? 'Stock set to ' . $quantity
            );

            return $product->fresh();
        });
    }

    /**
     * Bulk adjust stock for multiple products.
     *
     * @param array $adjustments
     * @param Admin $admin
     * @return Collection
     */
    public function bulkAdjustStock(array $adjustments, Admin $admin): Collection
    {
        return DB::transaction(function () use ($adjustments, $admin) {
            $updatedProducts = collect();

            foreach ($adjustments as $adjustment) {
                $product = Product::findOrFail($adjustment['product_id']);

                $updatedProduct = $this->adjustStock(
                    $product,
                    $adjustment['quantity'],
                    $adjustment['action_type'] ?? InventoryLog::ACTION_ADJUSTMENT,
                    $admin,
                    $adjustment['notes'] ?? null
                );

                $updatedProducts->push($updatedProduct);
            }

            return $updatedProducts;
        });
    }

    /**
     * Log an inventory change.
     *
     * @param Product $product
     * @param int $quantityBefore
     * @param int $quantityAfter
     * @param string $actionType
     * @param Admin|null $admin
     * @param string|null $notes
     * @return InventoryLog
     */
    public function logInventoryChange(
        Product $product,
        int $quantityBefore,
        int $quantityAfter,
        string $actionType,
        ?Admin $admin = null,
        ?string $notes = null
    ): InventoryLog {
        return InventoryLog::create([
            'product_id' => $product->id,
            'admin_id' => $admin?->id,
            'quantity_before' => $quantityBefore,
            'quantity_after' => $quantityAfter,
            'action_type' => $actionType,
            'notes' => $notes,
        ]);
    }

    /**
     * Get inventory logs for a product.
     *
     * @param Product $product
     * @param int $limit
     * @return Collection
     */
    public function getProductInventoryHistory(Product $product, int $limit = 50): Collection
    {
        return $product->inventoryLogs()
            ->with('admin')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get inventory logs within a date range.
     *
     * @param \DateTime $startDate
     * @param \DateTime $endDate
     * @param array $filters
     * @return Collection
     */
    public function getInventoryLogs(
        \DateTime $startDate,
        \DateTime $endDate,
        array $filters = []
    ): Collection {
        $query = InventoryLog::with(['product', 'admin'])
            ->dateRange($startDate, $endDate);

        if (isset($filters['product_id'])) {
            $query->where('product_id', $filters['product_id']);
        }

        if (isset($filters['admin_id'])) {
            $query->where('admin_id', $filters['admin_id']);
        }

        if (isset($filters['action_type'])) {
            $query->byAction($filters['action_type']);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Get inventory statistics.
     *
     * @return array
     */
    public function getInventoryStatistics(): array
    {
        $totalProducts = Product::count();
        $activeProducts = Product::active()->count();
        $outOfStockProducts = Product::outOfStock()->count();
        $lowStockProducts = Product::lowStock(10)->count();
        $totalStockValue = Product::sum(DB::raw('stock_quantity * price'));

        return [
            'total_products' => $totalProducts,
            'active_products' => $activeProducts,
            'out_of_stock' => $outOfStockProducts,
            'low_stock' => $lowStockProducts,
            'total_stock_value' => round($totalStockValue, 2),
        ];
    }

    /**
     * Get products that need restocking.
     *
     * @param int $threshold
     * @return Collection
     */
    public function getProductsNeedingRestock(int $threshold = 10): Collection
    {
        return Product::with(['category'])
            ->where(function ($query) use ($threshold) {
                $query->where('stock_quantity', '<=', $threshold)
                      ->orWhere('stock_quantity', '<=', 0);
            })
            ->active()
            ->orderBy('stock_quantity', 'asc')
            ->get();
    }
}
