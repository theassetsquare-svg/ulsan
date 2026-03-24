import SEO from '../components/SEO'

export default function Story() {
  return (
    <>
      <SEO
        title="울산챔피언나이트 이야기 - 역사와 전통이 만든 특별한 밤"
        description="울산의 밤 문화를 이끌어온 전통과 역사. 매일 밤 새로운 추억이 탄생하는 공간의 이야기를 들어보세요."
        path="/story"
      />

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold text-sm tracking-[0.3em] uppercase mb-4 text-center">Our Story</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-6">
            어둠 속에서 <span className="gradient-text">빛나는 이야기</span>
          </h1>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto text-lg">
            단순한 유흥 공간이 아닙니다. 이곳은 울산의 밤을 책임져 온 살아있는 역사입니다.
          </p>

          <div className="space-y-12">
            <article className="bg-dark-card border border-gold/10 rounded-2xl p-8 md:p-10">
              <h2 className="text-2xl font-bold text-white mb-4">시작 — 울산 밤의 새 장을 열다</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                울산의 밤 문화가 형성되던 시절부터, 이 공간은 존재했습니다. 처음에는 작은 무대 하나와
                DJ 부스가 전부였지만, 그 안에서 만들어지는 에너지는 이미 남달랐습니다.
                퇴근 후 지친 몸을 이끌고 찾아오는 직장인부터, 주말을 기다려온 젊은이들까지 —
                이 문을 열고 들어서는 순간, 모두가 하나의 리듬 속에 녹아들었습니다.
              </p>
              <p className="text-gray-300 leading-relaxed">
                사운드 시스템을 울산에서 가장 먼저 대규모로 도입한 곳이기도 합니다.
                바닥을 울리는 베이스, 천장에서 쏟아지는 조명 — 첫 방문객들은 하나같이
                "이런 곳이 울산에 있었나"라고 놀라워했습니다.
              </p>
            </article>

            <article className="bg-dark-card border border-gold/10 rounded-2xl p-8 md:p-10">
              <h2 className="text-2xl font-bold text-white mb-4">성장 — 입소문이 만든 전설</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                특별한 광고 없이도 사람들은 모여들었습니다. "울산에서 밤에 갈 곳? 거기밖에 없지"라는
                말이 자연스럽게 퍼졌고, 주말이면 줄을 서야 입장할 수 있을 만큼 인기를 끌었습니다.
                부산이나 대구에서 일부러 찾아오는 손님도 적지 않았습니다.
              </p>
              <p className="text-gray-300 leading-relaxed">
                비결은 단 하나 — 오는 사람을 실망시키지 않는 것이었습니다. 매주 새로운 이벤트를
                기획하고, DJ들은 그날의 분위기를 읽어 선곡을 바꾸며, 스태프 모두가 손님 한 분 한 분에게
                최고의 밤을 선사하기 위해 움직였습니다. 이런 노력이 쌓여 울산의 아이콘이 되었습니다.
              </p>
            </article>

            <article className="bg-dark-card border border-gold/10 rounded-2xl p-8 md:p-10">
              <h2 className="text-2xl font-bold text-white mb-4">지금 — 매일 밤 새로운 전설이 됩니다</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                세월이 흘러도 변하지 않는 것이 있습니다. 문을 여는 순간 느껴지는 설렘,
                댄스플로어에서 온몸을 맡기는 해방감, 새벽 세 시에 밖으로 나오며 느끼는 아쉬움 —
                이 모든 감정이 오늘도 이곳에서 반복됩니다.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                춘자는 변함없이 입구에서 손님을 맞이합니다. "어서 와요, 오늘도 즐기다 가세요"라는
                한마디에 긴장이 풀리고, 처음인 사람도 단골처럼 편안해집니다.
                이것이 수년간 사랑받아 온 진짜 이유입니다.
              </p>
              <p className="text-gray-300 leading-relaxed">
                울산의 밤 하면 떠오르는 바로 그곳. 직접 경험해야만 알 수 있는 이 에너지를
                오늘 밤 느껴보시기 바랍니다. 춘자에게 전화 한 통이면, 여러분만의 이야기가 시작됩니다.
              </p>
            </article>
          </div>
        </div>
      </section>

      <div className="pb-20" />
    </>
  )
}
