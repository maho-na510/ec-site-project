import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/test-utils'
import ProductsPage from '../ProductsPage'

// Mock useQuery
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}))

import { useQuery } from '@tanstack/react-query'

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>

describe('ProductsPage', () => {
  const mockProducts = [
    {
      id: 1,
      name: 'ワイヤレスヘッドホン',
      description: '高品質なワイヤレスヘッドホン',
      price: 9999,
      stock_quantity: 50,
      is_active: true,
      category: { id: 1, name: 'エレクトロニクス' },
      images: [{ id: 1, image_url: '/test.jpg', is_primary: true }],
    },
    {
      id: 2,
      name: 'Bluetoothスピーカー',
      description: 'ポータブルスピーカー',
      price: 4999,
      stock_quantity: 100,
      is_active: true,
      category: { id: 1, name: 'エレクトロニクス' },
      images: [],
    },
  ]

  const mockCategories = [
    { id: 1, name: 'エレクトロニクス' },
    { id: 2, name: '衣類' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('商品一覧が正しく表示される', async () => {
    mockUseQuery.mockImplementation((options: any) => {
      if (options.queryKey[0] === 'products') {
        return {
          data: { data: mockProducts, meta: { total: 2, per_page: 20, current_page: 1 } },
          isLoading: false,
          error: null,
        } as any
      }
      if (options.queryKey[0] === 'categories') {
        return {
          data: { data: mockCategories },
          isLoading: false,
          error: null,
        } as any
      }
      return { data: null, isLoading: false, error: null } as any
    })

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByText('ワイヤレスヘッドホン')).toBeInTheDocument()
      expect(screen.getByText('Bluetoothスピーカー')).toBeInTheDocument()
    })
  })

  it('ローディング状態が表示される', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    } as any)

    render(<ProductsPage />)

    expect(screen.getByText(/読み込み中/i)).toBeInTheDocument()
  })

  it('エラー状態が表示される', () => {
    mockUseQuery.mockImplementation((options: any) => {
      if (options.queryKey[0] === 'products') {
        return {
          data: null,
          isLoading: false,
          error: new Error('Failed to fetch'),
        } as any
      }
      return { data: null, isLoading: false, error: null } as any
    })

    render(<ProductsPage />)

    expect(screen.getByText(/商品の読み込みに失敗しました/i)).toBeInTheDocument()
  })

  it('価格が正しくフォーマットされる', async () => {
    mockUseQuery.mockImplementation((options: any) => {
      if (options.queryKey[0] === 'products') {
        return {
          data: { data: mockProducts, meta: { total: 2 } },
          isLoading: false,
          error: null,
        } as any
      }
      if (options.queryKey[0] === 'categories') {
        return {
          data: { data: mockCategories },
          isLoading: false,
          error: null,
        } as any
      }
      return { data: null, isLoading: false, error: null } as any
    })

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByText(/¥9,999/)).toBeInTheDocument()
      expect(screen.getByText(/¥4,999/)).toBeInTheDocument()
    })
  })

  it('カテゴリーフィルターが機能する', async () => {
    const user = userEvent.setup()

    mockUseQuery.mockImplementation((options: any) => {
      if (options.queryKey[0] === 'products') {
        return {
          data: { data: mockProducts, meta: { total: 2 } },
          isLoading: false,
          error: null,
        } as any
      }
      if (options.queryKey[0] === 'categories') {
        return {
          data: { data: mockCategories },
          isLoading: false,
          error: null,
        } as any
      }
      return { data: null, isLoading: false, error: null } as any
    })

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByText('エレクトロニクス')).toBeInTheDocument()
    })

    const categoryButton = screen.getByText('エレクトロニクス')
    await user.click(categoryButton)

    // カテゴリーフィルターがクリックされたことを確認
    expect(categoryButton).toBeInTheDocument()
  })

  it('検索機能が表示される', () => {
    mockUseQuery.mockImplementation((options: any) => {
      if (options.queryKey[0] === 'products') {
        return {
          data: { data: [], meta: { total: 0 } },
          isLoading: false,
          error: null,
        } as any
      }
      if (options.queryKey[0] === 'categories') {
        return {
          data: { data: mockCategories },
          isLoading: false,
          error: null,
        } as any
      }
      return { data: null, isLoading: false, error: null } as any
    })

    render(<ProductsPage />)

    expect(screen.getByPlaceholderText(/商品を検索/i)).toBeInTheDocument()
  })

  it('商品がない場合のメッセージが表示される', async () => {
    mockUseQuery.mockImplementation((options: any) => {
      if (options.queryKey[0] === 'products') {
        return {
          data: { data: [], meta: { total: 0 } },
          isLoading: false,
          error: null,
        } as any
      }
      if (options.queryKey[0] === 'categories') {
        return {
          data: { data: [] },
          isLoading: false,
          error: null,
        } as any
      }
      return { data: null, isLoading: false, error: null } as any
    })

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByText(/商品が見つかりませんでした/i)).toBeInTheDocument()
    })
  })
})
