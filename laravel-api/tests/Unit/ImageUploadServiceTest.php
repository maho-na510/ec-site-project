<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ImageUploadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ImageUploadServiceTest extends TestCase
{
    use RefreshDatabase;

    protected ImageUploadService $service;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        $this->service = new ImageUploadService();
        $this->product = Product::factory()->create();
    }

    // 正常系: 1枚アップロード → ファイルとDBレコードが両方作られる
    public function test_upload_image_saves_file_and_creates_db_record(): void
    {
        $file = UploadedFile::fake()->image('test.png', 100, 100);

        $result = $this->service->uploadImage($file, $this->product);

        $this->assertInstanceOf(ProductImage::class, $result);
        $this->assertDatabaseHas('product_images', [
            'product_id' => $this->product->id,
            'image_url'  => $result->image_url,
        ]);
        Storage::disk('public')->assertExists($result->image_url);
    }

    // 正常系: 複数枚アップロード → 全てのファイルとDBレコードが作られる
    public function test_upload_multiple_images_saves_all_files(): void
    {
        $files = [
            UploadedFile::fake()->image('image1.png', 100, 100),
            UploadedFile::fake()->image('image2.png', 100, 100),
            UploadedFile::fake()->image('image3.png', 100, 100),
        ];

        $results = $this->service->uploadProductImages($this->product, $files);

        $this->assertCount(3, $results);
        $this->assertDatabaseCount('product_images', 3);
        foreach ($results as $result) {
            Storage::disk('public')->assertExists($result->image_url);
        }
    }

    // 異常系: DB保存が失敗したとき、アップロード済みファイルが削除される
    public function test_file_is_deleted_when_db_save_fails(): void
    {

        $file = UploadedFile::fake()->image('test.png', 100, 100);

        // productをDBから直接削除してFK制約違反を発生させる
        // （Eloquentのsoftdeleteをバイパスするためにtableを直接操作する）
        DB::table('products')->where('id', $this->product->id)->delete();

        $threw = false;
        try {
            $this->service->uploadImage($file, $this->product);
        } catch (\Exception $e) {
            $threw = true;
            $remainingFiles = Storage::disk('public')->allFiles('products/' . $this->product->id);
            $this->assertEmpty($remainingFiles, 'DBが失敗したのにストレージにファイルが残っています');
        }

        $this->assertTrue($threw, '例外が投げられませんでした');
    }

    // 異常系: 複数枚の途中で失敗したとき、それまでのファイルとDBレコードが全て消える
    public function test_all_cleaned_up_when_upload_fails_midway(): void
    {
        $files = [
            UploadedFile::fake()->image('image1.png', 100, 100),
            UploadedFile::fake()->image('image2.png', 100, 100),
            UploadedFile::fake()->image('image3.png', 100, 100),
        ];

        // 3回目のuploadImageで例外を投げるサブクラスをその場で作る
        $service = new class extends ImageUploadService {
            private int $callCount = 0;

            public function uploadImage(UploadedFile $file, Product $product, int $displayOrder = 0): ProductImage
            {
                $this->callCount++;
                if ($this->callCount === 3) {
                    throw new \RuntimeException('3枚目で失敗をシミュレート');
                }
                return parent::uploadImage($file, $product, $displayOrder);
            }
        };

        $threw = false;
        try {
            $service->uploadProductImages($this->product, $files);
        } catch (\RuntimeException $e) {
            $threw = true;

            // 1・2枚目のファイルも削除されていること
            $remainingFiles = Storage::disk('public')->allFiles('products/' . $this->product->id);
            $this->assertEmpty($remainingFiles, '途中失敗後もストレージにファイルが残っています');

            // 1・2枚目のDBレコードも消えていること
            $this->assertDatabaseCount('product_images', 0);
        }

        $this->assertTrue($threw, '例外が投げられませんでした');
    }
}