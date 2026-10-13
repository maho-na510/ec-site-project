<?php

namespace App\Services;

use App\Models\Admin;
use App\Models\Product;
use App\Models\InventoryLog;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ReportGenerationService
{
    public function generateInventoryReport(?string $date = null): array
    {
        try {
            $date = $date ?? now()->format('Y-m-d');
            $filename = "inventory_report_{$date}.csv";
            $filepath = "reports/{$filename}";

            // Get all products with category information
            $products = Product::with('category')
                ->orderBy('category_id')
                ->orderBy('name')
                ->cursor();

            $rowCount = Product::count();

            // Generate CSV content
            $csvContent = $this->generateInventoryCsv($products);

            // Save to storage
            Storage::put($filepath, $csvContent);

            $rowCount = Product::count();

            Log::info('Inventory report generated successfully', [
                'filename' => $filename,
                'row_count' => $rowCount,
                'file_size' => strlen($csvContent),
            ]);

            return [
                'success' => true,
                'filename' => $filename,
                'filepath' => $filepath,
                'row_count' => $rowCount,
                'file_size' => strlen($csvContent),
                'download_url' => Storage::url($filepath),
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate inventory report', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function generateInventoryCsv($products): string
    {
        $output = fopen('php://temp', 'r+');

        // Write CSV headers
        fputcsv($output, [
            'Product ID',
            'SKU',
            'Product Name',
            'Category',
            'Price',
            'Stock Quantity',
            'Stock Status',
            'Is Active',
            'Is Suspended',
            'Stock Value',
            'Created At',
            'Last Updated',
        ]);

        // Write product data
        foreach ($products as $product) {
            fputcsv($output, [
                $product->id,
                'SKU-' . str_pad($product->id, 6, '0', STR_PAD_LEFT),
                $product->name,
                $product->category->name ?? 'N/A',
                $product->price,
                $product->stock_quantity,
                $product->getStockStatus(),
                $product->is_active ? 'Yes' : 'No',
                $product->is_suspended ? 'Yes' : 'No',
                round($product->price * $product->stock_quantity, 2),
                $product->created_at->format('Y-m-d H:i:s'),
                $product->updated_at->format('Y-m-d H:i:s'),
            ]);
        }

        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        return $csvContent;
    }

    /**
     * 管理者（クライアント）ごとに在庫CSVを生成する。
     * 課題要件「各クライアントごとの在庫一覧をCSVとして出力」に対応。
     *
     * 各管理者が登録した商品のみを対象にし、
     * inventory_report_admin_{id}_{name}_{date}.csv として保存する。
     *
     * @param string|null $date
     * @return array
     */
    public function generatePerAdminInventoryReports(?string $date = null): array
    {
        $date = $date ?? now()->format('Y-m-d');
        $results = [];

        $admins = Admin::all();

        foreach ($admins as $admin) {
            try {
                // その管理者が登録した商品のみ取得
                $products = Product::with('category')
                    ->where('created_by_admin_id', $admin->id)
                    ->orderBy('category_id')
                    ->orderBy('name')
                    ->cursor();

                $rowCount = Product::where('created_by_admin_id', $admin->id)->count();
                // ファイル名に使えない文字を除去
                $safeName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $admin->name);
                $filename = "inventory_report_admin_{$admin->id}_{$safeName}_{$date}.csv";
                $filepath = "reports/{$filename}";

                $csvContent = $this->generateInventoryCsv($products);
                Storage::put($filepath, $csvContent);

                $results[] = [
                    'admin_id'   => $admin->id,
                    'admin_name' => $admin->name,
                    'filename'   => $filename,
                    'row_count'  => $rowCount,
                    'file_size'  => strlen($csvContent),
                ];

                Log::info('Per-admin inventory report generated', [
                    'admin_id'   => $admin->id,
                    'admin_name' => $admin->name,
                    'filename'   => $filename,
                    'row_count'  => $rowCount,
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to generate per-admin inventory report', [
                    'admin_id' => $admin->id,
                    'error'    => $e->getMessage(),
                ]);

                $results[] = [
                    'admin_id'   => $admin->id,
                    'admin_name' => $admin->name,
                    'error'      => $e->getMessage(),
                ];
            }
        }

        return [
            'success'      => true,
            'total_admins' => count($admins),
            'reports'      => $results,
            'date'         => $date,
        ];
    }

    public function generateSalesReport(\DateTime $startDate, \DateTime $endDate): array
    {
        try {
            $filename = sprintf(
                'sales_report_%s_to_%s.csv',
                $startDate->format('Y-m-d'),
                $endDate->format('Y-m-d')
            );
            $filepath = "reports/{$filename}";

            // Get inventory logs for sales in the date range
            $salesLogs = InventoryLog::with(['product', 'admin'])
                ->byAction(InventoryLog::ACTION_SALE)
                ->dateRange($startDate, $endDate)
                ->orderBy('created_at', 'desc')
                ->get();

            // Generate CSV content
            $csvContent = $this->generateSalesCsv($salesLogs);

            // Save to storage
            Storage::put($filepath, $csvContent);

            $rowCount = $salesLogs->count();

            Log::info('Sales report generated successfully', [
                'filename' => $filename,
                'row_count' => $rowCount,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ]);

            return [
                'success' => true,
                'filename' => $filename,
                'filepath' => $filepath,
                'row_count' => $rowCount,
                'file_size' => strlen($csvContent),
                'download_url' => Storage::url($filepath),
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate sales report', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function generateSalesCsv($salesLogs): string
    {
        $output = fopen('php://temp', 'r+');

        // Write CSV headers
        fputcsv($output, [
            'Log ID',
            'Date/Time',
            'Product ID',
            'Product Name',
            'Quantity Sold',
            'Stock Before',
            'Stock After',
            'Notes',
        ]);

        // Write sales data
        foreach ($salesLogs as $log) {
            fputcsv($output, [
                $log->id,
                $log->created_at->format('Y-m-d H:i:s'),
                $log->product_id,
                $log->product->name ?? 'N/A',
                abs($log->quantity_change),
                $log->quantity_before,
                $log->quantity_after,
                $log->notes ?? '',
            ]);
        }

        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        return $csvContent;
    }

    public function cleanupOldReports(int $daysToKeep = 30): int
    {
        $files = Storage::files('reports');
        $deletedCount = 0;
        $cutoffDate = now()->subDays($daysToKeep);

        foreach ($files as $file) {
            $lastModified = Storage::lastModified($file);

            if ($lastModified < $cutoffDate->timestamp) {
                Storage::delete($file);
                $deletedCount++;
            }
        }

        Log::info('Old reports cleaned up', [
            'deleted_count' => $deletedCount,
            'days_to_keep' => $daysToKeep,
        ]);

        return $deletedCount;
    }

    public function getAvailableReports(): array
    {
        $files = Storage::files('reports');
        $reports = [];

        foreach ($files as $file) {
            $reports[] = [
                'filename' => basename($file),
                'filepath' => $file,
                'size' => Storage::size($file),
                'created_at' => Storage::lastModified($file),
                'download_url' => Storage::url($file),
            ];
        }

        // Sort by creation date, newest first
        usort($reports, function ($a, $b) {
            return $b['created_at'] <=> $a['created_at'];
        });

        return $reports;
    }
}
