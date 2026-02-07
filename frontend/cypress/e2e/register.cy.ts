// 新規登録ページの E2E テスト
// フォームバリデーションと登録成功フローをテスト

describe('新規登録ページ', () => {
  beforeEach(() => {
    cy.visit('/register')
  })

  it('新規登録ページが正しく表示される', () => {
    cy.get('h1').should('contain', '新規登録')
    cy.get('input[placeholder="山田 太郎"]').should('exist')
    cy.get('input[type="email"]').should('exist')
    cy.get('input[type="password"]').should('have.length.at.least', 1)
    cy.get('button[type="submit"]').should('contain', '登録')
  })

  it('名前が未入力のとき、エラーが表示される', () => {
    cy.get('input[type="email"]').type('test@example.com')
    cy.get('button[type="submit"]').click()

    cy.contains('名前を入力してください').should('be.visible')
  })

  it('パスワードが6文字未満のとき、エラーが表示される', () => {
    cy.get('input[placeholder="山田 太郎"]').type('テストユーザー')
    cy.get('input[type="email"]').type('test@example.com')
    // パスワード欄が複数あるので first() で最初のものを選ぶ
    cy.get('input[type="password"]').first().type('abc')
    cy.get('button[type="submit"]').click()

    cy.contains('パスワードは6文字以上で入力してください').should('be.visible')
  })

  it('登録に成功するとログインページに遷移する', () => {
    // 注意：intercept は API のパスと一致させること
    cy.intercept('POST', '**/api/v1/auth/register', {
      statusCode: 200,
      body: {
        success: true,
        message: '登録が完了しました',
      },
    }).as('registerRequest')

    cy.get('input[placeholder="山田 太郎"]').type('テストユーザー')
    cy.get('input[type="email"]').type('newuser@example.com')
    cy.get('input[type="password"]').first().type('password123')
    cy.get('input[type="password"]').last().type('password123')

    cy.get('button[type="submit"]').click()

    cy.wait('@registerRequest')

    // 成功メッセージが表示されること
    cy.contains('登録が完了しました').should('be.visible')

    // 少し待ってからログインページに遷移すること
    cy.url({ timeout: 5000 }).should('include', '/login')
  })

  it('登録に失敗するとエラーメッセージが表示される', () => {
    cy.intercept('POST', '**/api/v1/auth/register', {
      statusCode: 422,
      body: { success: false, message: 'Email already taken' },
    }).as('registerFailed')

    cy.get('input[placeholder="山田 太郎"]').type('テストユーザー')
    cy.get('input[type="email"]').type('existing@example.com')
    cy.get('input[type="password"]').first().type('password123')
    cy.get('input[type="password"]').last().type('password123')

    cy.get('button[type="submit"]').click()

    cy.wait('@registerFailed')

    cy.contains('登録に失敗しました').should('be.visible')
  })

  it('ログインリンクをクリックするとログインページに遷移する', () => {
    cy.contains('ログイン').click()
    cy.url().should('include', '/login')
  })
})
