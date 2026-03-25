// ホームページの E2E テスト
// 一番シンプルなページから始める

describe('ホームページ', () => {
  beforeEach(() => {
    // 商品 API をモック（ホームページでも商品を取得するので）
    cy.intercept('GET', '**/api/v1/products*', { fixture: 'products.json' }).as('getProducts')

    cy.visit('/')
    cy.wait('@getProducts')
  })

  it('ホームページが正しく表示される', () => {
    // ウェルカムメッセージが表示されていること
    cy.contains('ECサイトへようこそ').should('be.visible')
  })

  it('ナビゲーションバーが存在する', () => {
    // ナビゲーションの主要リンクが存在すること
    cy.get('nav').should('exist')
  })

  it('商品が一覧表示される', () => {
    // フィクスチャデータの商品が表示されること
    cy.contains('テスト商品A').should('be.visible')
  })

  it('商品リンクをクリックすると詳細ページに遷移する', () => {
    cy.contains('テスト商品A').click()
    cy.url().should('include', '/products/')
  })

  it('「商品一覧」リンクをクリックすると商品ページに遷移する', () => {
    // ナビゲーションバーの商品リンクを探す
    cy.get('a[href="/products"]').first().click()
    cy.url().should('include', '/products')
  })
})

// 未ログイン時のアクセス制限テスト
describe('未ログイン時のアクセス制限', () => {
  beforeEach(() => {
    // ローカルストレージを空にしてログアウト状態にする
    cy.clearLocalStorage()
  })

  it('カートページにアクセスするとログインページにリダイレクトされる', () => {
    cy.visit('/cart')
    // ログインページに飛ばされること
    cy.url().should('include', '/login')
  })

  it('チェックアウトページにアクセスするとログインページにリダイレクトされる', () => {
    cy.visit('/checkout')
    cy.url().should('include', '/login')
  })
})
