# Rails Database Seeds
# This file creates sample data for development and testing

puts "🌱 Starting database seed..."

# Clear existing data
puts "Clearing existing data..."
OrderItem.destroy_all
Order.destroy_all
Payment.destroy_all
CartItem.destroy_all
Cart.destroy_all
ProductImage.destroy_all
Product.destroy_all
Category.destroy_all
User.destroy_all

puts "✅ Existing data cleared"

# Create Users
puts "Creating users..."
users = []

users << User.create!(
  name: 'John Doe',
  email: 'user@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  address: '123 Main Street, Tokyo, Japan 100-0001'
)

users << User.create!(
  name: 'Jane Smith',
  email: 'jane@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  address: '456 Sakura Avenue, Osaka, Japan 530-0001'
)

users << User.create!(
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  address: '789 Test Road, Kyoto, Japan 600-0000'
)

puts "✅ Created #{users.count} users"

# Create Categories
puts "Creating categories..."
categories = {}

categories[:electronics] = Category.create!(
  name: 'Electronics',
  description: 'Electronic devices, gadgets, and accessories'
)

categories[:computers] = Category.create!(
  name: 'Computers & Laptops',
  description: 'Desktop computers, laptops, and computer accessories'
)

categories[:audio] = Category.create!(
  name: 'Audio & Headphones',
  description: 'Headphones, speakers, and audio equipment'
)

categories[:clothing] = Category.create!(
  name: 'Clothing & Fashion',
  description: 'Apparel, shoes, and fashion accessories'
)

categories[:books] = Category.create!(
  name: 'Books',
  description: 'Books, magazines, and publications'
)

categories[:sports] = Category.create!(
  name: 'Sports & Outdoors',
  description: 'Sports equipment and outdoor gear'
)

categories[:home] = Category.create!(
  name: 'Home & Kitchen',
  description: 'Home appliances, kitchenware, and furniture'
)

puts "✅ Created #{categories.count} categories"

# Create Products
puts "Creating products..."
products = []

# Electronics Products
products << Product.create!(
  category: categories[:electronics],
  name: 'Wireless Bluetooth Earbuds',
  description: 'Premium wireless earbuds with active noise cancellation, 30-hour battery life, and crystal-clear sound quality. Perfect for music lovers and commuters.',
  price: 89.99,
  stock_quantity: 150,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:electronics],
  name: 'Smart Watch Pro',
  description: 'Advanced fitness tracking smartwatch with heart rate monitor, GPS, and 7-day battery life. Compatible with iOS and Android.',
  price: 299.99,
  stock_quantity: 75,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:electronics],
  name: 'Portable Power Bank 20000mAh',
  description: 'High-capacity power bank with fast charging technology. Charge your devices multiple times on the go.',
  price: 45.99,
  stock_quantity: 200,
  is_active: true,
  is_suspended: false
)

# Computer Products
products << Product.create!(
  category: categories[:computers],
  name: 'Gaming Laptop 15.6"',
  description: 'High-performance gaming laptop with Intel i7 processor, 16GB RAM, 512GB SSD, and dedicated graphics card.',
  price: 1299.99,
  stock_quantity: 25,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:computers],
  name: 'Wireless Gaming Mouse',
  description: 'Ergonomic wireless gaming mouse with customizable RGB lighting and programmable buttons.',
  price: 59.99,
  stock_quantity: 100,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:computers],
  name: 'Mechanical Keyboard RGB',
  description: 'Premium mechanical keyboard with Cherry MX switches, RGB backlighting, and aluminum frame.',
  price: 129.99,
  stock_quantity: 80,
  is_active: true,
  is_suspended: false
)

# Audio Products
products << Product.create!(
  category: categories[:audio],
  name: 'Noise Cancelling Headphones',
  description: 'Over-ear headphones with industry-leading noise cancellation, 40-hour battery, and premium sound.',
  price: 349.99,
  stock_quantity: 60,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:audio],
  name: 'Portable Bluetooth Speaker',
  description: 'Waterproof portable speaker with 360-degree sound, 12-hour battery, and built-in microphone.',
  price: 79.99,
  stock_quantity: 120,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:audio],
  name: 'Studio Monitor Speakers (Pair)',
  description: 'Professional studio monitors with accurate sound reproduction. Perfect for music production.',
  price: 449.99,
  stock_quantity: 30,
  is_active: true,
  is_suspended: false
)

# Clothing Products
products << Product.create!(
  category: categories[:clothing],
  name: 'Premium Cotton T-Shirt',
  description: 'Soft, comfortable 100% organic cotton t-shirt. Available in multiple colors.',
  price: 24.99,
  stock_quantity: 500,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:clothing],
  name: 'Slim Fit Jeans',
  description: 'Classic slim fit jeans with stretch denim for all-day comfort.',
  price: 59.99,
  stock_quantity: 300,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:clothing],
  name: 'Running Shoes',
  description: 'Lightweight running shoes with responsive cushioning and breathable mesh upper.',
  price: 119.99,
  stock_quantity: 150,
  is_active: true,
  is_suspended: false
)

