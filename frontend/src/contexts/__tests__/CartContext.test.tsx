import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CartProvider, useCart } from '../CartContext'
import { AuthProvider } from '../AuthContext'

// Mock AuthContext
jest.mock('../AuthContext', () => ({
  ...jest.requireActual('../AuthContext'),
  useAuth: () => ({
    user: { id: 1, name: 'Test User', email: 'test@example.com', address: '123 Main St' },
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
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
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  </QueryClientProvider>
)

describe('CartContext', () => {
  beforeEach(() => {
    queryClient.clear()
  })

  it('初期状態ではカートが空である', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    expect(result.current.items).toEqual([])
    expect(result.current.itemCount).toBe(0)
    expect(result.current.totalPrice).toBe(0)
  })

  it('カートにアイテムを追加できる', async () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    const mockProduct = {
      id: 1,
      name: 'Test Product',
      price: 99.99,
      stock_quantity: 10,
    }

    act(() => {
      result.current.addItem(mockProduct as any, 2)
    })

    await waitFor(() => {
      expect(result.current.items.length).toBeGreaterThan(0)
    })
  })

  it('カートアイテムの数量を更新できる', async () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    const mockProduct = {
      id: 1,
      name: 'Test Product',
      price: 99.99,
      stock_quantity: 10,
    }

    act(() => {
      result.current.addItem(mockProduct as any, 1)
    })

    await waitFor(() => {
      expect(result.current.items.length).toBeGreaterThan(0)
    })

    const itemId = result.current.items[0].id

    act(() => {
      result.current.updateQuantity(itemId, 3)
    })

    await waitFor(() => {
      const item = result.current.items.find(i => i.id === itemId)
      expect(item?.quantity).toBe(3)
    })
  })

  it('カートからアイテムを削除できる', async () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    const mockProduct = {
      id: 1,
      name: 'Test Product',
      price: 99.99,
      stock_quantity: 10,
    }

    act(() => {
      result.current.addItem(mockProduct as any, 1)
    })

    await waitFor(() => {
      expect(result.current.items.length).toBeGreaterThan(0)
    })

    const itemId = result.current.items[0].id

    act(() => {
      result.current.removeItem(itemId)
    })

    await waitFor(() => {
      expect(result.current.items.length).toBe(0)
    })
  })

  it('合計金額が正しく計算される', async () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    const mockProduct1 = {
      id: 1,
      name: 'Product 1',
      price: 100,
      stock_quantity: 10,
    }

    const mockProduct2 = {
      id: 2,
      name: 'Product 2',
      price: 50,
      stock_quantity: 10,
    }

    act(() => {
      result.current.addItem(mockProduct1 as any, 2)
      result.current.addItem(mockProduct2 as any, 1)
    })

    await waitFor(() => {
      // 100 * 2 + 50 * 1 = 250
      expect(result.current.totalPrice).toBe(250)
    })
  })

  it('カート内のアイテム総数が正しく計算される', async () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    const mockProduct1 = {
      id: 1,
      name: 'Product 1',
      price: 100,
      stock_quantity: 10,
    }

    const mockProduct2 = {
      id: 2,
      name: 'Product 2',
      price: 50,
      stock_quantity: 10,
    }

    act(() => {
      result.current.addItem(mockProduct1 as any, 2)
      result.current.addItem(mockProduct2 as any, 3)
    })

    await waitFor(() => {
      expect(result.current.itemCount).toBe(5)
    })
  })
})
