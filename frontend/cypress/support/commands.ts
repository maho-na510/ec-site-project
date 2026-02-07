// カスタムコマンドの定義
// cy.login() のように独自コマンドを作れる

/// <reference types="cypress" />

// ログイン処理をまとめたカスタムコマンド
// テストのたびに同じログイン手順を書かなくて済む
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('button[type="submit"]').click()
})

// TypeScript の型定義（cy.login() を型安全に使うため）
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
    }
  }
}
