import SEO from '../components/SEO'
import { useState } from 'react'

const faqs = [
  {
    q: '영업시간이 어떻게 되나요?',
    a: '매일 저녁 8시부터 새벽까지 영업합니다. 금요일과 토요일에는 더 늦게까지 운영되며, 특별 이벤트가 있는 날에는 시간이 변동될 수 있습니다. 정확한 영업시간은 춘자에게 전화로 확인하시는 것이 가장 정확합니다.',
  },
  {
    q: '예약 없이 바로 방문해도 되나요?',
    a: '물론 예약 없이도 방문 가능합니다. 다만 금요일, 토요일 밤에는 대기가 있을 수 있으므로, 원활한 입장을 위해 미리 춘자에게 전화(010-5653-0069)하시는 것을 권장합니다. 예약하시면 좋은 자리를 미리 확보해 드립니다.',
  },
  {
    q: '혼자 가도 괜찮을까요?',
    a: '전혀 문제없습니다. 혼자 오시는 분들도 많으며, 음악과 분위기에 빠지다 보면 혼자 온 것이 전혀 어색하지 않습니다. 바 카운터에 앉아 음료를 즐기셔도 좋고, 댄스플로어에서 자유롭게 즐기셔도 됩니다. 스태프가 항상 신경 써드리니 편하게 오세요.',
  },
  {
    q: '주차는 어디에 하나요?',
    a: '건물 내 주차장과 인근 공영 주차장을 이용하실 수 있습니다. 주말 밤에는 주차 공간이 빨리 차므로 일찍 오시거나 대중교통 이용을 추천합니다. 인근에 유료 주차장도 여러 곳 있어 주차 걱정은 크게 하지 않으셔도 됩니다.',
  },
  {
    q: 'VIP 테이블은 어떻게 예약하나요?',
    a: '춘자에게 전화(010-5653-0069)로 예약하시면 됩니다. 인원수와 원하시는 시간을 말씀해주시면 최적의 자리를 준비해 드립니다. 생일 파티, 회식, 기념일 등 특별한 자리에 맞춤 세팅도 가능하니 편하게 상담하세요.',
  },
  {
    q: '복장 규정이 있나요?',
    a: '엄격한 드레스코드는 없지만, 단정한 복장을 권장합니다. 슬리퍼, 운동복, 반바지 등은 입장이 제한될 수 있습니다. 캐주얼 정장이나 깔끔한 캐주얼이면 충분합니다. 편한 신발을 신으시면 밤새 춤추기에 좋습니다.',
  },
  {
    q: '연령 제한이 있나요?',
    a: '만 19세 이상 성인만 입장 가능합니다. 입장 시 신분증 확인을 할 수 있으니, 신분증을 꼭 지참해주세요. 주민등록증, 운전면허증, 여권 모두 가능합니다.',
  },
  {
    q: '단체 방문도 가능한가요?',
    a: '물론입니다. 4인 이상 단체부터 수십 명 규모의 단체 예약까지 모두 가능합니다. 회식, 동창회, 생일 파티, 팀 회식 등 다양한 목적의 단체 모임을 환영합니다. 사전에 춘자에게 연락하시면 인원에 맞는 공간과 세팅을 준비해 드립니다.',
  },
  {
    q: '어떤 음악을 주로 틀어주나요?',
    a: '최신 K-POP, 팝, EDM, 힙합부터 90년대 레트로, 트로트 메들리까지 다양한 장르를 소화합니다. 전문 DJ가 그날의 분위기를 읽어 선곡하며, 주말에는 라이브 밴드 공연이 진행되기도 합니다. 요청곡도 받으니 편하게 말씀하세요.',
  },
  {
    q: '카드 결제 가능한가요?',
    a: '네, 모든 신용카드와 체크카드 결제가 가능합니다. 카카오페이, 네이버페이 등 간편결제도 지원합니다. 현금도 물론 사용 가능합니다.',
  },
  {
    q: '춘자가 누구인가요?',
    a: '춘자는 이곳을 찾는 모든 손님을 가족처럼 맞이하는 분입니다. 처음 오시는 분에게는 편안한 안내를, 단골에게는 반가운 인사를 건네며 모든 분이 최고의 밤을 보낼 수 있도록 세심하게 챙깁니다. 궁금한 것이 있으시면 언제든 010-5653-0069로 전화하세요.',
  },
]

function FaqItem({ faq }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gold/10 rounded-2xl overflow-hidden hover:border-gold/30 transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 md:p-8 bg-dark-card text-left cursor-pointer border-none"
      >
        <span className="text-white font-bold text-lg pr-4">{faq.q}</span>
        <span className="text-gold text-2xl shrink-0">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-6 md:px-8 pb-6 md:pb-8 bg-dark-card">
          <p className="text-gray-300 leading-relaxed">{faq.a}</p>
        </div>
      )}
    </div>
  )
}

export default function Faq() {
  return (
    <>
      <SEO
        title="울산챔피언나이트 자주 묻는 질문 - 궁금한 점 총정리"
        description="영업시간, 예약, 주차, 복장 규정까지. 방문 전 궁금한 모든 점을 한곳에서 확인하세요."
        path="/faq"
      />

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold text-sm tracking-[0.3em] uppercase mb-4 text-center">FAQ</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-6">
            자주 묻는 <span className="gradient-text">질문</span>
          </h1>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto text-lg">
            방문 전 궁금한 점이 있으시면 아래에서 확인하세요.
          </p>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <FaqItem key={i} faq={faq} />
            ))}
          </div>

          <div className="mt-16 text-center bg-dark-card border border-gold/20 rounded-2xl p-8">
            <p className="text-gray-300 text-lg mb-2">여기에 없는 질문이 있으시면</p>
            <p className="text-gray-400 mb-6">춘자가 직접 답변해 드립니다</p>
            <a
              href="tel:010-5653-0069"
              className="inline-block bg-gradient-to-r from-gold to-gold-light text-dark font-bold px-10 py-4 rounded-full text-lg no-underline hover:scale-105 transition-transform"
            >
              전화 문의하기
            </a>
          </div>
        </div>
      </section>

      <div className="pb-20" />
    </>
  )
}
