import SEO from '../components/SEO'

const reviews = [
  {
    name: '김성준',
    age: '30대',
    rating: 5,
    text: '울산 토박이인데 여기만큼 분위기 좋은 곳 없습니다. 금요일 밤에 갔는데 DJ 선곡이 미쳤어요. 사운드 시스템이 진짜 다른 차원이라 온몸으로 음악을 느꼈습니다. 춘자 언니가 자리 잘 잡아줘서 편하게 놀다 왔어요.',
  },
  {
    name: '이수빈',
    age: '20대',
    rating: 5,
    text: '부산에서 일부러 왔는데 오길 정말 잘했어요. 조명이 진짜 예술이고 댄스플로어가 넓어서 답답한 느낌이 하나도 없었습니다. 처음 가는 곳이라 긴장했는데 직원분들이 친절해서 금방 적응했어요. 다음 달에 또 갈 예정입니다.',
  },
  {
    name: '박준혁',
    age: '40대',
    rating: 5,
    text: '회식 2차로 갔다가 단골이 되었습니다. 동료들 데리고 가면 다들 만족해요. VIP 테이블 예약하면 서비스가 정말 좋습니다. 춘자 사장님한테 미리 전화하면 세팅을 깔끔하게 해주셔서 접대 장소로도 손색없어요.',
  },
  {
    name: '최유나',
    age: '20대',
    rating: 5,
    text: '여자 혼자 가도 되나 걱정했는데 전혀 불편하지 않았어요. 분위기가 건전하고 스태프가 항상 신경 써주더라고요. 음악 좋고 인테리어도 세련됐고, 무엇보다 춤추기 좋은 공간이라 매주 가고 싶습니다.',
  },
  {
    name: '정태호',
    age: '30대',
    rating: 5,
    text: '생일 파티를 여기서 했는데 인생 최고의 생일이었습니다. 춘자 언니가 깜짝 이벤트도 준비해주시고, 케이크까지 세팅해주셨어요. 친구들 모두 감동받았고 다음 생일도 여기서 하자고 난리입니다.',
  },
  {
    name: '한소영',
    age: '30대',
    rating: 4,
    text: '라이브 밴드 나오는 날 갔는데 정말 대박이었어요. 클럽에서 밴드 공연을 볼 수 있다니 신선했고, 관객이 하나 되어 떼창하는 분위기가 소름 돋았습니다. 주말에는 일찍 가는 게 좋을 것 같아요, 조금 늦게 갔더니 줄이 있었어요.',
  },
  {
    name: '오민수',
    age: '20대',
    rating: 5,
    text: '서울 클럽 많이 다녀봤는데 여기 사운드 시스템은 서울 유명 클럽과 비교해도 밀리지 않습니다. 베이스가 가슴을 치는 느낌이 진짜 살아있어요. 울산 출장 올 때마다 무조건 들르는 곳이 되었습니다.',
  },
  {
    name: '임하은',
    age: '20대',
    rating: 5,
    text: '대학 졸업 기념으로 친구 8명이서 갔어요. 단체석 예약하니까 넓은 테이블에 세팅이 완벽했고, 밤새 춤추고 웃고 정말 행복한 밤이었어요. 졸업 여행보다 이날이 더 기억에 남을 것 같아요.',
  },
  {
    name: '강동원',
    age: '40대',
    rating: 5,
    text: '오래전부터 다녔는데 세월이 지나도 퀄리티가 떨어지지 않는 게 대단합니다. 오히려 시설은 계속 업그레이드되고 있어요. 울산 밤 문화의 자존심 같은 곳입니다. 초보자든 단골이든 누구나 만족할 수 있는 곳이에요.',
  },
  {
    name: '윤서진',
    age: '30대',
    rating: 5,
    text: '남편이랑 기념일에 갔는데 분위기가 너무 좋아서 연애할 때로 돌아간 것 같았어요. VIP 자리에서 와인 한 잔 하면서 아래 댄스플로어 보는 뷰가 환상적이었습니다. 결혼해도 이런 데이트 할 수 있다니, 남편한테 고마웠어요.',
  },
]

export default function Review() {
  return (
    <>
      <SEO
        title="울산챔피언나이트 방문 후기 - 실제 방문자들의 생생한 경험담"
        description="직접 방문한 분들의 솔직한 후기. 사운드, 분위기, 서비스까지 생생한 경험담을 확인하세요."
        path="/review"
      />

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold text-sm tracking-[0.3em] uppercase mb-4 text-center">Reviews</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-6">
            직접 다녀온 분들의 <span className="gradient-text">솔직한 이야기</span>
          </h1>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto text-lg">
            광고보다 강력한 건 경험자의 한마디입니다.
          </p>

          <div className="space-y-6">
            {reviews.map((review, i) => (
              <div key={i} className="bg-dark-card border border-gold/10 rounded-2xl p-8 hover:border-gold/30 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-white font-bold">{review.name}</span>
                    <span className="text-gray-500 ml-2 text-sm">{review.age}</span>
                  </div>
                  <div className="text-gold text-sm">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="pb-20" />
    </>
  )
}
