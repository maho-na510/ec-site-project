import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/test-utils'
import ForgotPasswordPage from '../ForgotPasswordPage'

// authService をモック
const mockRequestPasswordReset = jest.fn()
jest.mock('../../services/authService', () => ({
  authService: {
    requestPasswordReset: (...args: any[]) => mockRequestPasswordReset(...args),
  },
}))

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('フォームが正しく表示される', () => {
    render(<ForgotPasswordPage />)

    expect(screen.getByText('パスワードをお忘れですか？')).toBeInTheDocument()
    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /リセットメールを送信/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ログイン画面に戻る/i })).toBeInTheDocument()
  })

  it('メールアドレスを入力して送信できる', async () => {
    const user = userEvent.setup()
    mockRequestPasswordReset.mockResolvedValueOnce({ message: 'sent' })

    render(<ForgotPasswordPage />)

    await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /リセットメールを送信/i }))

    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith('test@example.com')
    })
  })

  it('送信成功後に成功メッセージが表示される', async () => {
    const user = userEvent.setup()
    mockRequestPasswordReset.mockResolvedValueOnce({ message: 'sent' })

    render(<ForgotPasswordPage />)

    await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /リセットメールを送信/i }))

    await waitFor(() => {
      expect(screen.getByText(/パスワードリセットの手順をメールで送信しました/i)).toBeInTheDocument()
    })

    // フォームは非表示になる
    expect(screen.queryByLabelText(/メールアドレス/i)).not.toBeInTheDocument()
  })

  it('送信失敗時にエラーメッセージが表示される', async () => {
    const user = userEvent.setup()
    mockRequestPasswordReset.mockRejectedValueOnce(new Error('Network error'))

    render(<ForgotPasswordPage />)

    await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /リセットメールを送信/i }))

    await waitFor(() => {
      expect(screen.getByText(/送信に失敗しました/i)).toBeInTheDocument()
    })

    // フォームは引き続き表示される
    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument()
  })
})
