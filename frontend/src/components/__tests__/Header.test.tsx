import { screen } from '@testing-library/react'
import { render } from '../../test/test-utils'
import Header from '../Header'

// Mock useAuth
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

// Mock useCart
jest.mock('../../contexts/CartContext', () => ({
  useCart: jest.fn(),
}))

import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseCart = useCart as jest.MockedFunction<typeof useCart>

describe('Header', () => {
  beforeEach(() => {
    mockUseCart.mockReturnValue({
      items: [],
      itemCount: 0,
      totalPrice: 0,
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
    })
  })

  it('ログアウト状態のヘッダーが正しく表示される', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    render(<Header />)

    expect(screen.getByText('ECサイト')).toBeInTheDocument()
    expect(screen.getByText('ホーム')).toBeInTheDocument()
    expect(screen.getByText('商品一覧')).toBeInTheDocument()
    expect(screen.getByText('ログイン')).toBeInTheDocument()
    expect(screen.getByText('会員登録')).toBeInTheDocument()
  })

  it('ログイン状態のヘッダーが正しく表示される', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'Test User', email: 'test@example.com', address: '123 Main St' },
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    render(<Header />)

    expect(screen.getByText('マイページ')).toBeInTheDocument()
    expect(screen.queryByText('ログイン')).not.toBeInTheDocument()
    expect(screen.queryByText('会員登録')).not.toBeInTheDocument()
  })

  it('カートのアイテム数が正しく表示される', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    mockUseCart.mockReturnValue({
      items: [
        { id: 1, product_id: 1, quantity: 2, product: {} as any },
        { id: 2, product_id: 2, quantity: 1, product: {} as any },
      ],
      itemCount: 3,
      totalPrice: 299.97,
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
    })

    render(<Header />)

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('すべてのナビゲーションリンクが正しく機能する', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    render(<Header />)

    const homeLink = screen.getByText('ホーム').closest('a')
    const productsLink = screen.getByText('商品一覧').closest('a')
    const cartLink = screen.getByText('カート').closest('a')
    const loginLink = screen.getByText('ログイン').closest('a')

    expect(homeLink).toHaveAttribute('href', '/')
    expect(productsLink).toHaveAttribute('href', '/products')
    expect(cartLink).toHaveAttribute('href', '/cart')
    expect(loginLink).toHaveAttribute('href', '/login')
  })
})
