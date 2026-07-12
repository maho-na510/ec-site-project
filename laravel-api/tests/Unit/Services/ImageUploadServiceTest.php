<?php

namespace Tests\Unit\Services;

use App\Models\Product;
use App\Services\ImageUploadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImageUploadServiceTest extends TestCase
{
    use RefreshDatabase;

    private ImageUploadService $service;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        $this->service = new ImageUploadService();
    }

    // GDなしでも使える最小限の有効なPNGを生成するヘルパー
    private function createFakeImage(string $name = 'test.png', int $sizeKb = 10): UploadedFile
    {
        $pngContent = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        );

        $tempFile = tempnam(sys_get_temp_dir(), 'test_image_');
        file_put_contents($tempFile, str_pad($pngContent, $sizeKb * 1024, "\0"));

        return new UploadedFile($tempFile, $name, 'image/png', null, true);
    }

    /** @test */
    public function it_uploads_multiple_images_with_single_db_insert()
    {
        $product = Product::factory()->create();

        $files = [
            $this->createFakeImage('photo1.png'),
            $this->createFakeImage('photo2.png'),
            $this->createFakeImage('photo3.png'),
        ];

        $result = $this->service->uploadProductImages($product, $files);

        $this->assertCount(3, $result);
        $this->assertDatabaseCount('product_images', 3);
        $this->assertDatabaseHas('product_images', ['product_id' => $product->id, 'display_order' => 0]);
        $this->assertDatabaseHas('product_images', ['product_id' => $product->id, 'display_order' => 1]);
        $this->assertDatabaseHas('product_images', ['product_id' => $product->id, 'display_order' => 2]);
    }

    /** @test */
    public function it_returns_empty_array_when_no_images_provided()
    {
        $product = Product::factory()->create();

        $result = $this->service->uploadProductImages($product, []);

        $this->assertEmpty($result);
        $this->assertDatabaseCount('product_images', 0);
    }

    /** @test */
    public function it_throws_exception_when_file_size_exceeds_limit()
    {
        $product = Product::factory()->create();

        $largeFile = $this->createFakeImage('large.png', 6000); // 6MB

        $this->expectException(\InvalidArgumentException::class);

        $this->service->uploadProductImages($product, [$largeFile]);
    }

    /** @test */
    public function it_does_not_save_any_files_when_validation_fails()
    {
        $product = Product::factory()->create();

        $files = [
            $this->createFakeImage('valid.png'),
            $this->createFakeImage('large.png', 6000), // バリデーション失敗
        ];

        try {
            $this->service->uploadProductImages($product, $files);
        } catch (\InvalidArgumentException $e) {
            $this->assertDatabaseCount('product_images', 0);
            return;
        }

        $this->fail('InvalidArgumentException が発生しませんでした');
    }
}