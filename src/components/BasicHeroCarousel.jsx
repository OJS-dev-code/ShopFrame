// src/components/BasicHeroCarousel.jsx
import { useContext, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./BasicHeroCarousel.scss";
import { SiteContext } from "../context/SiteContext";

export default function BasicHeroCarousel({ slides: slidesProp }) {
  const { siteData } = useContext(SiteContext);
  const swiperRef = useRef(null);
  
  const rawSlides = slidesProp || siteData.sliderImages?.BasicHeroCarousel || [
    { id: 1, img: "/images/kv1.jpg", alt: "슬라이드 1" },
    { id: 2, img: "/images/kv2.jpg", alt: "슬라이드 2" },
    { id: 3, img: "/images/kv3.png", alt: "슬라이드 3" },
  ];
  
  const slides = rawSlides.filter((s) => s && s.img);
    
  
  // Swiper 강제 재초기화
  useEffect(() => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.update();
      swiperRef.current.swiper.slideTo(0, 0);
    }
  }, [slides]);
  return (
    <section className="hero-slider" aria-label="메인 프로모션 슬라이더">
      <Swiper
        ref={swiperRef}
        key={`basic-hero-${slides.length}-${slides.map(s => s.id).join('-')}-${Date.now()}`}
        modules={[Navigation, Pagination, Autoplay]}
        className="hero-swiper"
        loop={true}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        spaceBetween={0}
        slidesPerView={1}
      >
        {slides.map((s) => (
          <SwiperSlide key={s.id}>
            <div className="slide-bg">
              <img
                src={s.img}
                alt={`${s.alt || '슬라이드'} - ID: ${s.id}`}
                onError={(e) => {
                  e.currentTarget.src = "/images/kv1.jpg";
                }}
              />
              <div className="overlay" />
            </div>

            <div className="hero-copy">
              <p className="kicker">{s.kicker}</p>
              <h2 className="title">{s.title}</h2>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}