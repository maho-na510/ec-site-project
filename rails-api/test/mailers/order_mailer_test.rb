require 'test_helper'

class OrderMailerTest < ActionMailer::TestCase
  def setup
    @user = users(:one)
    @order = orders(:one)
  end

  test "confirmation メールの宛先・差出人・件名が正しい" do
    mail = OrderMailer.confirmation(@order)

    assert_equal [@user.email], mail.to
    assert_equal ['noreply@ec-site.example.com'], mail.from
    assert_includes mail.subject, @order.order_number
  end

  test "confirmation メールの本文にユーザー名が含まれる" do
    mail = OrderMailer.confirmation(@order)

    assert_includes mail.text_part.decoded, @user.name
    assert_includes mail.html_part.decoded, @user.name
  end

  test "confirmation メールの本文に注文番号が含まれる" do
    mail = OrderMailer.confirmation(@order)

    assert_includes mail.text_part.decoded, @order.order_number
    assert_includes mail.html_part.decoded, @order.order_number
  end
end