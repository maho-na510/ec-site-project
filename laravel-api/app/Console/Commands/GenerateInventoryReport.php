<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ReportGenerationService;
use Illuminate\Support\Facades\Mail;

class GenerateInventoryReport extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reports:generate-inventory
        {--date= : Date for the report (Y-m-d format)}
        {--per-admin : Generate separate CSV for each admin (client)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate daily inventory report in CSV format (optionally per admin)';

    /**
     * Execute the console command.
     */
    public function handle(ReportGenerationService $reportService): int
    {
        $date     = $this->option('date');
        $perAdmin = $this->option('per-admin');

        if ($perAdmin) {
            return $this->handlePerAdmin($reportService, $date);
        }

        return $this->handleAllProducts($reportService, $date);
    }

    /**
     * 管理者ごとのCSVを生成する（毎日9時スケジュール用）
     */
    private function handlePerAdmin(ReportGenerationService $reportService, ?string $date): int
    {
        $this->info('Generating per-admin inventory reports...');

        $result = $reportService->generatePerAdminInventoryReports($date);

        if ($result['success']) {
            $this->info("Generated reports for {$result['total_admins']} admin(s) on {$result['date']}");

            foreach ($result['reports'] as $report) {
                if (isset($report['error'])) {
                    $this->warn("  Admin {$report['admin_id']} ({$report['admin_name']}): FAILED - {$report['error']}");
                } else {
                    $this->line("  Admin {$report['admin_id']} ({$report['admin_name']}): {$report['filename']} ({$report['row_count']} rows)");
                }
            }

            return Command::SUCCESS;
        }

        $this->error('Failed to generate per-admin reports!');
        return Command::FAILURE;
    }

    /**
     * 全商品まとめてCSVを生成する
     */
    private function handleAllProducts(ReportGenerationService $reportService, ?string $date): int
    {
        $this->info('Generating inventory report...');

        $result = $reportService->generateInventoryReport($date);

        if ($result['success']) {
            $this->info('Inventory report generated successfully!');
            $this->info("Filename: {$result['filename']}");
            $this->info("Row count: {$result['row_count']}");
            $this->info("File size: " . number_format($result['file_size'] / 1024, 2) . ' KB');

            return Command::SUCCESS;
        }

        $this->error('Failed to generate inventory report!');
        $this->error("Error: {$result['error']}");

        return Command::FAILURE;
    }
}
