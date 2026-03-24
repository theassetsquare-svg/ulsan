import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

export default function Home() {
  return (
    <>
      <SEO
        title="울산챔피언나이트 - 울산 대표 나이트클럽 완벽 가이드"
        description="울산챔피언나이트의 모든 것을 담았습니다. 라이브 무대와 열정의 댄스플로어, 특별한 밤을 만드는 곳. 춘자에게 전화하세요."
        path="/"
      />

      <section className="relative min-h-[90vh] flex items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple/20 via-dark to-dark" />
        <div className="relative z-10 text-center max-w-3xl animate-fade-in-up">
          <p className="text-gold text-sm tracking-[0.3em] uppercase mb-4">Ulsan Champion Night</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            울산의 밤을<br />
            <span className="gradient-text">특별하게 만드는 곳</span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl mb-10 leading-relaxed max-w-2xl mx-auto">
            울산챔피언나이트에 들어서는 순간, 일상은 문 밖에 두고 오게 됩니다.
            깊은 베이스 사운드가 가슴을 울리고, 화려한 조명 아래 수백 명의 에너지가
            하나로 모이는 그 순간을 경험해 보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:010-5653-0069"
              className="bg-gradient-to-r from-gold to-gold-light text-dark font-bold px-8 py-4 rounded-full text-lg no-underline hover:scale-105 transition-transform"
            >
              춘자 전화하기
            </a>
            <Link
              to="/first-visit"
              className="border-2 border-gold text-gold px-8 py-4 rounded-full text-lg no-underline hover:bg-gold/10 transition-colors"
            >
              첫 방문 가이드
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            왜 <span className="gradient-text">이곳</span>인가요?
          </h2>
          <p className="text-gray-400 text-center mb-14 max-w-2xl mx-auto">
            울산에서 밤 문화를 즐기려는 분이라면, 한 번쯤 이 이름을 들어보셨을 겁니다.
            단순한 클럽이 아닌, 하나의 문화 공간으로 자리 잡은 이유가 있습니다.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎵',
                title: '라이브 사운드',
                desc: '매주 새로운 DJ 라인업과 라이브 밴드가 무대를 장악합니다. 울산 최고의 사운드 시스템으로 온몸이 떨리는 비트를 느껴보세요.',
              },
              {
                icon: '✨',
                title: '프리미엄 공간',
                desc: '넓은 댄스플로어부터 프라이빗 VIP 공간까지. 수백 명이 함께해도 답답하지 않은 여유로운 공간 설계가 돋보입니다.',
              },
              {
                icon: '🤝',
                title: '춘자의 환대',
                desc: '처음 오시는 분도 걱정 마세요. 춘자가 직접 맞이하며 최고의 자리와 서비스를 안내합니다. 편하게 전화 한 통이면 됩니다.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-dark-card border border-gold/10 rounded-2xl p-8 hover:border-gold/30 transition-colors"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-dark-light">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            오늘 밤, <span className="gradient-text">잊지 못할 경험</span>을 시작하세요
          </h2>
          <p className="text-gray-300 text-lg mb-10 leading-relaxed">
            금요일 밤 열한 시, 입구를 지나 계단을 내려가면 새로운 세계가 펼쳐집니다.
            천장까지 닿을 듯한 환호성, 레이저가 만들어내는 빛의 향연,
            그리고 내 옆의 낯선 사람과 눈이 마주치는 순간 — 이곳이 바로
            울산에서 가장 뜨거운 밤입니다. 망설이지 마세요. 춘자에게 전화 한 통이면
            최고의 밤이 준비됩니다.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/story" className="text-gold border border-gold/30 px-6 py-3 rounded-full no-underline hover:bg-gold/10 transition-colors">
              이야기 보기
            </Link>
            <Link to="/atmosphere" className="text-gold border border-gold/30 px-6 py-3 rounded-full no-underline hover:bg-gold/10 transition-colors">
              분위기 감상
            </Link>
            <Link to="/review" className="text-gold border border-gold/30 px-6 py-3 rounded-full no-underline hover:bg-gold/10 transition-colors">
              후기 읽기
            </Link>
          </div>
        </div>
      </section>

      <div className="pb-20" />
    </>
  )
}
