<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Admin;
use App\Models\Product;
use App\Models\Category;
use App\Models\InventoryLog;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        echo "🌱 Starting Laravel database seed...\n";

        // Clear existing admin data
        echo "Clearing existing admin data...\n";

        // Disable foreign key checks
        \DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        InventoryLog::truncate();
        Admin::truncate();

        // Re-enable foreign key checks
        \DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        echo "✅ Existing admin data cleared\n";

        // Create Admin Users
        echo "Creating admin users...\n";

        $admin1 = Admin::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('admin123'),
            
        ]);

        $admin2 = Admin::create([
            'name' => 'Manager User',
            'email' => 'manager@example.com',
            'password' => Hash::make('manager123'),
            
        ]);

        echo "✅ Created " . Admin::count() . " admin users\n";

        // Note: Products and Categories are shared with Rails
        // They should be created via Rails seeds first

        // Create some inventory logs for demonstration
        echo "Creating sample inventory logs...\n";

        $products = Product::limit(5)->get();

        if ($products->count() > 0) {
            foreach ($products as $product) {
                // Stock adjustment log
                InventoryLog::create([
                    'product_id' => $product->id,
                    'admin_id' => $admin1->id,
                    'action_type' => 'adjustment',
                    'quantity_change' => 10,
                    'quantity_before' => $product->stock_quantity - 10,
                    'quantity_after' => $product->stock_quantity,
                    'notes' => 'Initial stock adjustment',
                ]);
            }

            echo "✅ Created " . InventoryLog::count() . " inventory logs\n";
        } else {
            echo "⚠️  No products found. Please run Rails seeds first.\n";
        }

        echo "\n" . str_repeat("=", 60) . "\n";
        echo "🎉 Laravel database seeding completed successfully!\n";
        echo str_repeat("=", 60) . "\n";
        echo "\n📊 Summary:\n";
        echo "  - Admins: " . Admin::count() . "\n";
        echo "  - Inventory Logs: " . InventoryLog::count() . "\n";
        echo "  - Products (shared): " . Product::count() . "\n";
        echo "  - Categories (shared): " . Category::count() . "\n";
        echo "\n👤 Admin Accounts:\n";
        echo "  Main Admin:\n";
        echo "    Email: admin@example.com\n";
        echo "    Password: admin123\n";
        echo "\n  Manager:\n";
        echo "    Email: manager@example.com\n";
        echo "    Password: manager123\n";
        echo str_repeat("=", 60) . "\n";
    }
}
