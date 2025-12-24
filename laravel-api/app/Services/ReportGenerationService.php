<?php

namespace App\Services;

use App\Models\Product;
use App\Models\InventoryLog;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ReportGenerationService
{
    /**
     * Generate inventory report in CSV format.
     *
     * @param string|null $date
     * @return array
     */
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
                ->get();

            // Generate CSV content
            $csvContent = $this->generateInventoryCsv($products);

            // Save to storage
            Storage::put($filepath, $csvContent);

            $rowCount = $products->count();

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

    /**
     * Generate CSV content for inventory report.
     *
     * @param \Illuminate\Database\Eloquent\Collection $products
     * @return string
     */
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
     * Generate sales report for a date range.
     *
     * @param \DateTime $startDate
     * @param \DateTime $endDate
     * @return array
     */
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

    /**
     * Generate CSV content for sales report.
     *
     * @param \Illuminate\Database\Eloquent\Collection $salesLogs
     * @return string
     */
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

    /**
     * Clean up old reports.
     *
     * @param int $daysToKeep
     * @return int
     */
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

    /**
     * Get list of available reports.
     *
     * @return array
     */
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
