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
  name: '家電・カメラ・AV機器',
  description: 'テレビ、冷蔵庫、洗濯機、カメラ、スマートフォンなど'
)

categories[:computers] = Category.create!(
  name: 'パソコン・周辺機器',
  description: 'ノートPC、デスクトップ、キーボード、マウス、モニターなど'
)

categories[:audio] = Category.create!(
  name: 'イヤホン・オーディオ',
  description: 'ワイヤレスイヤホン、ヘッドホン、スピーカー、ハイレゾ機器など'
)

categories[:clothing] = Category.create!(
  name: 'ファッション',
  description: 'メンズ・レディース・キッズの衣類、靴、バッグ、アクセサリーなど'
)

categories[:books] = Category.create!(
  name: '本・雑誌・コミック',
  description: '技術書、小説、ビジネス書、マンガ、雑誌など'
)

categories[:sports] = Category.create!(
  name: 'スポーツ・アウトドア',
  description: 'フィットネス用品、アウトドア用品、スポーツウェア、自転車など'
)

categories[:home] = Category.create!(
  name: 'キッチン・日用品・文具',
  description: 'キッチン用品、掃除用品、インテリア、文具・オフィス用品など'
)

categories[:toys] = Category.create!(
  name: 'おもちゃ・ゲーム・フィギュア',
  description: 'ゲーム機・ソフト、ボードゲーム、フィギュア、ホビーなど'
)

categories[:beauty] = Category.create!(
  name: '美容・健康・ベビー',
  description: 'スキンケア、コスメ、健康グッズ、サプリメント、ベビー用品など'
)

categories[:food] = Category.create!(
  name: '食品・飲料・お酒',
  description: '食料品、飲料、お酒、お菓子、健康食品など'
)

categories[:diy] = Category.create!(
  name: 'DIY・工具・ガーデン',
  description: '電動工具、手工具、園芸用品、作業着など'
)

