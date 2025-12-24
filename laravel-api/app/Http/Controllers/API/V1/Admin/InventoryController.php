<?php

namespace App\Http\Controllers\API\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class InventoryController extends Controller
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Adjust stock for a product.
     *
     * @param Request $request
     * @param Product $product
     * @return JsonResponse
     */
    public function adjustStock(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer',
            'action_type' => 'required|string|in:restock,adjustment,return',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $admin = auth('api')->user();

            $updatedProduct = $this->inventoryService->adjustStock(
                $product,
                $validated['quantity'],
                $validated['action_type'],
                $admin,
                $validated['notes'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Stock adjusted successfully',
                'data' => $updatedProduct->load(['inventoryLogs' => function ($query) {
                    $query->latest()->limit(5);
                }]),
            ], 200);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to adjust stock',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Set stock to a specific quantity.
     *
     * @param Request $request
     * @param Product $product
     * @return JsonResponse
     */
    public function setStock(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $admin = auth('api')->user();

            $updatedProduct = $this->inventoryService->setStock(
                $product,
                $validated['quantity'],
                $admin,
                $validated['notes'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Stock set successfully',
                'data' => $updatedProduct->load(['inventoryLogs' => function ($query) {
                    $query->latest()->limit(5);
                }]),
            ], 200);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to set stock',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bulk adjust stock for multiple products.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function bulkAdjust(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'adjustments' => 'required|array|min:1',
            'adjustments.*.product_id' => 'required|exists:products,id',
            'adjustments.*.quantity' => 'required|integer',
            'adjustments.*.action_type' => 'required|string|in:restock,adjustment,return',
            'adjustments.*.notes' => 'nullable|string|max:500',
        ]);

        try {
            $admin = auth('api')->user();

            $updatedProducts = $this->inventoryService->bulkAdjustStock(
                $validated['adjustments'],
                $admin
            );

            return response()->json([
                'success' => true,
                'message' => 'Bulk stock adjustment completed',
                'data' => $updatedProducts,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to adjust stock',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get inventory history for a product.
     *
     * @param Request $request
     * @param Product $product
     * @return JsonResponse
     */
    public function history(Request $request, Product $product): JsonResponse
    {
        try {
            $limit = $request->input('limit', 50);
            $history = $this->inventoryService->getProductInventoryHistory($product, $limit);

            return response()->json([
                'success' => true,
                'data' => $history,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch inventory history',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get inventory logs within a date range.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logs(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'product_id' => 'nullable|exists:products,id',
            'admin_id' => 'nullable|exists:admins,id',
            'action_type' => 'nullable|string|in:initial_stock,restock,sale,adjustment,return',
        ]);

        try {
            $startDate = new \DateTime($validated['start_date']);
            $endDate = new \DateTime($validated['end_date']);

            $filters = [
                'product_id' => $validated['product_id'] ?? null,
                'admin_id' => $validated['admin_id'] ?? null,
                'action_type' => $validated['action_type'] ?? null,
            ];

            $logs = $this->inventoryService->getInventoryLogs($startDate, $endDate, $filters);

            return response()->json([
                'success' => true,
                'data' => $logs,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch inventory logs',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get inventory statistics.
     *
     * @return JsonResponse
     */
    public function statistics(): JsonResponse
    {
        try {
            $stats = $this->inventoryService->getInventoryStatistics();

            return response()->json([
                'success' => true,
                'data' => $stats,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get products needing restock.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function needsRestock(Request $request): JsonResponse
    {
        try {
            $threshold = $request->input('threshold', 10);
            $products = $this->inventoryService->getProductsNeedingRestock($threshold);

            return response()->json([
                'success' => true,
                'data' => $products,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch products needing restock',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
