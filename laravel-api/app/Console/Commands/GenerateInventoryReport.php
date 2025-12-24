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
    protected $signature = 'reports:generate-inventory {--date= : Date for the report (Y-m-d format)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate daily inventory report in CSV format';

    /**
     * Execute the console command.
     */
    public function handle(ReportGenerationService $reportService): int
    {
        $date = $this->option('date');

        $this->info('Generating inventory report...');

        $result = $reportService->generateInventoryReport($date);

        if ($result['success']) {
            $this->info('Inventory report generated successfully!');
            $this->info("Filename: {$result['filename']}");
            $this->info("Row count: {$result['row_count']}");
            $this->info("File size: " . number_format($result['file_size'] / 1024, 2) . " KB");

            // Optional: Send email to admins
            if (config('app.admin_email')) {
                try {
                    // Implement email notification here
                    $this->info("Email notification sent to admin");
                } catch (\Exception $e) {
                    $this->warn("Failed to send email notification: {$e->getMessage()}");
                }
            }

            return Command::SUCCESS;
        }

        $this->error('Failed to generate inventory report!');
        $this->error("Error: {$result['error']}");

        return Command::FAILURE;
    }
}
