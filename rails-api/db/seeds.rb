puts "🌱 シードデータの投入を開始します..."

# 既存データを削除
puts "既存データを削除中..."
OrderItem.destroy_all
Order.destroy_all
Payment.destroy_all
CartItem.destroy_all
Cart.destroy_all
ProductImage.destroy_all
Product.destroy_all
Category.destroy_all
User.destroy_all

puts "✅ 既存データを削除しました"

# ユーザーを作成
puts "ユーザーを作成中..."
users = []

users << User.create!(
  name: '田中 太郎',
  email: 'user@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  address: '東京都渋谷区神南1-1-1'
)

users << User.create!(
  name: '鈴木 花子',
  email: 'jane@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  address: '大阪府大阪市北区梅田2-2-2'
)

users << User.create!(
  name: 'テスト ユーザー',
  email: 'test@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  address: '京都府京都市中京区三条通3-3-3'
)

puts "✅ ユーザーを#{users.count}件作成しました"

# カテゴリを作成
puts "カテゴリを作成中..."
categories = {}

categories[:electronics] = Category.create!(
  name: '家電・スマートフォン',
  description: 'スマートフォン、タブレット、家電製品など'
)

categories[:computers] = Category.create!(
  name: 'パソコン・周辺機器',
  description: 'ノートPC、デスクトップ、キーボード、マウスなど'
)

categories[:audio] = Category.create!(
  name: 'イヤホン・スピーカー',
  description: 'ワイヤレスイヤホン、ヘッドホン、スピーカーなど'
)

categories[:clothing] = Category.create!(
  name: 'ファッション',
  description: 'メンズ・レディース・キッズの衣類、靴、バッグなど'
)

categories[:books] = Category.create!(
  name: '本・雑誌',
  description: '技術書、小説、ビジネス書、雑誌など'
)

categories[:sports] = Category.create!(
  name: 'スポーツ・アウトドア',
  description: 'フィットネス用品、アウトドア用品、スポーツウェアなど'
)

categories[:home] = Category.create!(
  name: 'キッチン・日用品',
  description: 'キッチン用品、生活雑貨、インテリアなど'
)

puts "✅ カテゴリを#{categories.count}件作成しました"

# 商品を作成
puts "商品を作成中..."
products = []

# 家電・スマートフォン
products << Product.create!(
  category: categories[:electronics],
  name: 'ワイヤレスイヤホン（ノイズキャンセリング）',
  description: 'アクティブノイズキャンセリング搭載の完全ワイヤレスイヤホン。最大30時間再生、IPX4防水対応。通勤・通学に最適。',
  price: 9800,
  stock_quantity: 150,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:electronics],
  name: 'スマートウォッチ Pro',
  description: '心拍数・血中酸素・GPS搭載のスマートウォッチ。7日間バッテリー持続、iOS/Android対応。健康管理に最適。',
  price: 29800,
  stock_quantity: 75,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:electronics],
  name: 'モバイルバッテリー 20000mAh',
  description: '大容量20000mAhのモバイルバッテリー。USB-C急速充電対応、スマホ約5回分充電可能。薄型軽量設計。',
  price: 3980,
  stock_quantity: 200,
  is_active: true,
  is_suspended: false
)

# パソコン・周辺機器
products << Product.create!(
  category: categories[:computers],
  name: 'ゲーミングノートPC 15.6インチ',
  description: 'Core i7プロセッサ、16GBメモリ、512GB SSD搭載の高性能ゲーミングノートPC。144Hzディスプレイで滑らかなゲームプレイを実現。',
  price: 129800,
  stock_quantity: 25,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:computers],
  name: 'ワイヤレスゲーミングマウス',
  description: 'RGBライティング搭載のワイヤレスゲーミングマウス。最大25600DPI、ボタン7個カスタマイズ可能。充電しながら使用可能。',
  price: 7980,
  stock_quantity: 100,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:computers],
  name: 'メカニカルキーボード RGBバックライト',
  description: '青軸メカニカルスイッチ採用のRGBゲーミングキーボード。アルミフレーム、N-キーロールオーバー対応。打鍵感抜群。',
  price: 12800,
  stock_quantity: 80,
  is_active: true,
  is_suspended: false
)

# イヤホン・スピーカー
products << Product.create!(
  category: categories[:audio],
  name: 'オーバーイヤーヘッドホン（ノイキャン）',
  description: '業界最高水準のノイズキャンセリング搭載ヘッドホン。40時間再生、折りたたみ可能でコンパクト収納。ハイレゾ音源対応。',
  price: 34800,
  stock_quantity: 60,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:audio],
  name: 'ポータブルBluetoothスピーカー',
  description: '360度サウンド・IPX7完全防水のポータブルスピーカー。12時間再生、マイク内蔵でハンズフリー通話も可能。アウトドアに最適。',
  price: 6980,
  stock_quantity: 120,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:audio],
  name: 'スタジオモニタースピーカー（ペア）',
  description: 'DTM・音楽制作向けの本格スタジオモニタースピーカー。フラットな音響特性でミックスダウン・マスタリングに最適。',
  price: 42800,
  stock_quantity: 30,
  is_active: true,
  is_suspended: false
)

