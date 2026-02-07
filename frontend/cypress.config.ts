import { defineConfig } from 'cypress'

// Cypress の設定ファイル
// baseUrl はローカル開発サーバーのアドレス
// ここで詰まった：ポート番号を間違えると全テストが失敗する
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    // タイムアウトを少し長めに設定（遅い環境でも安定するように）
    defaultCommandTimeout: 8000,
    // スクリーンショットの保存先
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    // CI環境ではビデオ録画をオフにするとファイルが軽くなる
    video: false,
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
  },
})
