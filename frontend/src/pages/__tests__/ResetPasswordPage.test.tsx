import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/test-utils'
import ResetPasswordPage from '../ResetPasswordPage'

// authService をモック
const mockResetPassword = jest.fn()
jest.mock('../../services/authService', () => ({
  authService: {
    resetPassword: (...args: any[]) => mockResetPassword(...args),
  },
}))

// useNavigate をモック
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: jest.requireActual('react-router-dom').useSearchParams,
}))

// トークンあり/なしのURLを切り替えるためのヘルパー
const renderWithToken = (token: string | null) => {
  const search = token ? `?token=${token}` : ''
  window.history.replaceState({}, '', `/reset-password${search}`)
  return render(<ResetPasswordPage />)
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('トークンなし', () => {
    it('無効なリンクメッセージが表示される', () => {
      renderWithToken(null)

      expect(screen.getByText(/無効なパスワードリセットリンクです/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /再度リセットメールを送信する/i })).toBeInTheDocument()
      expect(screen.queryByLabelText(/新しいパスワード/i)).not.toBeInTheDocument()
    })
  })

  describe('トークンあり', () => {
    beforeEach(() => {
      renderWithToken('valid-token-123')
    })

    it('パスワード変更フォームが表示される', () => {
      expect(screen.getByText('新しいパスワードを設定')).toBeInTheDocument()
      expect(screen.getByLabelText(/新しいパスワード/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/パスワード（確認）/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /パスワードを変更する/i })).toBeInTheDocument()
    })

    it('パスワードが一致しない場合エラーが表示される', async () => {
      const user = userEvent.setup()

      await user.type(screen.getByLabelText(/新しいパスワード/i), 'password123')
      await user.type(screen.getByLabelText(/パスワード（確認）/i), 'different456')
      await user.click(screen.getByRole('button', { name: /パスワードを変更する/i }))

      expect(screen.getByText(/パスワードが一致しません/i)).toBeInTheDocument()
      expect(mockResetPassword).not.toHaveBeenCalled()
    })

    it('パスワードが6文字未満の場合エラーが表示される', async () => {
      const user = userEvent.setup()

      await user.type(screen.getByLabelText(/新しいパスワード/i), 'abc')
      await user.type(screen.getByLabelText(/パスワード（確認）/i), 'abc')
      await user.click(screen.getByRole('button', { name: /パスワードを変更する/i }))

      expect(screen.getByText(/パスワードは6文字以上/i)).toBeInTheDocument()
      expect(mockResetPassword).not.toHaveBeenCalled()
    })

    it('送信成功時にログインページへ遷移する', async () => {
      const user = userEvent.setup()
      mockResetPassword.mockResolvedValueOnce({ message: 'ok' })

      await user.type(screen.getByLabelText(/新しいパスワード/i), 'newpassword')
      await user.type(screen.getByLabelText(/パスワード（確認）/i), 'newpassword')
      await user.click(screen.getByRole('button', { name: /パスワードを変更する/i }))

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('valid-token-123', 'newpassword')
        expect(mockNavigate).toHaveBeenCalledWith(
          '/login',
          expect.objectContaining({ state: expect.objectContaining({ message: expect.any(String) }) })
        )
      })
    })

    it('401エラー時にトークン期限切れメッセージが表示される', async () => {
      const user = userEvent.setup()
      const err = Object.assign(new Error('Expired'), { statusCode: 401 })
      mockResetPassword.mockRejectedValueOnce(err)

      await user.type(screen.getByLabelText(/新しいパスワード/i), 'newpassword')
      await user.type(screen.getByLabelText(/パスワード（確認）/i), 'newpassword')
      await user.click(screen.getByRole('button', { name: /パスワードを変更する/i }))

      await waitFor(() => {
        expect(screen.getByText(/リセットリンクの有効期限が切れています/i)).toBeInTheDocument()
      })
    })

    it('その他のエラー時に汎用エラーメッセージが表示される', async () => {
      const user = userEvent.setup()
      mockResetPassword.mockRejectedValueOnce(new Error('Server error'))

      await user.type(screen.getByLabelText(/新しいパスワード/i), 'newpassword')
      await user.type(screen.getByLabelText(/パスワード（確認）/i), 'newpassword')
      await user.click(screen.getByRole('button', { name: /パスワードを変更する/i }))

      await waitFor(() => {
        expect(screen.getByText(/パスワードの変更に失敗しました/i)).toBeInTheDocument()
      })
    })
  })
})
