<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Generate daily inventory report at 9:00 AM
        $schedule->command('reports:generate-inventory')
            ->dailyAt('09:00')
            ->timezone('America/New_York')
            ->name('daily_inventory_report')
            ->withoutOverlapping()
            ->onSuccess(function () {
                \Log::info('Daily inventory report generated successfully');
            })
            ->onFailure(function () {
                \Log::error('Failed to generate daily inventory report');
                // Optionally send notification to admins
            });

        // Clean up old reports every week (Sunday at 2:00 AM)
        $schedule->command('reports:cleanup')
            ->weekly()
            ->sundays()
            ->at('02:00')
            ->timezone('America/New_York')
            ->name('weekly_report_cleanup')
            ->withoutOverlapping();

        // Optional: Generate weekly summary report
        $schedule->command('reports:generate-weekly-summary')
            ->weekly()
            ->mondays()
            ->at('08:00')
            ->timezone('America/New_York')
            ->name('weekly_summary_report')
            ->withoutOverlapping();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
