import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../../test/test-utils'
import AdminAccountsPage from '../AdminAccountsPage'

// adminApi をモック
const mockGet = jest.fn()
const mockPost = jest.fn()
const mockDelete = jest.fn()

jest.mock('../../../services/api', () => ({
  adminApi: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    delete: (...args: any[]) => mockDelete(...args),
  },
  handleApiError: (err: any) => err?.message ?? 'エラーが発生しました',
}))

// useAuth をモック（currentAdmin の id を固定）
jest.mock('../../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../../contexts/AuthContext'),
  useAuth: () => ({
    user: { id: 1, name: '自分管理者', email: 'me@example.com' },
    isAuthenticated: true,
    isAdmin: true,
    isLoading: false,
    login: jest.fn(),
    adminLogin: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
  }),
}))

const adminListResponse = {
  data: {
    data: [
      { id: 1, name: '自分管理者', email: 'me@example.com', createdAt: '2024-01-01T00:00:00Z' },
      { id: 2, name: '他の管理者', email: 'other@example.com', createdAt: '2024-02-01T00:00:00Z' },
    ],
  },
}

describe('AdminAccountsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGet.mockResolvedValue(adminListResponse)
  })

  it('管理者一覧が表示される', async () => {
    render(<AdminAccountsPage />)

    await waitFor(() => {
      expect(screen.getByText('自分管理者')).toBeInTheDocument()
      expect(screen.getByText('他の管理者')).toBeInTheDocument()
    })

    expect(screen.getByText('me@example.com')).toBeInTheDocument()
    expect(screen.getByText('other@example.com')).toBeInTheDocument()
  })

  it('自分のアカウントに「自分」バッジが表示される', async () => {
    render(<AdminAccountsPage />)

    await waitFor(() => {
      expect(screen.getByText('自分')).toBeInTheDocument()
    })
  })

  it('自分のアカウントには削除ボタンが表示されない', async () => {
    render(<AdminAccountsPage />)

    await waitFor(() => {
      expect(screen.getByText('他の管理者')).toBeInTheDocument()
    })

    // 削除ボタンは他の管理者の行にのみある
    const deleteButtons = screen.getAllByText('削除')
    expect(deleteButtons).toHaveLength(1)
  })

  it('「+ 管理者を追加」ボタンで作成フォームが表示される', async () => {
    const user = userEvent.setup()
    render(<AdminAccountsPage />)

    await waitFor(() => {
      expect(screen.getByText('+ 管理者を追加')).toBeInTheDocument()
    })

    await user.click(screen.getByText('+ 管理者を追加'))

    expect(screen.getByText('新しい管理者を追加')).toBeInTheDocument()
    expect(screen.getByLabelText(/^名前/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^メールアドレス/)).toBeInTheDocument()
  })

  it('パスワードが一致しない場合エラーが表示される', async () => {
    const user = userEvent.setup()
    render(<AdminAccountsPage />)

    await waitFor(() => {
      expect(screen.getByText('+ 管理者を追加')).toBeInTheDocument()
    })

    await user.click(screen.getByText('+ 管理者を追加'))

    await user.type(screen.getByLabelText(/^名前/), '新管理者')
    await user.type(screen.getByLabelText(/^メールアドレス/), 'new@example.com')
    await user.type(screen.getByLabelText(/8文字以上/), 'password123')
    await user.type(screen.getByLabelText(/確認/), 'different456')
    await user.click(screen.getByRole('button', { name: '作成する' }))

    expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument()
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('パスワードが8文字未満の場合エラーが表示される', async () => {
    const user = userEvent.setup()
    render(<AdminAccountsPage />)

    await waitFor(() => {
      expect(screen.getByText('+ 管理者を追加')).toBeInTheDocument()
    })

    await user.click(screen.getByText('+ 管理者を追加'))

    await user.type(screen.getByLabelText(/^名前/), '新管理者')
    await user.type(screen.getByLabelText(/^メールアドレス/), 'new@example.com')
    await user.type(screen.getByLabelText(/8文字以上/), 'short')
    await user.type(screen.getByLabelText(/確認/), 'short')
    await user.click(screen.getByRole('button', { name: '作成する' }))

    expect(screen.getByText('パスワードは8文字以上で入力してください')).toBeInTheDocument()
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('有効な入力で管理者を作成できる', async () => {
    const user = userEvent.setup()
    mockPost.mockResolvedValueOnce({ data: { success: true } })
    // 作成後の再取得
    mockGet.mockResolvedValue(adminListResponse)

    render(<AdminAccountsPage />)

    await waitFor(() => {
      expect(screen.getByText('+ 管理者を追加')).toBeInTheDocument()
    })

    await user.click(screen.getByText('+ 管理者を追加'))

    await user.type(screen.getByLabelText(/^名前/), '新管理者')
    await user.type(screen.getByLabelText(/^メールアドレス/), 'new@example.com')
    await user.type(screen.getByLabelText(/8文字以上/), 'password123')
    await user.type(screen.getByLabelText(/確認/), 'password123')
    await user.click(screen.getByRole('button', { name: '作成する' }))

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/admins', expect.objectContaining({
        name: '新管理者',
        email: 'new@example.com',
        password: 'password123',
        password_confirmation: 'password123',
      }))
    })

    await waitFor(() => {
      expect(screen.getByText('管理者アカウントを作成しました')).toBeInTheDocument()
    })
  })

  it('削除ボタンでwindow.confirmが呼ばれ、確認後に削除APIが呼ばれる', async () => {
    const user = userEvent.setup()
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
    mockDelete.mockResolvedValueOnce({ data: { success: true } })

    render(<AdminAccountsPage />)

    await waitFor(() => {
      expect(screen.getByText('削除')).toBeInTheDocument()
    })

    await user.click(screen.getByText('削除'))

    expect(confirmSpy).toHaveBeenCalled()
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('/admins/2')
    })

    confirmSpy.mockRestore()
  })

  it('削除確認をキャンセルするとAPIが呼ばれない', async () => {
    const user = userEvent.setup()
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)

    render(<AdminAccountsPage />)

    await waitFor(() => {
      expect(screen.getByText('削除')).toBeInTheDocument()
    })

    await user.click(screen.getByText('削除'))

    expect(confirmSpy).toHaveBeenCalled()
    expect(mockDelete).not.toHaveBeenCalled()

    confirmSpy.mockRestore()
  })

  it('キャンセルボタンでフォームが閉じる', async () => {
    const user = userEvent.setup()
    render(<AdminAccountsPage />)

    await waitFor(() => {
      expect(screen.getByText('+ 管理者を追加')).toBeInTheDocument()
    })

    await user.click(screen.getByText('+ 管理者を追加'))
    expect(screen.getByText('新しい管理者を追加')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(screen.queryByText('新しい管理者を追加')).not.toBeInTheDocument()
  })
})
