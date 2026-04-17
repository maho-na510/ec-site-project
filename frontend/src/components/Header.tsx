import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, LogOut, Menu, Heart, X, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useCategories } from '../hooks/useProducts'

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const { itemCount } = useCart()
  const { data: categories } = useCategories()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  // ドロワー外クリックで閉じる
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false)
      }
    }
    if (drawerOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [drawerOpen])

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* 左: ハンバーガー + ロゴ */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDrawerOpen((v) => !v)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition"
                aria-label="カテゴリメニュー"
              >
                {drawerOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <Link to="/" className="text-xl font-bold text-blue-600 tracking-tight hover:opacity-80 transition">
                mahozon
              </Link>
            </div>

            {/* 中央: ナビゲーション */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link to="/" className="text-gray-600 hover:text-blue-600 transition">
                ホーム
              </Link>
              <Link to="/products" className="text-gray-600 hover:text-blue-600 transition">
                商品一覧
              </Link>
            </nav>

            {/* 右: アイコン群 */}
            <div className="flex items-center gap-1">
              {isAuthenticated && (
                <Link
                  to="/wishlist"
                  className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition"
                  title="ほしい物リスト"
                >
                  <Heart className="h-5 w-5" />
                </Link>
              )}

              <Link
                to="/cart"
                className="relative inline-flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition"
                title="カート"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      minWidth: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '0 4px',
                      boxSizing: 'border-box',
                      border: '2px solid #ffffff',
                      zIndex: 10,
                    }}
                  >
                    {itemCount}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <div className="flex items-center gap-1">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition"
                  >
                    <User className="h-5 w-5" />
                    <span className="hidden md:inline text-sm">{user?.email}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
                    title="ログアウト"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 ml-2">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-600 hover:text-blue-600 transition px-2 py-1"
                  >
                    ログイン
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition"
                  >
                    新規登録
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* カテゴリドロワー */}
      {drawerOpen && (
        <div
          ref={drawerRef}
          className="fixed top-16 left-0 z-40 w-72 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 shadow-xl overflow-y-auto"
        >
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-2">
              カテゴリ
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  to="/products"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                >
                  <span>すべての商品</span>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </Link>
              </li>
              {(categories || []).map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/products?categoryId=${cat.id}`}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition"
                  >
                    <span>{cat.name}</span>
                    <ChevronRight className="h-4 w-4 opacity-30" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* オーバーレイ */}
      {drawerOpen && (
        <div
          className="fixed inset-0 top-16 z-30 bg-black/20"
          onClick={() => setDrawerOpen(false)}
        />
      )}
    </>
  )
}
