<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageUploadService
{
    /**
     * Upload product images.
     *
     * @param Product $product
     * @param array $images Array of UploadedFile instances
     * @return array
     */
    public function uploadProductImages(Product $product, array $images): array
    {
        $uploadedImages = [];
        $displayOrder = 0;

        foreach ($images as $image) {
            if ($image instanceof UploadedFile) {
                $uploadedImage = $this->uploadImage($image, $product, $displayOrder);
                $uploadedImages[] = $uploadedImage;
                $displayOrder++;
            }
        }

        return $uploadedImages;
    }

    /**
     * Upload a single image.
     *
     * @param UploadedFile $file
     * @param Product $product
     * @param int $displayOrder
     * @return ProductImage
     */
    public function uploadImage(UploadedFile $file, Product $product, int $displayOrder = 0): ProductImage
    {
        // Validate image
        $this->validateImage($file);

        // Generate unique filename
        $filename = $this->generateFilename($file);

        // Store image
        $path = $file->storeAs(
            'products/' . $product->id,
            $filename,
            config('filesystems.default')
        );

        // Create product image record
        return ProductImage::create([
            'product_id' => $product->id,
            'image_url' => $path,
            'display_order' => $displayOrder,
        ]);
    }

    /**
     * Delete a product image.
     *
     * @param ProductImage $image
     * @return bool
     */
    public function deleteImage(ProductImage $image): bool
    {
        // Delete file from storage
        if (Storage::exists($image->image_url)) {
            Storage::delete($image->image_url);
        }

        // Delete database record
        return $image->delete();
    }

    /**
     * Delete all images for a product.
     *
     * @param Product $product
     * @return void
     */
    public function deleteProductImages(Product $product): void
    {
        foreach ($product->images as $image) {
            $this->deleteImage($image);
        }
    }

    /**
     * Update image display order.
     *
     * @param array $imageOrders Array of ['id' => order_value]
     * @return void
     */
    public function updateImageOrder(array $imageOrders): void
    {
        foreach ($imageOrders as $imageId => $order) {
            ProductImage::where('id', $imageId)->update(['display_order' => $order]);
        }
    }

    /**
     * Validate image file.
     *
     * @param UploadedFile $file
     * @return void
     * @throws \InvalidArgumentException
     */
    private function validateImage(UploadedFile $file): void
    {
        // Check file size (max 5MB)
        if ($file->getSize() > 5 * 1024 * 1024) {
            throw new \InvalidArgumentException('Image file size cannot exceed 5MB');
        }

        // Check mime type
        $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file->getMimeType(), $allowedMimeTypes)) {
            throw new \InvalidArgumentException(
                'Invalid image type. Allowed types: JPEG, PNG, GIF, WebP'
            );
        }

        // Check if file is actually an image
        if (!getimagesize($file->getRealPath())) {
            throw new \InvalidArgumentException('File is not a valid image');
        }
    }

    /**
     * Generate unique filename for image.
     *
     * @param UploadedFile $file
     * @return string
     */
    private function generateFilename(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        $timestamp = now()->format('YmdHis');
        $random = Str::random(8);

        return "{$timestamp}_{$random}.{$extension}";
    }

    /**
     * Get image URL.
     *
     * @param string $path
     * @return string
     */
    public function getImageUrl(string $path): string
    {
        if (filter_var($path, FILTER_VALIDATE_URL)) {
            return $path;
        }

        return Storage::url($path);
    }

    /**
     * Optimize image (placeholder for future implementation).
     *
     * @param string $path
     * @return void
     */
    private function optimizeImage(string $path): void
    {
        // Future implementation:
        // - Resize large images
        // - Convert to WebP
        // - Generate thumbnails
        // - Compress images
    }
}
