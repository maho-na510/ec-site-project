import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/test-utils'
import RegisterPage from '../RegisterPage'

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const mockRegister = jest.fn()
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => ({
    login: jest.fn(),
    user: null,
    loading: false,
    logout: jest.fn(),
  }),
}))

// Mock API
jest.mock('../../services/api', () => ({
  register: (data: any) => mockRegister(data),
}))

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('登録フォームが正しく表示される', () => {
    render(<RegisterPage />)

    expect(screen.getByText('新規登録')).toBeInTheDocument()
    expect(screen.getByLabelText(/名前/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^パスワード$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/パスワード \(確認\)/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/住所/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /登録/i })).toBeInTheDocument()
  })

  it('ログインページへのリンクが表示される', () => {
    render(<RegisterPage />)

    expect(screen.getByText(/すでにアカウントをお持ちの方/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ログイン/i })).toBeInTheDocument()
  })

  it('有効な入力で登録できる', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValueOnce({
      data: { user: { id: 1, email: 'test@example.com' }, token: 'fake-token' },
    })

    render(<RegisterPage />)

    await user.type(screen.getByLabelText(/名前/i), 'テストユーザー')
    await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^パスワード$/i), 'password123')
    await user.type(screen.getByLabelText(/パスワード \(確認\)/i), 'password123')
    await user.type(screen.getByLabelText(/住所/i), '東京都渋谷区1-2-3')

    const registerButton = screen.getByRole('button', { name: /登録/i })
    await user.click(registerButton)

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'テストユーザー',
        email: 'test@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        address: '東京都渋谷区1-2-3',
      })
    })
  })

  it('必須フィールドが空の場合エラーが表示される', async () => {
    const user = userEvent.setup()

    render(<RegisterPage />)

    const registerButton = screen.getByRole('button', { name: /登録/i })
    await user.click(registerButton)

    await waitFor(() => {
      expect(screen.getByText(/名前を入力してください/i)).toBeInTheDocument()
      expect(screen.getByText(/メールアドレスを入力してください/i)).toBeInTheDocument()
      expect(screen.getByText(/パスワードを入力してください/i)).toBeInTheDocument()
    })
  })

  it('パスワードが一致しない場合エラーが表示される', async () => {
    const user = userEvent.setup()

    render(<RegisterPage />)

    await user.type(screen.getByLabelText(/名前/i), 'テストユーザー')
    await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^パスワード$/i), 'password123')
    await user.type(screen.getByLabelText(/パスワード \(確認\)/i), 'different123')

    const registerButton = screen.getByRole('button', { name: /登録/i })
    await user.click(registerButton)

    await waitFor(() => {
      expect(screen.getByText(/パスワードが一致しません/i)).toBeInTheDocument()
    })
  })

  it('パスワードが短すぎる場合エラーが表示される', async () => {
    const user = userEvent.setup()

    render(<RegisterPage />)

    await user.type(screen.getByLabelText(/^パスワード$/i), 'short')

    await waitFor(() => {
      expect(screen.getByText(/パスワードは6文字以上で入力してください/i)).toBeInTheDocument()
    })
  })

  it('無効なメールアドレス形式の場合エラーが表示される', async () => {
    const user = userEvent.setup()

    render(<RegisterPage />)

    await user.type(screen.getByLabelText(/メールアドレス/i), 'invalid-email')

    await waitFor(() => {
      expect(screen.getByText(/正しいメールアドレスを入力してください/i)).toBeInTheDocument()
    })
  })

  it('登録失敗時にエラーメッセージが表示される', async () => {
    const user = userEvent.setup()
    mockRegister.mockRejectedValueOnce({
      response: { data: { message: 'このメールアドレスは既に使用されています' } },
    })

    render(<RegisterPage />)

    await user.type(screen.getByLabelText(/名前/i), 'テストユーザー')
    await user.type(screen.getByLabelText(/メールアドレス/i), 'existing@example.com')
    await user.type(screen.getByLabelText(/^パスワード$/i), 'password123')
    await user.type(screen.getByLabelText(/パスワード \(確認\)/i), 'password123')
    await user.type(screen.getByLabelText(/住所/i), '東京都渋谷区1-2-3')

    const registerButton = screen.getByRole('button', { name: /登録/i })
    await user.click(registerButton)

    await waitFor(() => {
      expect(screen.getByText(/登録に失敗しました/i)).toBeInTheDocument()
    })
  })
})
