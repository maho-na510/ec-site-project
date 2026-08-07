<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Admin;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Database\Eloquent\Collection;

class ProductManagementService
{
    protected ImageUploadService $imageUploadService;
    protected InventoryService $inventoryService;

    public function __construct(
        ImageUploadService $imageUploadService,
        InventoryService $inventoryService
    ) {
        $this->imageUploadService = $imageUploadService;
        $this->inventoryService = $inventoryService;
    }

    /**
     * Get a single product by ID with caching.
     *
     * @param int $productId
     * @return Product|null
     */
    public function getProduct(int $productId): ?Product
    {
        return Cache::remember(
            "product:{$productId}",
            now()->addHour(),
            fn() => Product::with(['category', 'images', 'creator'])->find($productId)
        );
    }

    /**
     * Get all products with filtering and pagination.
     *
     * @param array $filters
     * @param int $perPage
     * @param int $page
     * @return mixed
     */
    public function getProducts(array $filters = [], int $perPage = 20, int $page = 1): mixed
    {
        $cacheKey = 'products:list:' . md5(serialize($filters) . $perPage . $page);

        try {
            $cached = Cache::tags(['products_list'])->get($cacheKey);
            if ($cached !== null) {
                return $cached;
            }

            return Cache::lock("lock:{$cacheKey}", 10)->block(5, function () use ($cacheKey, $filters, $perPage) {
                $cached = Cache::tags(['products_list'])->get($cacheKey);
                if ($cached !== null) {
                    return $cached;
                }

                $result = $this->fetchProducts($filters, $perPage);
                Cache::tags(['products_list'])->put($cacheKey, $result, now()->addMinutes(5));
                return $result;
            });

        } catch (\BadMethodCallException $e) {
            return $this->fetchProducts($filters, $perPage);
        }
    }

    /**
     * Build and execute the product list query.
     *
     * @param array $filters
     * @param int $perPage
     * @return mixed
     */
    private function fetchProducts(array $filters, int $perPage): mixed
    {
        $query = Product::with(['category', 'images', 'creator']);

        if (isset($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if (isset($filters['is_suspended'])) {
            $query->where('is_suspended', $filters['is_suspended']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'LIKE', "%{$filters['search']}%")
                  ->orWhere('description', 'LIKE', "%{$filters['search']}%");
            });
        }

        if (isset($filters['stock_status'])) {
            switch ($filters['stock_status']) {
                case 'out_of_stock':
                    $query->outOfStock();
                    break;
                case 'low_stock':
                    $query->lowStock($filters['low_stock_threshold'] ?? 10);
                    break;
                case 'in_stock':
                    $query->where('stock_quantity', '>', $filters['low_stock_threshold'] ?? 10);
                    break;
            }
        }

        $sortBy    = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage);
    }

    /**
     * Create a new product.
     *
     * @param array $data
     * @param Admin $admin
     * @return Product
     */
    public function createProduct(array $data, Admin $admin): Product
    {
        return DB::transaction(function () use ($data, $admin) {
            $product = Product::create([
                'category_id'         => $data['category_id'],
                'created_by_admin_id' => $admin->id,
                'name'                => $data['name'],
                'description'         => $data['description'] ?? null,
                'price'               => $data['price'],
                'stock_quantity'      => $data['initial_stock'] ?? 0,
                'is_active'           => $data['is_active'] ?? true,
                'is_suspended'        => false,
            ]);

            if (isset($data['images']) && is_array($data['images'])) {
                $this->imageUploadService->uploadProductImages($product, $data['images']);
            }

            if ($product->stock_quantity > 0) {
                $this->inventoryService->logInventoryChange(
                    $product,
                    0,
                    $product->stock_quantity,
                    'initial_stock',
                    $admin,
                    'Initial stock set during product creation'
                );
            }

            $this->clearProductListCache();

            return $product->load(['category', 'images', 'creator']);
        });
    }

    /**
     * Update a product.
     *
     * @param Product $product
     * @param array $data
     * @param Admin $admin
     * @return Product
     */
    public function updateProduct(Product $product, array $data, Admin $admin): Product
    {
        return DB::transaction(function () use ($product, $data, $admin) {
            $oldStockQuantity = $product->stock_quantity;

            $product->update([
                'category_id'  => $data['category_id'] ?? $product->category_id,
                'name'         => $data['name'] ?? $product->name,
                'description'  => $data['description'] ?? $product->description,
                'price'        => $data['price'] ?? $product->price,
                'is_active'    => $data['is_active'] ?? $product->is_active,
                'is_suspended' => $data['is_suspended'] ?? $product->is_suspended,
            ]);

            if (isset($data['images']) && is_array($data['images'])) {
                $product->images()->delete();
                $this->imageUploadService->uploadProductImages($product, $data['images']);
            }

            if (isset($data['stock_quantity']) && $data['stock_quantity'] !== $oldStockQuantity) {
                $product->stock_quantity = $data['stock_quantity'];
                $product->save();

                $this->inventoryService->logInventoryChange(
                    $product,
                    $oldStockQuantity,
                    $data['stock_quantity'],
                    'adjustment',
                    $admin,
                    $data['adjustment_note'] ?? 'Manual adjustment via product update'
                );
            }

            $this->clearProductCache($product->id);
            $this->clearProductListCache();

            return $product->load(['category', 'images', 'creator']);
        });
    }

    /**
     * Delete a product (soft delete).
     *
     * @param Product $product
     * @return void
     */
    public function deleteProduct(Product $product): void
    {
        $productId = $product->id;
        $product->delete();

        $this->clearProductCache($productId);
        $this->clearProductListCache();
    }

    /**
     * Toggle product suspension status.
     *
     * @param Product $product
     * @return Product
     */
    public function toggleSuspension(Product $product): Product
    {
        $product->update([
            'is_suspended' => !$product->is_suspended,
        ]);

        $this->clearProductCache($product->id);
        $this->clearProductListCache();

        return $product;
    }

    /**
     * Get products with low stock.
     *
     * @param int $threshold
     * @return Collection
     */
    public function getLowStockProducts(int $threshold = 10): Collection
    {
        return Product::with(['category'])
            ->lowStock($threshold)
            ->active()
            ->get();
    }

    /**
     * Clear the cache for a specific product.
     *
     * @param int $productId
     * @return void
     */
    private function clearProductCache(int $productId): void
    {
        Cache::forget("product:{$productId}");
    }

    /**
     * Clear all product list caches.
     * Use only for operations that change the number of products (create/delete).
     *
     * @return void
     */
    private function clearProductListCache(): void
    {
        try {
            Cache::tags(['products_list'])->flush();
        } catch (\BadMethodCallException $e) {

        }
    }
}