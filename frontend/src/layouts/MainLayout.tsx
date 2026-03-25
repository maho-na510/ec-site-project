import { Outlet, Link } from 'react-router-dom'
import Header from '../components/Header'

// メインレイアウト（ヘッダー + コンテンツ + フッター）
export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* メインコンテンツ */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">ECサイト</h3>
              <p className="text-gray-400">あなたの信頼できるオンラインショッピング</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">クイックリンク</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-white transition">ホーム</Link>
                </li>
                <li>
                  <Link to="/products" className="text-gray-400 hover:text-white transition">商品一覧</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">お問い合わせ</h3>
              <p className="text-gray-400">メール: support@ecsite.com</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 ECサイト. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