categories[:pet] = Category.create!(
  name: 'ペット用品',
  description: 'ドッグフード、キャットフード、ペット用品、ケージなど'
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

# 家電・カメラ（4件目）
products << Product.create!(
  category: categories[:electronics],
  name: 'ロボット掃除機 マッピング機能付き',
  description: 'LiDARセンサーで部屋をマッピングし効率よく清掃するロボット掃除機。自動ゴミ収集ステーション付きで手間いらず。アプリ操作対応。',
  price: 49800,
  stock_quantity: 40,
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

# パソコン（4件目）
products << Product.create!(
  category: categories[:computers],
  name: '27インチ 4K液晶モニター',
  description: '4K UHD解像度・HDR対応の27インチワイドモニター。USB-C給電対応、ブルーライト軽減機能搭載。在宅勤務・クリエイター向け。',
  price: 54800,
  stock_quantity: 35,
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

# イヤホン（4件目）
products << Product.create!(
  category: categories[:audio],
  name: 'ネックスピーカー ワイヤレス',
  description: '首にかけるウェアラブルスピーカー。両手が自由に使えて自然な音響体験。最大8時間再生、IPX5防水対応。在宅ワーク・家事中に最適。',
  price: 14800,
  stock_quantity: 90,
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

# ファッション（4件目）
products << Product.create!(
  category: categories[:clothing],
  name: 'レザートートバッグ',
  description: '本革使用の大容量トートバッグ。A4サイズ収納可能、内ポケット3つ。ビジネス・カジュアル両対応。カラー：ブラック／ブラウン。',
  price: 15800,
  stock_quantity: 80,
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

# 本・雑誌（3〜4件目）
products << Product.create!(
  category: categories[:books],
  name: 'ビジネス思考力を鍛える本',
  description: 'ロジカルシンキング、問題解決、戦略立案を1冊でマスター。豊富なワーク演習付きで実践力が身につく。ビジネスパーソン必読の一冊。',
  price: 1760,
  stock_quantity: 150,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:books],
  name: '料理の基本 完全版',
  description: '包丁の使い方から盛り付けまで、料理の基本を写真付きで丁寧に解説。和洋中300レシピ収録。初心者から上級者まで使える永久保存版。',
  price: 2200,
  stock_quantity: 200,
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

# スポーツ（3〜4件目）
products << Product.create!(
  category: categories[:sports],
  name: 'トレッキングポール 2本セット',
  description: 'アルミ合金製の軽量トレッキングポール。折りたたみ式でコンパクト収納。ウルトラライトグリップ採用で長時間歩行も疲れにくい。',
  price: 5980,
  stock_quantity: 120,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:sports],
  name: 'プロテインシェイカー＆ホエイプロテイン セット',
  description: 'バニラ・チョコ・ストロベリーの3種フレーバーから選べるホエイプロテイン1kg＋専用シェイカーのセット。筋トレ・ダイエットをサポート。',
  price: 4980,
  stock_quantity: 180,
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

# キッチン（3〜4件目）
products << Product.create!(
  category: categories[:home],
  name: 'バルミューダ式トースター風 スチームオーブン',
  description: 'スチーム機能搭載のコンパクトオーブントースター。外はカリッと中はふんわり。食パン・クロワッサン・冷凍ピザに対応。容量9L。',
  price: 12800,
  stock_quantity: 65,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:home],
  name: 'スタンディングデスク 電動昇降',
  description: '電動で高さ調整できるスタンディングデスク。座り・立ち作業を交互に行い疲労を軽減。天板幅140cm、メモリ機能付きコントローラー。',
  price: 39800,
  stock_quantity: 25,
  is_active: true,
  is_suspended: false
)

# おもちゃ・ゲーム・フィギュア
products << Product.create!(
  category: categories[:toys],
  name: 'ポータブルゲーム機 256GB',
  description: '大容量256GBストレージ搭載のポータブルゲーム機。7インチ有機ELディスプレイ、最大8時間プレイ可能。テレビ接続にも対応。',
  price: 49800,
  stock_quantity: 50,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:toys],
  name: 'レゴ互換 宇宙ステーション 2000ピース',
  description: '細部まで精巧に再現された宇宙ステーションのブロックセット。大人も楽しめる本格仕様。完成品ディスプレイスタンド付き。対象年齢12歳以上。',
  price: 8980,
  stock_quantity: 100,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:toys],
  name: 'プレミアムフィギュア 限定版 30cm',
  description: '人気アニメキャラクターの高精度フィギュア。塗装済み完成品、専用台座・アクリルケース付属。コレクター向け限定アイテム。',
  price: 19800,
  stock_quantity: 30,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:toys],
  name: 'ボードゲーム カタン 日本語版',
  description: '世界的人気ボードゲーム「カタン」日本語版。3〜4人用、初回プレイ60〜120分。拡張セット対応。家族・友人・パーティーゲームに最適。',
  price: 4980,
  stock_quantity: 150,
  is_active: true,
  is_suspended: false
)

# 美容・健康・ベビー
products << Product.create!(
  category: categories[:beauty],
  name: 'ヒアルロン酸配合 高保湿化粧水 200ml',
  description: 'ヒアルロン酸・コラーゲン・セラミド配合の高機能化粧水。べたつかず素早く浸透。乾燥肌・敏感肌対応。無香料・無着色・パラベンフリー。',
  price: 2980,
  stock_quantity: 300,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:beauty],
  name: 'ドライヤー 速乾マイナスイオン 1400W',
  description: '大風量1400Wのマイナスイオンドライヤー。速乾ノズル・拡散ノズル付属。髪のダメージを抑えながら素早く乾燥。折りたたみ式で収納便利。',
  price: 5980,
  stock_quantity: 120,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:beauty],
  name: 'マルチビタミン＆ミネラル 90日分',
  description: '厳選された26種のビタミン・ミネラルを配合した総合栄養サプリ。1日1粒、90日分。食事では摂りにくい栄養素をまとめてサポート。',
  price: 3480,
  stock_quantity: 200,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:beauty],
  name: 'ベビーカー A型 軽量コンパクト',
  description: '生後1ヶ月から使えるA型ベビーカー。重量4.9kg・折りたたみコンパクト設計。UVカット幌・収納バスケット付き。両対面切り替え対応。',
  price: 34800,
  stock_quantity: 40,
  is_active: true,
  is_suspended: false
)

