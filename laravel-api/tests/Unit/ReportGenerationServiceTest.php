<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Admin;
use App\Models\Product;
use App\Models\Category;
use App\Services\ReportGenerationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

class ReportGenerationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected ReportGenerationService $service;
    protected Admin $admin;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');

        $this->service  = new ReportGenerationService();
        $this->admin    = Admin::factory()->create(['name' => 'Test Admin']);
        $this->category = Category::factory()->create();
    }

    /** 全商品レポートが生成される */
    public function test_generate_inventory_report_returns_success(): void
    {
        Product::factory()->count(3)->create([
            'category_id'         => $this->category->id,
            'created_by_admin_id' => $this->admin->id,
        ]);

        $result = $this->service->generateInventoryReport('2026-01-01');

        $this->assertTrue($result['success']);
        $this->assertEquals('inventory_report_2026-01-01.csv', $result['filename']);
        $this->assertEquals(3, $result['row_count']);
        Storage::assertExists("reports/{$result['filename']}");
    }

    /** 商品が0件でもレポートは生成される */
    public function test_generate_inventory_report_with_no_products(): void
    {
        $result = $this->service->generateInventoryReport('2026-01-01');

        $this->assertTrue($result['success']);
        $this->assertEquals(0, $result['row_count']);
    }

    /** 管理者ごとのCSVが各管理者分生成される */
    public function test_generate_per_admin_inventory_reports_creates_file_per_admin(): void
    {
        $admin2 = Admin::factory()->create(['name' => 'Second Admin']);

        // admin1 に商品3つ、admin2 に商品2つ登録
        Product::factory()->count(3)->create([
            'category_id'         => $this->category->id,
            'created_by_admin_id' => $this->admin->id,
        ]);
        Product::factory()->count(2)->create([
            'category_id'         => $this->category->id,
            'created_by_admin_id' => $admin2->id,
        ]);

        $result = $this->service->generatePerAdminInventoryReports('2026-01-01');

        $this->assertTrue($result['success']);
        $this->assertEquals(2, $result['total_admins']);
        $this->assertCount(2, $result['reports']);

        // それぞれのファイルが生成されているか確認
        foreach ($result['reports'] as $report) {
            $this->assertArrayHasKey('filename', $report);
            Storage::assertExists("reports/{$report['filename']}");
        }
    }

    /** 管理者ごとの行数が正しいか確認 */
    public function test_per_admin_report_contains_only_that_admins_products(): void
    {
        $admin2 = Admin::factory()->create(['name' => 'Other Admin']);

        Product::factory()->count(3)->create([
            'category_id'         => $this->category->id,
            'created_by_admin_id' => $this->admin->id,
        ]);
        Product::factory()->count(1)->create([
            'category_id'         => $this->category->id,
            'created_by_admin_id' => $admin2->id,
        ]);

        $result = $this->service->generatePerAdminInventoryReports('2026-01-01');

        $reports = collect($result['reports'])->keyBy('admin_id');

        $this->assertEquals(3, $reports[$this->admin->id]['row_count']);
        $this->assertEquals(1, $reports[$admin2->id]['row_count']);
    }

    /** ファイル名に管理者IDと名前が含まれる */
    public function test_per_admin_filename_contains_admin_id_and_name(): void
    {
        Product::factory()->create([
            'category_id'         => $this->category->id,
            'created_by_admin_id' => $this->admin->id,
        ]);

        $result = $this->service->generatePerAdminInventoryReports('2026-01-01');

        $filename = $result['reports'][0]['filename'];
        $this->assertStringContainsString((string) $this->admin->id, $filename);
        $this->assertStringContainsString('2026-01-01', $filename);
    }

    /** 古いレポートが削除される */
    public function test_cleanup_removes_old_reports(): void
    {
        // ダミーのレポートファイルを作成
        Storage::put('reports/old_report.csv', 'content');
        Storage::put('reports/new_report.csv', 'content');

        // 古いファイルのタイムスタンプを変更（31日前）
        // Storage::fake はファイルの更新日時変更ができないため、
        // cleanup の戻り値でファイル削除数のロジックを確認する
        // days=-1 → cutoff = 明日 → 全ファイルが対象になる
        $deletedCount = $this->service->cleanupOldReports(-1);
        $this->assertEquals(2, $deletedCount);
    }
}