# ファッション
products << Product.create!(
  category: categories[:clothing],
  name: 'オーガニックコットンTシャツ',
  description: '100%オーガニックコットン使用のシンプルTシャツ。肌触りが良く吸汗速乾性に優れています。カラー展開10色。',
  price: 2980,
  stock_quantity: 500,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:clothing],
  name: 'スリムフィットデニムパンツ',
  description: 'ストレッチデニム素材のスリムフィットジーンズ。動きやすく一日中快適に着用できます。ウォッシュ加工で自然な風合い。',
  price: 5980,
  stock_quantity: 300,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:clothing],
  name: 'ランニングシューズ',
  description: '軽量クッション素材採用のランニングシューズ。反発性の高いミッドソールで長距離ランも快適。通気性メッシュアッパー採用。',
  price: 11800,
  stock_quantity: 150,
  is_active: true,
  is_suspended: false
)

# 本・雑誌
products << Product.create!(
  category: categories[:books],
  name: 'Webアプリ開発入門 HTML/CSS/JavaScript',
  description: 'HTML・CSS・JavaScriptをゼロから学べる入門書。豊富なサンプルコード付きで、実際に手を動かしながら学習できます。',
  price: 2860,
  stock_quantity: 100,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:books],
  name: 'Rubyデザインパターン入門',
  description: 'Rubyでよく使われるデザインパターンを実践的に解説。リファクタリング手法も網羅し、より良いコードの書き方が身につきます。',
  price: 3520,
  stock_quantity: 75,
  is_active: true,
  is_suspended: false
)

# スポーツ・アウトドア
products << Product.create!(
  category: categories[:sports],
  name: 'ヨガマット 厚さ10mm',
  description: '厚さ10mmの高密度ヨガマット。滑り止め加工で安定したポーズをサポート。持ち運び用ストラップ付き。初心者にもおすすめ。',
  price: 3480,
  stock_quantity: 200,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:sports],
  name: 'アジャスタブルダンベル（20kgセット）',
  description: '2kg〜20kgまで調整可能なアジャスタブルダンベルセット。スペース節約設計で自宅トレーニングに最適。ダイヤル式で簡単切り替え。',
  price: 24800,
  stock_quantity: 40,
  is_active: true,
  is_suspended: false
)

# キッチン・日用品
products << Product.create!(
  category: categories[:home],
  name: 'スマートコーヒーメーカー',
  description: 'スマホアプリで操作できる全自動コーヒーメーカー。タイマー予約・保温機能付き。豆から挽きたての本格コーヒーが楽しめます。',
  price: 8980,
  stock_quantity: 85,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:home],
  name: '空気清浄機 HEPAフィルター搭載',
  description: '花粉・PM2.5・ウイルスを99.97%除去するHEPAフィルター搭載の空気清浄機。静音設計で寝室でも使いやすい。14畳対応。',
  price: 18800,
  stock_quantity: 50,
  is_active: true,
  is_suspended: false
)

# 残り少ない商品（テスト用）
products << Product.create!(
  category: categories[:electronics],
  name: '限定モデル スマートフォン 512GB',
  description: '数量限定モデルのフラッグシップスマートフォン。6.7インチ有機ELディスプレイ、トリプルカメラ搭載。カラー：マットブラック。',
  price: 99800,
  stock_quantity: 3,
  is_active: true,
  is_suspended: false
)

# 在庫切れ商品（テスト用）
products << Product.create!(
  category: categories[:books],
  name: 'プログラミング入門（完売）',
  description: '大変ご好評いただき現在在庫切れとなっております。入荷次第ご案内いたします。',
  price: 1980,
  stock_quantity: 0,
  is_active: true,
  is_suspended: false
)

puts "✅ 商品を#{products.count}件作成しました"

# 商品画像を作成
puts "商品画像を作成中..."
image_count = 0

products.each_with_index do |product, index|
  num_images = rand(1..3)

  num_images.times do |img_index|
    ProductImage.create!(
      product: product,
      image_url: "https://placehold.jp/600x400.png?text=#{URI.encode_www_form_component(product.name)}",
      display_order: img_index
    )
    image_count += 1
  end
end

puts "✅ 商品画像を#{image_count}件作成しました"

# サンプル注文を作成
puts "サンプル注文を作成中..."
order_count = 0

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

puts "✅ サンプル注文を#{order_count}件作成しました"

puts "テスト用カートを作成中..."
test_cart = users[2].carts.create!
test_cart.cart_items.create!(product: products[1], quantity: 1)
test_cart.cart_items.create!(product: products[3], quantity: 2)

puts "✅ テスト用カートを#{test_cart.cart_items.count}件作成しました"

puts "\n" + "="*60
puts "🎉 シードデータの投入が完了しました！"
puts "="*60
puts "\n📊 サマリー:"
puts "  - ユーザー: #{User.count}件"
puts "  - カテゴリ: #{Category.count}件"
puts "  - 商品: #{Product.count}件"
puts "  - 商品画像: #{ProductImage.count}件"
puts "  - 注文: #{Order.count}件"
puts "  - カート: #{Cart.count}件"
puts "\n👤 テストアカウント:"
puts "  一般ユーザー:"
puts "    Email: user@example.com"
puts "    Password: password123"
puts "\n  別ユーザー:"
puts "    Email: jane@example.com"
puts "    Password: password123"
puts "\n  テストユーザー（カートあり）:"
puts "    Email: test@example.com"
puts "    Password: password123"
puts "="*60
