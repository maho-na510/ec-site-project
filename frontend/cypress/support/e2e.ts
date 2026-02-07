// Cypress サポートファイル
// ここに全テストで使う共通の設定を書く
// import './commands' でカスタムコマンドを読み込む

import './commands'

// API のモックを設定するため cy.intercept を使う
// 注意：本番 API を叩かないようにするのが大事
