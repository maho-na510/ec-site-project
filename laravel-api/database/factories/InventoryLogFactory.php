<?php

namespace Database\Factories;

use App\Models\Admin;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class InventoryLogFactory extends Factory
{
    public function definition(): array
    {
        $before = $this->faker->numberBetween(0, 100);
        $change = $this->faker->numberBetween(1, 50);

        return [
            'product_id'      => Product::factory(),
            'admin_id'        => Admin::factory(),
            'quantity_before' => $before,
            'quantity_after'  => $before + $change,
            // action_typeはテストで上書きできる
            'action_type'     => $this->faker->randomElement(['restock', 'sale', 'adjustment', 'return']),
            'notes'           => null,
            'created_at'      => now(),
        ];
    }
}