# 食品・飲料・お酒
products << Product.create!(
  category: categories[:food],
  name: 'コールドブリュー コーヒー定期便 12本',
  description: '厳選シングルオリジン豆を低温抽出した本格コールドブリューコーヒー。砂糖・乳製品不使用。スッキリした飲み口でブラックコーヒー好きに。',
  price: 3600,
  stock_quantity: 250,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:food],
  name: '国産プレミアム牛肉 すき焼き用 500g',
  description: '国内産黒毛和牛のすき焼き・しゃぶしゃぶ用スライス。霜降り具合A4ランク以上。鮮度保証の冷凍配送。特別な日の食卓に。',
  price: 4980,
  stock_quantity: 100,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:food],
  name: 'オーガニック緑茶 詰め合わせセット',
  description: '静岡・宇治・八女産オーガニック認証緑茶の飲み比べセット。煎茶・抹茶・ほうじ茶・玄米茶の4種各50g。ギフト対応可。',
  price: 2800,
  stock_quantity: 180,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:food],
  name: '世界のチョコレート詰め合わせ 20個入',
  description: 'ベルギー・スイス・フランスなど世界7カ国から厳選した高級チョコレート20個セット。バレンタイン・ホワイトデー・贈り物に最適。',
  price: 3200,
  stock_quantity: 220,
  is_active: true,
  is_suspended: false
)

# DIY・工具・ガーデン
products << Product.create!(
  category: categories[:diy],
  name: '充電式インパクトドライバー セット',
  description: '18V充電式インパクトドライバー。トルク165N・m、バッテリー2個付属。ビット25種セット同梱。DIY・日曜大工・家具組み立てに。',
  price: 14800,
  stock_quantity: 70,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:diy],
  name: 'ガーデニングセット 10点',
  description: 'スコップ・レーキ・剪定バサミ・手袋など園芸に必要な道具10点セット。錆びに強いステンレス製。初心者から本格派まで対応。',
  price: 3980,
  stock_quantity: 130,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:diy],
  name: '電動サンダー 仕上げ用',
  description: '手のひらサイズの仕上げサンダー。振動数14000回/分、ダスト収集袋付き。木工・金属・塗装はがしに対応。コード式で安定したパワー。',
  price: 6800,
  stock_quantity: 55,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:diy],
  name: '水性ペンキ ターナーミルク 200ml 全20色',
  description: '安全・環境にやさしい水性ペンキ。DIY家具・小物のリメイクに最適。乾燥後は耐水性。刷毛・ローラー・スポンジで使用可能。',
  price: 980,
  stock_quantity: 400,
  is_active: true,
  is_suspended: false
)

# ペット用品
products << Product.create!(
  category: categories[:pet],
  name: 'プレミアム ドッグフード グレインフリー 2kg',
  description: '穀物不使用・肉類を主原料としたプレミアムドッグフード。厳選チキン・サーモン使用。被毛・消化器・免疫サポート成分配合。全犬種対応。',
  price: 4200,
  stock_quantity: 200,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:pet],
  name: '猫用自動給餌器 スマホ管理',
  description: 'スマートフォンから給餌時間・量を設定できる自動給餌器。最大8食分セット可能。鮮度を保つフタ付きトレイ。カメラ付きで遠隔確認も。',
  price: 8980,
  stock_quantity: 60,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:pet],
  name: 'ペット用キャリーバッグ 機内持ち込みOK',
  description: '航空会社の機内持ち込みサイズ対応ペットキャリー。通気メッシュ・取り外せる内マット付き。犬・猫両用。耐荷重7kg。',
  price: 5980,
  stock_quantity: 90,
  is_active: true,
  is_suspended: false
)

products << Product.create!(
  category: categories[:pet],
  name: '犬用レインコート 反射テープ付き',
  description: '夜間も安全な反射テープ付き犬用レインコート。着脱しやすいマジックテープ式。S〜XLの5サイズ展開。洗濯機洗い対応。',
  price: 2480,
  stock_quantity: 160,
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
