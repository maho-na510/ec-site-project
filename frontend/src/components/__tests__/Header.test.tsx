import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Header from '../Header'

// useAuth をモック
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

// useCart をモック
jest.mock('../../contexts/CartContext', () => ({
  useCart: jest.fn(),
}))

import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseCart = useCart as jest.MockedFunction<typeof useCart>

const defaultCartMock = {
  cart: null,
  itemCount: 0,
  subtotal: 0,
  isLoading: false,
  addToCart: jest.fn(),
  updateQuantity: jest.fn(),
  removeItem: jest.fn(),
  clearCart: jest.fn(),
  refreshCart: jest.fn(),
}

const defaultAuthMock = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isAdmin: false,
  login: jest.fn(),
  adminLogin: jest.fn(),
  logout: jest.fn(),
  refreshUser: jest.fn(),
}

const renderHeader = () => render(<BrowserRouter><Header /></BrowserRouter>)

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCart.mockReturnValue(defaultCartMock)
  })

  it('ログアウト状態のヘッダーが正しく表示される', () => {
    mockUseAuth.mockReturnValue(defaultAuthMock)

    renderHeader()

    expect(screen.getByText('ECサイト')).toBeInTheDocument()
    expect(screen.getByText('ホーム')).toBeInTheDocument()
    expect(screen.getByText('商品一覧')).toBeInTheDocument()
    expect(screen.getByText('ログイン')).toBeInTheDocument()
    expect(screen.getByText('新規登録')).toBeInTheDocument()
  })

  it('ログイン状態のヘッダーが正しく表示される', () => {
    mockUseAuth.mockReturnValue({
      ...defaultAuthMock,
      isAuthenticated: true,
      user: {
        id: 1,
        name: 'テストユーザー',
        email: 'test@example.com',
        address: '東京都',
        phone: '090-1234-5678',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    })

    renderHeader()

    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.queryByText('ログイン')).not.toBeInTheDocument()
    expect(screen.queryByText('新規登録')).not.toBeInTheDocument()
  })

  it('カートのアイテム数が正しく表示される', () => {
    mockUseAuth.mockReturnValue(defaultAuthMock)
    mockUseCart.mockReturnValue({ ...defaultCartMock, itemCount: 3 })

    renderHeader()

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('カートが空のときバッジが表示されない', () => {
    mockUseAuth.mockReturnValue(defaultAuthMock)
    mockUseCart.mockReturnValue({ ...defaultCartMock, itemCount: 0 })

    renderHeader()

    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})
