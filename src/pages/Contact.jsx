import SEO from '../components/SEO'

export default function Contact() {
  return (
    <>
      <SEO
        title="울산챔피언나이트 연락처 - 전화 예약 문의"
        description="춘자에게 전화 한 통이면 모든 준비가 됩니다. 예약, 문의, 단체 상담까지 편하게 연락하세요."
        path="/contact"
      />

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold text-sm tracking-[0.3em] uppercase mb-4 text-center">Contact</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-6">
            <span className="gradient-text">연락</span>하세요
          </h1>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto text-lg">
            전화 한 통이면 최고의 밤이 준비됩니다.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <a
              href="tel:010-5653-0069"
              className="bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 rounded-2xl p-8 md:p-10 text-center no-underline hover:border-gold/50 transition-colors block"
            >
              <div className="text-5xl mb-4">📞</div>
              <h2 className="text-2xl font-bold text-white mb-2">춘자 전화</h2>
              <p className="text-gold text-2xl font-bold mb-4">010-5653-0069</p>
              <p className="text-gray-400 leading-relaxed">
                예약, 문의, 단체 상담 무엇이든 편하게 전화하세요.
                춘자가 직접 받고 최고의 방문을 준비해 드립니다.
              </p>
            </a>

            <a
              href="https://open.kakao.com/o/sBesta12"
              target="_blank"
              rel="noopener"
              className="bg-gradient-to-br from-purple/20 to-purple/5 border border-purple/30 rounded-2xl p-8 md:p-10 text-center no-underline hover:border-purple/50 transition-colors block"
            >
              <div className="text-5xl mb-4">💬</div>
              <h2 className="text-2xl font-bold text-white mb-2">카카오톡 문의</h2>
              <p className="text-purple-light text-2xl font-bold mb-4">besta12</p>
              <p className="text-gray-400 leading-relaxed">
                광고 문의, 제휴 상담은 카카오톡으로 편하게 연락주세요.
                빠른 시간 내에 답변드리겠습니다.
              </p>
            </a>
          </div>

          <div className="bg-dark-card border border-gold/10 rounded-2xl p-8 md:p-10 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">이런 상황에 전화하세요</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { icon: '🎉', title: '생일 / 기념일 파티', desc: '특별한 날에 맞춤 세팅과 이벤트를 준비해 드립니다.' },
                { icon: '👥', title: '단체 예약', desc: '회식, 동창회, 동호회 모임 등 인원에 맞는 공간을 마련합니다.' },
                { icon: '🆕', title: '첫 방문 안내', desc: '처음이라 걱정되시면 전화 주세요. 상세히 안내해 드립니다.' },
                { icon: '⭐', title: 'VIP 예약', desc: '최고의 자리에서 프리미엄 서비스를 경험하고 싶으시다면.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <span className="text-3xl shrink-0">{item.icon}</span>
                  <div>
                    <h3 className="text-white font-bold mb-1">{item.title}</h3>
                    <p className="text-gray-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-gold/10 to-purple/10 border border-gold/20 rounded-2xl p-8 md:p-10 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">더 많은 업소 정보를 찾으시나요?</h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              울산 지역의 다양한 업소 정보를 한곳에서 확인하세요.
              검증된 업소만 엄선하여 소개하는 플랫폼입니다.
            </p>
            <a
              href="https://bamkey.com"
              target="_blank"
              rel="noopener"
              className="inline-block bg-gradient-to-r from-gold to-gold-light text-dark font-bold px-10 py-4 rounded-full text-lg no-underline hover:scale-105 transition-transform"
            >
              밤키에서 확인하기
            </a>
          </div>
        </div>
      </section>

      <div className="pb-20" />
    </>
  )
}
