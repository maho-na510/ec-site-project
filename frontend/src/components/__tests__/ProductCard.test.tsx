import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/test-utils'

// Mock ProductCard component (仮のコンポーネント構造を想定)
const ProductCard = ({ product, onAddToCart }: any) => {
  return (
    <div data-testid="product-card">
      <img src={product.images?.[0]?.image_url || '/placeholder.jpg'} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <p>¥{product.price.toLocaleString()}</p>
      {product.stock_quantity > 0 ? (
        <button onClick={() => onAddToCart(product)}>カートに追加</button>
      ) : (
        <p>在庫切れ</p>
      )}
    </div>
  )
}

describe('ProductCard', () => {
  const mockProduct = {
    id: 1,
    name: 'テスト商品',
    description: 'これはテスト商品です',
    price: 9999,
    stock_quantity: 10,
    images: [{ id: 1, image_url: '/test-image.jpg', is_primary: true }],
  }

  const mockOnAddToCart = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('商品情報が正しく表示される', () => {
    render(<ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />)

    expect(screen.getByText('テスト商品')).toBeInTheDocument()
    expect(screen.getByText('これはテスト商品です')).toBeInTheDocument()
    expect(screen.getByText('¥9,999')).toBeInTheDocument()
  })

  it('商品画像が正しく表示される', () => {
    render(<ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />)

    const image = screen.getByAltText('テスト商品') as HTMLImageElement
    expect(image).toBeInTheDocument()
    expect(image.src).toContain('/test-image.jpg')
  })

  it('画像がない場合はプレースホルダーが表示される', () => {
    const productWithoutImage = { ...mockProduct, images: [] }
    render(<ProductCard product={productWithoutImage} onAddToCart={mockOnAddToCart} />)

    const image = screen.getByAltText('テスト商品') as HTMLImageElement
    expect(image.src).toContain('/placeholder.jpg')
  })

  it('在庫がある場合カートに追加ボタンが表示される', () => {
    render(<ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />)

    expect(screen.getByRole('button', { name: /カートに追加/i })).toBeInTheDocument()
  })

  it('在庫がない場合は在庫切れメッセージが表示される', () => {
    const outOfStockProduct = { ...mockProduct, stock_quantity: 0 }
    render(<ProductCard product={outOfStockProduct} onAddToCart={mockOnAddToCart} />)

    expect(screen.getByText('在庫切れ')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /カートに追加/i })).not.toBeInTheDocument()
  })

  it('カートに追加ボタンをクリックすると関数が呼ばれる', async () => {
    const user = userEvent.setup()
    render(<ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />)

    const addButton = screen.getByRole('button', { name: /カートに追加/i })
    await user.click(addButton)

    expect(mockOnAddToCart).toHaveBeenCalledTimes(1)
    expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct)
  })

  it('価格が正しくフォーマットされる', () => {
    const expensiveProduct = { ...mockProduct, price: 1234567 }
    render(<ProductCard product={expensiveProduct} onAddToCart={mockOnAddToCart} />)

    expect(screen.getByText('¥1,234,567')).toBeInTheDocument()
  })
})
