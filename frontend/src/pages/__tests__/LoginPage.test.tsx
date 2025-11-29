import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/test-utils'
import LoginPage from '../LoginPage'

// Mock useNavigate
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

// Mock AuthContext
const mockLogin = jest.fn()
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => ({
    login: mockLogin,
    user: null,
    loading: false,
    logout: jest.fn(),
  }),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('ログインフォームが正しく表示される', () => {
    render(<LoginPage />)

    expect(screen.getByText('ログイン')).toBeInTheDocument()
    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ログイン/i })).toBeInTheDocument()
  })

  it('新規登録リンクが表示される', () => {
    render(<LoginPage />)

    expect(screen.getByText(/アカウントをお持ちでない方/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /新規登録/i })).toBeInTheDocument()
  })

  it('有効な入力でログインできる', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValueOnce({ user: { id: 1, email: 'test@example.com' } })

    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/メールアドレス/i)
    const passwordInput = screen.getByLabelText(/パスワード/i)
    const loginButton = screen.getByRole('button', { name: /ログイン/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(loginButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('メールアドレスが空の場合エラーが表示される', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    const loginButton = screen.getByRole('button', { name: /ログイン/i })
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/メールアドレスを入力してください/i)).toBeInTheDocument()
    })
  })

  it('パスワードが空の場合エラーが表示される', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/メールアドレス/i)
    const loginButton = screen.getByRole('button', { name: /ログイン/i })

    await user.type(emailInput, 'test@example.com')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/パスワードを入力してください/i)).toBeInTheDocument()
    })
  })

  it('ログイン失敗時にエラーメッセージが表示される', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'))

    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/メールアドレス/i)
    const passwordInput = screen.getByLabelText(/パスワード/i)
    const loginButton = screen.getByRole('button', { name: /ログイン/i })

    await user.type(emailInput, 'wrong@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/ログインに失敗しました/i)).toBeInTheDocument()
    })
  })
})
