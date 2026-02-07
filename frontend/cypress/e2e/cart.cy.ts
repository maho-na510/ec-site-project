// カートページの E2E テスト
// ここで詰まった：ログインが必要なページは先に認証状態を作る必要がある
// localStorage にトークンをセットしてログイン済み状態を再現する

describe('カートページ（ログイン必須）', () => {
  beforeEach(() => {
    // ログイン済み状態を作る
    // 本当はログインフォームを使うが、ここでは localStorage を直接セットして高速化
    window.localStorage.setItem('auth_token', 'fake-token')
    window.localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, name: 'テストユーザー', email: 'test@example.com' }),
    )

    // カート API をモック（空のカート）
    cy.intercept('GET', '**/api/v1/cart', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [],
          total: 0,
        },
      },
    }).as('getCart')

    cy.visit('/cart')
  })

  it('カートが空のとき「カートは空です」と表示される', () => {
    cy.wait('@getCart')
    cy.contains('カートは空').should('be.visible')
  })
})

describe('カートに商品を追加する', () => {
  beforeEach(() => {
    // 認証状態のモック
    window.localStorage.setItem('auth_token', 'fake-token')
    window.localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, name: 'テストユーザー', email: 'test@example.com' }),
    )

    // 商品一覧 API のモック
    cy.intercept('GET', '**/api/v1/products*', { fixture: 'products.json' }).as('getProducts')
    cy.intercept('GET', '**/api/v1/categories*', { fixture: 'categories.json' }).as('getCategories')

    // カートに追加 API のモック
    cy.intercept('POST', '**/api/v1/cart/items', {
      statusCode: 200,
      body: {
        success: true,
        message: 'カートに追加しました',
        data: {
          items: [
            {
              id: 1,
              product: { id: 1, name: 'テスト商品A', price: 1000 },
              quantity: 1,
            },
          ],
          total: 1000,
        },
      },
    }).as('addToCart')

    cy.visit('/products')
    cy.wait('@getProducts')
  })

  it('商品一覧から「カートに追加」ボタンが存在する', () => {
    // カートに追加ボタンが表示されていること
    // 注意：ボタンが複数あるので first() で最初の商品のボタンを使う
    cy.contains('カートに追加').first().should('be.visible')
  })

  it('「カートに追加」をクリックするとカート API が呼ばれる', () => {
    cy.contains('カートに追加').first().click()
    cy.wait('@addToCart')
  })
})

describe('カートページ（商品あり）', () => {
  beforeEach(() => {
    window.localStorage.setItem('auth_token', 'fake-token')
    window.localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, name: 'テストユーザー', email: 'test@example.com' }),
    )

    // 商品が入ったカート API のモック
    cy.intercept('GET', '**/api/v1/cart', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            {
              id: 1,
              product: { id: 1, name: 'テスト商品A', price: 1000 },
              quantity: 2,
            },
          ],
          total: 2000,
        },
      },
    }).as('getCartWithItems')

    cy.visit('/cart')
    cy.wait('@getCartWithItems')
  })

  it('カートの商品名と合計金額が表示される', () => {
    cy.contains('テスト商品A').should('be.visible')
    // 合計 ¥2,000 が表示されること
    cy.contains('¥2,000').should('be.visible')
  })

  it('チェックアウトボタンが存在する', () => {
    cy.contains('購入手続き').should('be.visible')
  })
})
