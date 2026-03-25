<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

// 管理者ファクトリー（テスト用のダミーデータを作る）
class AdminFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'     => $this->faker->name(),
            'email'    => $this->faker->unique()->safeEmail(),
            // デフォルトパスワードは 'password'（テストで使い回す）
            'password' => Hash::make('password'),
        ];
    }
}
