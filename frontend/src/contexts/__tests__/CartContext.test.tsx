import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CartProvider, useCart } from '../CartContext'

// cartService をモック
jest.mock('../../services/cartService', () => ({
  cartService: {
    getCart: jest.fn().mockResolvedValue({
      id: 1,
      items: [],
      totalAmount: 0,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }),
    addItem: jest.fn().mockResolvedValue({
      id: 1,
      items: [
        {
          id: 1,
          productId: 1,
          product: {
            id: 1,
            name: 'テスト商品',
            price: 100,
            stockQuantity: 10,
            images: [],
            isActive: true,
            isSuspended: false,
          },
          quantity: 2,
          subtotal: 200,
        },
      ],
      totalAmount: 200,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }),
    updateItem: jest.fn(),
    removeItem: jest.fn().mockResolvedValue({
      id: 1,
      items: [],
      totalAmount: 0,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }),
    clearCart: jest.fn().mockResolvedValue({ message: 'cleared' }),
    calculateSubtotal: jest.fn().mockReturnValue(0),
  },
}))

// AuthContext をモック（ログイン済みユーザー）
jest.mock('../AuthContext', () => ({
  ...jest.requireActual('../AuthContext'),
  useAuth: () => ({
    isAuthenticated: true,
    isAdmin: false,
    user: { id: 1, name: 'テストユーザー', email: 'test@example.com' },
    login: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>{children}</CartProvider>
  </QueryClientProvider>
)

describe('CartContext', () => {
  beforeEach(() => {
    queryClient.clear()
  })

  it('初期状態でiItemCountが0である', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    expect(result.current.itemCount).toBe(0)
  })

  it('subtotalの初期値が0である', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    expect(result.current.subtotal).toBe(0)
  })

  it('cartの初期値がnullである', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    // 初期状態はnull（APIコールが完了する前）
    expect(result.current.cart).toBeNull()
  })

  it('CartContextが必要なメソッドを提供する', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    expect(typeof result.current.addToCart).toBe('function')
    expect(typeof result.current.updateQuantity).toBe('function')
    expect(typeof result.current.removeItem).toBe('function')
    expect(typeof result.current.clearCart).toBe('function')
    expect(typeof result.current.refreshCart).toBe('function')
  })

  it('addToCartがcartServiceを呼び出す', async () => {
    const { cartService } = await import('../../services/cartService')
    const { result } = renderHook(() => useCart(), { wrapper })

    await act(async () => {
      await result.current.addToCart(1, 2)
    })

    expect(cartService.addItem).toHaveBeenCalledWith(1, 2)
  })

  it('CartProviderの外でuseCartを使うとエラーになる', () => {
    // コンソールエラーを一時的に抑制
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useCart())
    }).toThrow('useCart must be used within a CartProvider')

    consoleSpy.mockRestore()
  })
})
