class InsufficientStockError < StandardError
  # message を直接受け取る形式（StandardError と同じインタフェース）
  # 例: raise InsufficientStockError, "Insufficient stock for #{name}"
end
