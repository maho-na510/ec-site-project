<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryLog extends Model
{
    use HasFactory;

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'product_id',
        'admin_id',
        'quantity_before',
        'quantity_after',
        'action_type',
        'notes',
        'created_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'quantity_before' => 'integer',
        'quantity_after' => 'integer',
        'created_at' => 'datetime',
    ];

    /**
     * Action type constants.
     */
    public const ACTION_INITIAL_STOCK = 'initial_stock';
    public const ACTION_RESTOCK = 'restock';
    public const ACTION_SALE = 'sale';
    public const ACTION_ADJUSTMENT = 'adjustment';
    public const ACTION_RETURN = 'return';

    /**
     * Get the product that owns the log.
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the admin who created the log.
     */
    public function admin()
    {
        return $this->belongsTo(Admin::class);
    }

    /**
     * Get the quantity change.
     */
    public function getQuantityChangeAttribute(): int
    {
        return $this->quantity_after - $this->quantity_before;
    }

    /**
     * Scope a query to filter by action type.
     */
    public function scopeByAction($query, string $actionType)
    {
        return $query->where('action_type', $actionType);
    }

    /**
     * Scope a query to filter by date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (!$model->created_at) {
                $model->created_at = now();
            }
        });
    }
}
