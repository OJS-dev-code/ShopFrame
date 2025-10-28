import { useRef, useState, useContext } from "react";
import "./NumberedProgressSlider.scss";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { SiteContext } from "../context/SiteContext";

/* ⚠ 이미지 경로에 공백/괄호가 있으면 브라우저가 못 읽을 수 있어
   → encodeURI로 안전하게 변환 (or 파일명을 하이픈으로 변경)
*/
const u = (p) => encodeURI(p);

export default function NumberedProgressSlider({ slides: slidesProp }) {
  const { siteData } = useContext(SiteContext);
  const raw = (slidesProp && Array.isArray(slidesProp) ? slidesProp : siteData.sliderImages?.NumberedProgressSlider) || [
    { id: 1, img: "/images/banner1.png", alt: "배너 1" },
    { id: 2, img: "/images/banner2.png", alt: "배너 2" },
    { id: 3, img: "/images/banner3.png", alt: "배너 3" },
  ];
  
  console.log('NumberedProgressSlider - slidesProp:', slidesProp);
  console.log('NumberedProgressSlider - siteData.sliderImages?.NumberedProgressSlider:', siteData.sliderImages?.NumberedProgressSlider);
  console.log('NumberedProgressSlider - raw:', raw);
  const LEFT_BANNERS = raw
    .map((b, i) => ({ id: b.id || i + 1, img: b.img ? u(b.img) : "", alt: b.alt || `배너 ${i + 1}` }))
    .filter((b) => !!b.img);

  const bannerRef = useRef(null);
  const barRef = useRef(null);
  const [bIndex, setBIndex] = useState(0);
  const total = LEFT_BANNERS.length;
  
  // 프로그레스바 계산
  const progressPercentage = ((bIndex + 1) / total) * 100;

  return (
    <section className="sec01 container">
      <div className="sec01-grid">
        {/* LEFT → 모바일에선 최상단 가로형 */}
        <aside className="left-banner">
          <Swiper
            key={`numbered-progress-${LEFT_BANNERS.length}-${LEFT_BANNERS[0]?.id || 'default'}`}
            className="banner-swiper"
            modules={[Autoplay]}
            slidesPerView={1}
            loop={total > 1}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            onSwiper={(sw) => (bannerRef.current = sw)}
            onSlideChange={(sw) => setBIndex(sw.realIndex)}
          >
            {LEFT_BANNERS.map((b) => (
              <SwiperSlide key={b.id}>
                <img
                  src={b.img}
                  alt={b.alt}
                  loading="eager"
                  onError={(e) => { e.currentTarget.src = u('/images/banner1.png'); }}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="banner-bottom">
            <button className="bb-nav prev" type="button" aria-label="Prev" onClick={() => bannerRef.current?.slidePrev()}>
              ‹
            </button>
            <div className="bb-fraction" aria-live="polite" aria-atomic="true">
              {String(bIndex + 1).padStart(2, "0")}
              <span className="sep"> | </span>
              {String(total).padStart(2, "0")}
            </div>
            <button className="bb-nav next" type="button" aria-label="Next" onClick={() => bannerRef.current?.slideNext()}>
              ›
            </button>
          </div>
          <div className="bb-track">
            <div 
              className="bb-bar" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </aside>
      </div>
    </section>
  );
}