# Books
products << Product.create!(
  category: categories[:books],
  name: 'Web Development Fundamentals',
  description: 'Complete guide to modern web development covering HTML, CSS, JavaScript, and frameworks.',
  price: 39.99,
  stock_quantity: 100,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:books],
  name: 'Design Patterns in Ruby',
  description: 'Learn essential design patterns and best practices for Ruby development.',
  price: 44.99,
  stock_quantity: 75,
  is_active: true,
  is_suspended: false
)

# Sports Products
products << Product.create!(
  category: categories[:sports],
  name: 'Yoga Mat Premium',
  description: 'Extra-thick yoga mat with non-slip surface and carrying strap.',
  price: 34.99,
  stock_quantity: 200,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:sports],
  name: 'Adjustable Dumbbell Set',
  description: 'Space-saving adjustable dumbbells with weight range from 5 to 52.5 lbs.',
  price: 299.99,
  stock_quantity: 40,
  is_active: true,
  is_suspended: false
)

# Home Products
products << Product.create!(
  category: categories[:home],
  name: 'Smart Coffee Maker',
  description: 'Programmable coffee maker with app control, auto-brew timer, and thermal carafe.',
  price: 89.99,
  stock_quantity: 85,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:home],
  name: 'Air Purifier HEPA Filter',
  description: 'Quiet air purifier with true HEPA filter. Covers rooms up to 500 sq ft.',
  price: 179.99,
  stock_quantity: 50,
  is_active: true,
  is_suspended: false
)

# Low stock product (for testing)
products << Product.create!(
  category: categories[:electronics],
  name: 'Limited Edition Smartphone',
  description: 'Rare limited edition smartphone with premium features.',
  price: 999.99,
  stock_quantity: 3,
  is_active: true,
  is_suspended: false
)

# Out of stock product (for testing)
products << Product.create!(
  category: categories[:books],
  name: 'Sold Out Book',
  description: 'This book is currently out of stock.',
  price: 29.99,
  stock_quantity: 0,
  is_active: true,
  is_suspended: false
)

puts "✅ Created #{products.count} products"

# Create Product Images
puts "Creating product images..."
image_count = 0

products.each_with_index do |product, index|
  # Add 1-3 images per product
  num_images = rand(1..3)

  num_images.times do |img_index|
    ProductImage.create!(
      product: product,
      image_url: "https://via.placeholder.com/600x400?text=#{product.name.gsub(' ', '+')}+#{img_index + 1}",
      display_order: img_index
    )
    image_count += 1
  end
end

puts "✅ Created #{image_count} product images"

# Create sample carts and orders for demonstration
puts "Creating sample orders..."
order_count = 0

# Create a completed order for user 1
cart1 = users[0].carts.create!
cart1.cart_items.create!(product: products[0], quantity: 2)
cart1.cart_items.create!(product: products[4], quantity: 1)

order1 = users[0].orders.create!(
  order_number: "ORD-#{Time.current.strftime('%Y%m%d')}-#{SecureRandom.hex(3).upcase}",
  total_amount: (products[0].price * 2) + products[4].price,
  status: 'completed',
  shipping_address: users[0].address
)

cart1.cart_items.each do |cart_item|
  order1.order_items.create!(
    product: cart_item.product,
    quantity: cart_item.quantity,
    price_at_purchase: cart_item.product.price
  )
end

order_count += 1

# Create a pending order for user 2
cart2 = users[1].carts.create!
cart2.cart_items.create!(product: products[6], quantity: 1)

order2 = users[1].orders.create!(
  order_number: "ORD-#{Time.current.strftime('%Y%m%d')}-#{SecureRandom.hex(3).upcase}",
  total_amount: products[6].price,
  status: 'pending',
  shipping_address: users[1].address
)

order2.order_items.create!(
  product: products[6],
  quantity: 1,
  price_at_purchase: products[6].price
)

order_count += 1

puts "✅ Created #{order_count} sample orders"

# Create an active cart for user 3 (for testing)
puts "Creating test cart..."
test_cart = users[2].carts.create!
test_cart.cart_items.create!(product: products[1], quantity: 1)
test_cart.cart_items.create!(product: products[3], quantity: 2)

puts "✅ Created test cart with #{test_cart.cart_items.count} items"

puts "\n" + "="*60
puts "🎉 Database seeding completed successfully!"
puts "="*60
puts "\n📊 Summary:"
puts "  - Users: #{User.count}"
puts "  - Categories: #{Category.count}"
puts "  - Products: #{Product.count}"
puts "  - Product Images: #{ProductImage.count}"
puts "  - Orders: #{Order.count}"
puts "  - Carts: #{Cart.count}"
puts "\n👤 Test Accounts:"
puts "  Regular User:"
puts "    Email: user@example.com"
puts "    Password: password123"
puts "\n  Another User:"
puts "    Email: jane@example.com"
puts "    Password: password123"
puts "\n  Test User (with active cart):"
puts "    Email: test@example.com"
puts "    Password: password123"
puts "="*60
