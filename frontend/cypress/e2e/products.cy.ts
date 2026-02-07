// 商品一覧ページの E2E テスト
// API をモックして商品の表示・検索・カテゴリ絞り込みをテスト

describe('商品一覧ページ', () => {
  beforeEach(() => {
    // 商品一覧 API をモック
    cy.intercept('GET', '**/api/v1/products*', { fixture: 'products.json' }).as('getProducts')

    // カテゴリ一覧 API をモック
    cy.intercept('GET', '**/api/v1/categories*', { fixture: 'categories.json' }).as('getCategories')

    cy.visit('/products')

    // APIの応答を待つ
    cy.wait('@getProducts')
  })

  it('商品一覧が表示される', () => {
    // 商品名が表示されていること
    cy.contains('テスト商品A').should('be.visible')
    cy.contains('テスト商品B').should('be.visible')
    cy.contains('セール品').should('be.visible')
  })

  it('商品の価格が正しく表示される', () => {
    // ¥1,000 のように表示されること（formatCurrency の動作確認）
    cy.contains('¥1,000').should('be.visible')
    cy.contains('¥2,500').should('be.visible')
    cy.contains('¥500').should('be.visible')
  })

  it('検索ボックスで商品を絞り込める', () => {
    // 検索ボックスに入力する
    cy.get('input[placeholder*="検索"]').type('テスト商品A')

    // テスト商品A だけ表示されていること
    cy.contains('テスト商品A').should('be.visible')

    // テスト商品B と セール品 は非表示になること
    // ここで詰まった：contains() は存在チェックなので not.exist ではなく not.be.visible を使う
    cy.contains('テスト商品B').should('not.exist')
    cy.contains('セール品').should('not.exist')
  })

  it('カテゴリボタンで商品を絞り込める', () => {
    // カテゴリボタンが表示されること（categories が読み込まれているはず）
    cy.contains('セールカテゴリ').should('be.visible').click()

    // セールカテゴリの商品だけ表示されること
    cy.contains('セール品').should('be.visible')

    // 他のカテゴリの商品は表示されないこと
    cy.contains('テスト商品A').should('not.exist')
  })

  it('商品をクリックすると詳細ページに遷移する', () => {
    cy.contains('テスト商品A').click()
    cy.url().should('include', '/products/')
  })
})

// 商品詳細ページのテスト
describe('商品詳細ページ', () => {
  beforeEach(() => {
    // 商品詳細 API をモック
    cy.intercept('GET', '**/api/v1/products/1', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          name: 'テスト商品A',
          description: 'テスト用の商品です',
          price: 1000,
          stock_quantity: 10,
          is_active: true,
          category: { id: 1, name: 'テストカテゴリ' },
        },
      },
    }).as('getProduct')

    cy.visit('/products/1')
    cy.wait('@getProduct')
  })

  it('商品詳細が表示される', () => {
    cy.contains('テスト商品A').should('be.visible')
    cy.contains('テスト用の商品です').should('be.visible')
    cy.contains('¥1,000').should('be.visible')
  })

  it('カートに追加ボタンが存在する', () => {
    cy.contains('カートに追加').should('be.visible')
  })
})
