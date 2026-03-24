import SEO from '../components/SEO'

export default function Access() {
  return (
    <>
      <SEO
        title="울산챔피언나이트 오시는 길 - 교통 주차 지하철 완벽 안내"
        description="울산 남구 위치. 자가용, 지하철, 택시 이용 방법과 주차 정보를 상세히 안내합니다."
        path="/access"
      />

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold text-sm tracking-[0.3em] uppercase mb-4 text-center">Access</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-6">
            <span className="gradient-text">쉽고 편하게</span> 오시는 길
          </h1>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto text-lg">
            울산 도심에 위치해 어디서든 접근이 편리합니다. 아래 안내를 참고하세요.
          </p>

          <div className="space-y-8">
            <div className="bg-dark-card border border-gold/10 rounded-2xl p-8 md:p-10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-3xl">🚗</span> 자가용으로 오시는 분
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  네비게이션에 "울산챔피언나이트"를 검색하시면 정확한 위치가 안내됩니다.
                  울산IC에서 약 15분 거리에 위치하고 있으며, 삼산동 번화가 중심부에 자리잡고 있어
                  찾기 어렵지 않습니다.
                </p>
                <p>
                  주차는 건물 내 주차장과 인근 공영 주차장을 이용하실 수 있습니다.
                  주말 밤에는 주차 공간이 빠르게 차오르니, 가능하면 일찍 오시거나 대중교통을 이용하시는 것을
                  추천합니다. 인근에 유료 주차장도 여러 곳 있어 주차 걱정은 크게 하지 않으셔도 됩니다.
                </p>
              </div>
            </div>

            <div className="bg-dark-card border border-gold/10 rounded-2xl p-8 md:p-10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-3xl">🚇</span> 대중교통 이용 안내
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  울산 시내버스를 이용하시면 삼산동 정류장에서 하차 후 도보 5분 이내입니다.
                  주요 노선이 대부분 경유하는 구간이라 접근성이 뛰어납니다.
                </p>
                <p>
                  울산역(KTX)에서 오시는 경우, 역 앞에서 택시를 이용하면 약 20분 정도 소요됩니다.
                  택시비는 부담 없는 수준이며, 기사님께 "삼산동 챔피언"이라고 말씀하시면
                  대부분 아시는 곳입니다.
                </p>
                <p>
                  태화강역에서 출발하시면 택시로 약 10분, 버스로는 15분 정도면 도착합니다.
                </p>
              </div>
            </div>

            <div className="bg-dark-card border border-gold/10 rounded-2xl p-8 md:p-10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-3xl">🚕</span> 택시 및 대리운전
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  음주 후에는 반드시 대리운전이나 택시를 이용해주세요. 건물 앞은 택시 잡기가
                  수월한 위치입니다. 카카오택시, 타다 등 호출 서비스도 원활하게 이용 가능합니다.
                </p>
                <p>
                  울산 지역 대리운전은 보통 기본요금이 합리적이며, 새벽 시간에도 호출이 잘 됩니다.
                  미리 대리운전 앱을 설치해두시면 편리합니다. 스태프에게 말씀하시면
                  대리운전 연결도 도와드립니다.
                </p>
              </div>
            </div>

            <div className="bg-dark-card border border-gold/10 rounded-2xl p-8 md:p-10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-3xl">📍</span> 주변 편의시설
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  삼산동 번화가 중심에 위치해 편의점, 카페, 식당이 도보 거리에 즐비합니다.
                  방문 전 식사를 하시거나 방문 후 해장을 하기에도 좋은 환경입니다.
                  인근 호텔과 모텔도 다수 있어, 먼 곳에서 오시는 분들은 숙소를 잡고
                  부담 없이 즐기실 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center bg-dark-card border border-gold/20 rounded-2xl p-8">
            <p className="text-gray-300 text-lg mb-4">찾아오시는 길이 헷갈리시면</p>
            <a
              href="tel:010-5653-0069"
              className="inline-block bg-gradient-to-r from-gold to-gold-light text-dark font-bold px-10 py-4 rounded-full text-lg no-underline hover:scale-105 transition-transform"
            >
              춘자에게 전화하기 010-5653-0069
            </a>
          </div>
        </div>
      </section>

      <div className="pb-20" />
    </>
  )
}
