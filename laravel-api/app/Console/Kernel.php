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
        // 毎日9:00（日本時間）に管理者ごとの在庫CSVを出力
        $schedule->command('reports:generate-inventory --per-admin')
            ->dailyAt('09:00')
            ->timezone('Asia/Tokyo')
            ->name('daily_inventory_report_per_admin')
            ->withoutOverlapping()
            ->onSuccess(function () {
                \Log::info('Daily per-admin inventory reports generated successfully');
            })
            ->onFailure(function () {
                \Log::error('Failed to generate daily per-admin inventory reports');
            });

        // 旧来の全体レポートも週1回（日曜 9:00 JST）で出力
        $schedule->command('reports:generate-inventory')
            ->weekly()
            ->sundays()
            ->at('09:00')
            ->timezone('Asia/Tokyo')
            ->name('weekly_inventory_report')
            ->withoutOverlapping();

        // 古いレポートを毎週日曜 2:00 JST に削除
        $schedule->command('reports:cleanup')
            ->weekly()
            ->sundays()
            ->at('02:00')
            ->timezone('Asia/Tokyo')
            ->name('weekly_report_cleanup')
            ->withoutOverlapping();

        // 週次売上サマリーレポート（月曜 8:00 JST）
        $schedule->command('reports:generate-weekly-summary')
            ->weekly()
            ->mondays()
            ->at('08:00')
            ->timezone('Asia/Tokyo')
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
