<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            // category_id は別途セットするので null を許可しておく
            'category_id'         => Category::factory(),
            'created_by_admin_id' => null,
            'name'                => $this->faker->words(3, true),
            'description'         => $this->faker->sentence(),
            'price'               => $this->faker->randomFloat(2, 100, 10000),
            'stock_quantity'      => $this->faker->numberBetween(0, 100),
            'is_active'           => true,
            'is_suspended'        => false,
        ];
    }
}
