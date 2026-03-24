import SEO from '../components/SEO'
import { Link } from 'react-router-dom'

const tips = [
  {
    step: '01',
    title: '먼저 춘자에게 전화하세요',
    desc: '전화 한 통이면 절반은 해결됩니다. 춘자가 그날의 상황, 추천 시간대, 좋은 자리를 미리 안내해 드립니다. 예약을 잡아두면 줄 서지 않고 바로 입장할 수 있어 편리합니다. 010-5653-0069로 전화하세요.',
  },
  {
    step: '02',
    title: '복장은 단정하게, 분위기는 자유롭게',
    desc: '특별한 드레스코드는 없지만, 깔끔한 복장을 추천합니다. 슬리퍼나 운동복은 입장이 제한될 수 있습니다. 캐주얼 정장, 깔끔한 청바지에 셔츠 정도면 충분합니다. 편한 신발이 좋습니다 — 밤새 춤출 준비를 하셔야 하니까요.',
  },
  {
    step: '03',
    title: '적절한 시간에 도착하세요',
    desc: '금요일과 토요일은 밤 10시부터 사람이 모이기 시작합니다. 편하게 자리를 잡고 싶다면 10시 전에 도착하는 것을 권합니다. 본격적인 분위기는 자정 무렵 절정에 이릅니다. 평일은 비교적 여유로워 처음 방문하기에 오히려 좋습니다.',
  },
  {
    step: '04',
    title: '입장 후 이렇게 즐기세요',
    desc: '입구에서 춘자나 스태프가 자리를 안내합니다. 먼저 바에서 음료를 주문하고 분위기를 살펴보세요. 음악에 몸이 반응하기 시작하면, 자연스럽게 댄스플로어로 나가면 됩니다. 혼자 와도 전혀 어색하지 않습니다 — 음악이 모두를 하나로 만들어 주니까요.',
  },
  {
    step: '05',
    title: '귀중품과 소지품 관리',
    desc: '물품 보관 서비스를 이용하세요. 가벼운 차림으로 댄스플로어를 즐기는 것이 훨씬 자유롭습니다. 큰 가방보다는 작은 크로스백이나 주머니에 들어가는 정도의 소지품만 가져오는 것을 추천합니다.',
  },
  {
    step: '06',
    title: '함께 오면 더 즐겁습니다',
    desc: '물론 혼자 와도 충분히 재미있지만, 친구나 동료와 함께 오면 VIP 테이블에서 더 풍성한 시간을 보낼 수 있습니다. 4인 이상 단체라면 춘자에게 미리 연락해 특별 세팅을 부탁해 보세요. 생일 파티, 회식 후 2차 장소로도 인기가 높습니다.',
  },
  {
    step: '07',
    title: '돌아가는 길도 안전하게',
    desc: '새벽에는 대리운전이나 택시를 이용하세요. 건물 앞에서 택시 잡기가 수월합니다. 대리운전 번호를 미리 저장해두면 편합니다. 울산역이나 주요 호텔까지의 택시비도 부담 없는 수준이니, 마음 편히 즐기고 안전하게 귀가하세요.',
  },
]

export default function FirstVisit() {
  return (
    <>
      <SEO
        title="울산챔피언나이트 첫방문 가이드 - 처음이라도 걱정 없는 완벽 안내"
        description="처음 방문하시나요? 복장, 시간, 입장 방법까지 완벽 정리. 춘자에게 전화하면 모든 준비가 끝납니다."
        path="/first-visit"
      />

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold text-sm tracking-[0.3em] uppercase mb-4 text-center">First Visit Guide</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-6">
            처음이라면 <span className="gradient-text">이것만 알면 됩니다</span>
          </h1>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto text-lg">
            어려운 것은 하나도 없습니다. 전화 한 통이면 나머지는 저희가 준비합니다.
          </p>

          <div className="space-y-6">
            {tips.map((tip) => (
              <div key={tip.step} className="bg-dark-card border border-gold/10 rounded-2xl p-8 hover:border-gold/30 transition-colors flex gap-6">
                <span className="text-gold/30 text-4xl font-bold font-mono shrink-0">{tip.step}</span>
                <div>
                  <h2 className="text-xl font-bold text-white mb-3">{tip.title}</h2>
                  <p className="text-gray-300 leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-gray-400 mb-6 text-lg">준비되셨나요? 춘자가 기다리고 있습니다.</p>
            <a
              href="tel:010-5653-0069"
              className="inline-block bg-gradient-to-r from-gold to-gold-light text-dark font-bold px-10 py-4 rounded-full text-lg no-underline hover:scale-105 transition-transform"
            >
              춘자에게 전화하기
            </a>
          </div>
        </div>
      </section>

      <div className="pb-20" />
    </>
  )
}
