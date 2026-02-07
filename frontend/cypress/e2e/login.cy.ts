// ログインページの E2E テスト
// ここで詰まった：cy.intercept() のパスは完全一致ではなくパターンマッチ

describe('ログインページ', () => {
  beforeEach(() => {
    // テストのたびにログインページに移動する
    cy.visit('/login')
  })

  it('ログインページが正しく表示される', () => {
    // ページタイトルの確認
    cy.get('h1').should('contain', 'ログイン')
    // フォームの入力欄が存在するか確認
    cy.get('input[type="email"]').should('exist')
    cy.get('input[type="password"]').should('exist')
    cy.get('button[type="submit"]').should('contain', 'ログイン')
  })

  it('メールアドレスが未入力のとき、エラーメッセージが表示される', () => {
    // パスワードだけ入力してsubmit
    cy.get('input[type="password"]').type('password123')
    cy.get('button[type="submit"]').click()

    // バリデーションエラーが表示されること
    cy.contains('メールアドレスを入力してください').should('be.visible')
  })

  it('パスワードが未入力のとき、エラーメッセージが表示される', () => {
    cy.get('input[type="email"]').type('test@example.com')
    cy.get('button[type="submit"]').click()

    cy.contains('パスワードを入力してください').should('be.visible')
  })

  it('メールアドレスの形式が不正のとき、エラーメッセージが表示される', () => {
    // @ がないメールアドレス
    cy.get('input[type="email"]').type('notanemail')
    cy.get('input[type="password"]').type('password123')
    cy.get('button[type="submit"]').click()

    cy.contains('正しいメールアドレスを入力してください').should('be.visible')
  })

  it('ログインに成功するとホームページに遷移する', () => {
    // API レスポンスをモック（本番サーバーを叩かないようにする）
    // 注意：intercept は cy.visit より前に書くこと！後から書いても間に合わないことがある
    cy.intercept('POST', '**/api/v1/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          token: 'fake-jwt-token',
          user: { id: 1, name: 'テストユーザー', email: 'test@example.com' },
        },
      },
    }).as('loginRequest')

    cy.get('input[type="email"]').type('test@example.com')
    cy.get('input[type="password"]').type('password123')
    cy.get('button[type="submit"]').click()

    // ログインAPIが呼ばれたことを確認
    cy.wait('@loginRequest')

    // ホームに遷移すること（URLが / になること）
    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })

  it('ログインに失敗するとエラーメッセージが表示される', () => {
    cy.intercept('POST', '**/api/v1/auth/login', {
      statusCode: 401,
      body: { success: false, message: 'Invalid credentials' },
    }).as('loginFailed')

    cy.get('input[type="email"]').type('wrong@example.com')
    cy.get('input[type="password"]').type('wrongpassword')
    cy.get('button[type="submit"]').click()

    cy.wait('@loginFailed')

    // エラーメッセージが表示されること
    cy.contains('ログインに失敗しました').should('be.visible')
  })

  it('新規登録リンクをクリックすると登録ページに遷移する', () => {
    cy.contains('新規登録').click()
    cy.url().should('include', '/register')
  })
})
