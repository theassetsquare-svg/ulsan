import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const navItems = [
  { path: '/', label: '홈' },
  { path: '/story', label: '이야기' },
  { path: '/atmosphere', label: '분위기' },
  { path: '/first-visit', label: '첫방문' },
  { path: '/access', label: '오시는길' },
  { path: '/review', label: '후기' },
  { path: '/faq', label: 'FAQ' },
  { path: '/contact', label: '연락처' },
]

export default function Layout() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-dark/90 backdrop-blur-md border-b border-gold/20">
        <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-gold font-bold text-xl tracking-tight no-underline">
            울산챔피언나이트
          </Link>
          <button
            className="md:hidden text-gold text-2xl bg-transparent border-none cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="메뉴"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
          <ul className={`${menuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row absolute md:static top-full left-0 right-0 bg-dark md:bg-transparent gap-1 md:gap-1 list-none m-0 p-4 md:p-0`}>
            {navItems.map(({ path, label }) => (
              <li key={path}>
                <Link
                  to={path}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm no-underline transition-colors ${
                    location.pathname === path
                      ? 'text-gold bg-gold/10'
                      : 'text-gray-300 hover:text-gold hover:bg-gold/5'
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-dark-light border-t border-gold/10 py-10 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400 text-sm mb-3">
            광고문의 카카오톡 <a href="https://open.kakao.com/o/sBesta12" target="_blank" rel="noopener" className="text-gold hover:underline">besta12</a>
          </p>
          <p className="text-gray-500 text-sm mb-3">
            더 많은 업소 정보는{' '}
            <a href="https://bamkey.com" target="_blank" rel="noopener" className="text-gold hover:underline font-semibold">
              밤키에서 확인
            </a>
          </p>
          <p className="text-gray-600 text-xs">
            본 사이트는 광고 목적으로 제작되었습니다
          </p>
        </div>
      </footer>

      <a
        href="tel:010-5653-0069"
        className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-gold to-gold-light text-dark font-bold text-lg py-4 text-center no-underline animate-pulse-glow md:bottom-6 md:left-auto md:right-6 md:rounded-full md:w-auto md:px-8 md:max-w-xs"
      >
        춘자에게 전화하기 010-5653-0069
      </a>
    </div>
  )
}
