class OrderMailer < ApplicationMailer
  def confirmation(order)
    @order = order
    @user = order.user
    @order_items = order.order_items.includes(:product)

    mail(
      to: @user.email,
      subject: "【ご注文確認】注文番号 #{@order.order_number}"
    )
  end
end