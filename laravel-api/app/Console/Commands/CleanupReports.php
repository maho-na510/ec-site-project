<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ReportGenerationService;

class CleanupReports extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reports:cleanup {--days=30 : Number of days to keep reports}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up old report files';

    /**
     * Execute the console command.
     */
    public function handle(ReportGenerationService $reportService): int
    {
        $daysToKeep = (int) $this->option('days');

        $this->info("Cleaning up reports older than {$daysToKeep} days...");

        $deletedCount = $reportService->cleanupOldReports($daysToKeep);

        $this->info("Cleanup completed! Deleted {$deletedCount} old report(s).");

        return Command::SUCCESS;
    }
}
