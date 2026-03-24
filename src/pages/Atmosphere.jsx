import SEO from '../components/SEO'

const scenes = [
  {
    title: '입구를 지나는 순간',
    desc: '두꺼운 문을 밀고 들어서면, 먼저 가슴을 치는 건 소리입니다. 밖에서는 상상할 수 없었던 깊은 베이스가 온몸을 감싸고, 어둠 속에서 반짝이는 조명이 시야를 채웁니다. 이곳만의 공기가 있습니다 — 약간의 긴장감, 거대한 기대감, 그리고 무엇이든 될 수 있다는 자유로움이 섞인 공기.',
    color: 'from-purple/30',
  },
  {
    title: '댄스플로어의 에너지',
    desc: '넓은 플로어 위에서 수백 명이 하나의 리듬에 몸을 맡깁니다. DJ가 비트를 올리면 환호성이 터지고, 조명이 빨간색에서 파란색으로 물들 때 사람들의 실루엣이 하나의 파도처럼 출렁입니다. 옆 사람과 눈이 마주치면 말 없이도 통합니다 — 지금 이 순간이 최고라는 것을.',
    color: 'from-gold/20',
  },
  {
    title: '라이브 밴드 무대',
    desc: '주말 특별 무대에서는 라이브 밴드가 등장합니다. 기타 리프가 공간을 가르고, 보컬의 샤우팅에 관객이 하나 되어 떼창을 합니다. 녹음된 음악과는 차원이 다른 생동감, 무대 위 뮤지션과 눈이 마주치는 찰나 — 이 경험은 오직 현장에서만 가능합니다.',
    color: 'from-purple-light/20',
  },
  {
    title: '조명이 만드는 세계',
    desc: '천장에서 쏟아지는 레이저 빔이 연기 사이를 가르며 기하학적 패턴을 그립니다. 스트로브 라이트가 순간을 정지시키고, 무빙헤드가 관객 사이를 훑을 때 마치 영화의 한 장면 속에 있는 듯합니다. 울산에서 이 정도 조명 시스템을 갖춘 곳은 손에 꼽습니다.',
    color: 'from-gold/30',
  },
  {
    title: 'VIP 라운지의 여유',
    desc: '댄스플로어의 열기에서 잠시 벗어나고 싶다면, VIP 라운지가 기다립니다. 편안한 소파에 앉아 아래를 내려다보면, 반짝이는 조명 아래 춤추는 사람들의 에너지가 한 폭의 그림처럼 펼쳐집니다. 프라이빗한 공간에서 소중한 사람과 특별한 시간을 보내기에 완벽합니다.',
    color: 'from-purple/20',
  },
  {
    title: '새벽, 마지막 곡이 흐를 때',
    desc: '시간은 빠르게 흐르고, 어느새 마지막 곡이 흘러나옵니다. 느린 템포의 음악에 몸을 맡기며, 오늘 밤의 순간들을 되새깁니다. 모르는 사람과 나눈 미소, 좋아하는 노래가 나왔을 때의 환호, 댄스플로어에서 느꼈던 자유 — 이 모든 것이 마지막 노트와 함께 기억으로 새겨집니다.',
    color: 'from-gold-light/20',
  },
]

export default function Atmosphere() {
  return (
    <>
      <SEO
        title="울산챔피언나이트 분위기 - 조명과 사운드가 만드는 감동"
        description="라이브 밴드, 레이저 조명, 뜨거운 댄스플로어. 울산 최고의 나이트클럽이 선사하는 감각적인 공간을 미리 만나보세요."
        path="/atmosphere"
      />

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold text-sm tracking-[0.3em] uppercase mb-4 text-center">Atmosphere</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-6">
            오감을 채우는 <span className="gradient-text">특별한 공간</span>
          </h1>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto text-lg">
            사진만으로는 전할 수 없는 공기가 있습니다. 그래도 한번 상상해 보세요.
          </p>

          <div className="space-y-8">
            {scenes.map((scene, i) => (
              <div
                key={scene.title}
                className={`relative bg-dark-card border border-gold/10 rounded-2xl p-8 md:p-10 overflow-hidden hover:border-gold/30 transition-colors`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${scene.color} to-transparent opacity-50`} />
                <div className="relative z-10">
                  <span className="text-gold/50 text-sm font-mono">0{i + 1}</span>
                  <h2 className="text-2xl font-bold text-white mt-2 mb-4">{scene.title}</h2>
                  <p className="text-gray-300 leading-relaxed text-lg">{scene.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="pb-20" />
    </>
  )
}
