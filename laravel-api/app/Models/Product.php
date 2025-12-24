<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'category_id',
        'created_by_admin_id',
        'name',
        'description',
        'price',
        'stock_quantity',
        'is_active',
        'is_suspended',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'price' => 'decimal:2',
        'stock_quantity' => 'integer',
        'is_active' => 'boolean',
        'is_suspended' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the category that owns the product.
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the admin who created the product.
     */
    public function creator()
    {
        return $this->belongsTo(Admin::class, 'created_by_admin_id');
    }

    /**
     * Get the images for the product.
     */
    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('display_order');
    }

    /**
     * Get the inventory logs for the product.
     */
    public function inventoryLogs()
    {
        return $this->hasMany(InventoryLog::class)->orderBy('created_at', 'desc');
    }

    /**
     * Scope a query to only include active products.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                     ->where('is_suspended', false);
    }

    /**
     * Scope a query to only include products with low stock.
     */
    public function scopeLowStock($query, $threshold = 10)
    {
        return $query->where('stock_quantity', '<=', $threshold)
                     ->where('stock_quantity', '>', 0);
    }

    /**
     * Scope a query to only include out of stock products.
     */
    public function scopeOutOfStock($query)
    {
        return $query->where('stock_quantity', '<=', 0);
    }

    /**
     * Check if product is available for purchase.
     */
    public function isAvailable(): bool
    {
        return $this->is_active &&
               !$this->is_suspended &&
               $this->stock_quantity > 0;
    }

    /**
     * Get stock status.
     */
    public function getStockStatus(): string
    {
        if ($this->stock_quantity <= 0) {
            return 'out_of_stock';
        } elseif ($this->stock_quantity <= 10) {
            return 'low_stock';
        }
        return 'in_stock';
    }
}
