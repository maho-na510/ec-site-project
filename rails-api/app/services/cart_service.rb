# CartService - カート操作をまとめたクラス
# ここでビジネスロジックを分離することでコントローラーをスッキリさせる
class CartService
  # cartオブジェクトを受け取って初期化する
  def initialize(cart)
    @cart = cart
  end

  # カートに商品を追加する
  # キーワード引数で受け取るほうがわかりやすい（調べて学んだ）
  def add_item(product_id:, quantity:)
    unless quantity.positive?
      return { success: false, error: 'Quantity must be positive' }
    end

    @cart.add_product(Product.find(product_id), quantity)
    { success: true }
  rescue ActiveRecord::RecordNotFound
    { success: false, error: 'Product not found' }
  rescue ActiveRecord::RecordInvalid => e
    { success: false, error: e.message }
  end

  # カートアイテムの数量を更新する
  def update_item(cart_item_id:, quantity:)
    cart_item = @cart.cart_items.find_by(id: cart_item_id)
    return { success: false, error: 'Cart item not found' } unless cart_item

    if quantity.zero?
      cart_item.destroy
    else
      cart_item.update!(quantity: quantity)
    end

    { success: true }
  rescue ActiveRecord::RecordInvalid => e
    { success: false, error: e.message }
  end

  # カートアイテムを削除する
  def remove_item(cart_item_id)
    cart_item = @cart.cart_items.find(cart_item_id)
    cart_item.destroy
    { success: true }
  rescue ActiveRecord::RecordNotFound
    { success: false, error: 'Cart item not found' }
  end

  # カートを空にする
  def clear
    @cart.clear
    { success: true }
  end
end
