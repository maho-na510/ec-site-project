<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ReportGenerationService;

class GenerateWeeklySummary extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reports:generate-weekly-summary';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate weekly summary report';

    /**
     * Execute the console command.
     */
    public function handle(ReportGenerationService $reportService): int
    {
        $this->info('Generating weekly summary report...');

        $endDate = now();
        $startDate = now()->subWeek();

        $result = $reportService->generateSalesReport($startDate, $endDate);

        if ($result['success']) {
            $this->info('Weekly summary report generated successfully!');
            $this->info("Filename: {$result['filename']}");
            $this->info("Row count: {$result['row_count']}");

            return Command::SUCCESS;
        }

        $this->error('Failed to generate weekly summary report!');
        $this->error("Error: {$result['error']}");

        return Command::FAILURE;
    }
}
