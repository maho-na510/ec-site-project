class InsufficientStockError < StandardError
  def initialize(product_name, requested, available)
    @product_name = product_name
    @requested = requested
    @available = available
    super(message)
  end

  def message
    "Insufficient stock for #{@product_name}. Requested: #{@requested}, Available: #{@available}"
  end
end
