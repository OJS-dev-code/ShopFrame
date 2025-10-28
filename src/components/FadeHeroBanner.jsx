import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./FadeHeroBanner.scss";

/**
 * FadeHeroBanner
 * - 3초 자동 슬라이드
 * - 왼쪽 아래 텍스트 클릭 시 해당 이미지로 전환
 * - 가운데 SHOP NOW 버튼은 얇은 보더 스타일 + 지속 플립
 */
export default function FadeHeroBanner({
  // ✅ 이미지 3개 사용
  slides = [
    { title: "PROMOTION 01", img: "/images/kv1.jpg", link: "#", navText: "PROMOTION 01", categoryId: null },
    { title: "PROMOTION 02", img: "/images/kv2.jpg", link: "#", navText: "PROMOTION 02", categoryId: null },
    { title: "PROMOTION 03", img: "/images/kv3.jpg", link: "#", navText: "PROMOTION 03", categoryId: null },
  ],
  interval = 3000,
  pauseOnHover = true,
  flipDuration = 2400,
}) {
  const safeSlides = useMemo(() => {
    console.log('FadeHeroBanner received slides:', slides);
    // SiteContext에서 받은 데이터 구조에 맞게 변환
    const processedSlides = slides.map((slide, index) => ({
      title: slide.navText || `PROMOTION ${String(index + 1).padStart(2, "0")}`,
      img: slide.img ? encodeURI(slide.img) : "",
      link: "#",
      navText: slide.navText || `PROMOTION ${String(index + 1).padStart(2, "0")}`,
      categoryId: slide.categoryId || null
    }));
    console.log('FadeHeroBanner processed slides:', processedSlides);
    return processedSlides.filter(s => !!s.img).slice(0, 3);
  }, [slides]); // ◀︎ 3개 사용
  const [idx, setIdx] = useState(0)
  const timerRef = useRef(null);
  const progressRef = useRef(null);
  const rootRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!safeSlides.length) return;
    startAuto();

    // 키보드 전환(선택사항)
    const onKey = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.matches(":hover, :focus-within")) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      stopAuto();
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, interval, safeSlides.length]);

  function startAuto() {
    stopAuto();
    if (safeSlides.length <= 1) return;
    timerRef.current = setInterval(next, interval);
    restartProgress();
  }
  function stopAuto() {
    if (timerRef.current) clearInterval(timerRef.current);
  }
  function restartProgress() {
    const bar = progressRef.current;
    if (!bar) return;
    bar.style.transition = "none";
    bar.style.width = "0%";
    void bar.offsetWidth; // 리플로우
    bar.style.transition = `width ${interval}ms linear`;
    bar.style.width = "100%";
  }

  function goto(i) {
    const n = safeSlides.length;
    if (!n) return;
    const nextIdx = ((i % n) + n) % n;
    setIdx(nextIdx);
  }
  function next() { goto(idx + 1); }
  function prev() { goto(idx - 1); }
  
  function handleCategoryClick(categoryId) {
    if (categoryId) {
      navigate(`/category/${categoryId}`);
    }
  }

  const handleMouseEnter = () => { if (pauseOnHover) stopAuto(); };
  const handleMouseLeave = () => { if (pauseOnHover) startAuto(); };

  if (!safeSlides.length) return null;

  // 왼쪽 하단 라벨은 슬라이드 데이터에서 navText를 가져오거나 기본값 사용
  const labels = safeSlides.map((slide, index) => 
    slide.navText || `PROMOTION ${String(index + 1).padStart(2, "0")}`
  );

  return (
    <section
      className="hero-slider"
      ref={rootRef}
      aria-roledescription="carousel"
      aria-label="Hero Promotion"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="slides">
        {safeSlides.map((s, i) => (
          <div
            key={i}
            className={`slide ${i === idx ? "is-active" : ""}`}
            style={{ "--bg": `url("${s.img}")` }}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${safeSlides.length}: ${labels[i] || s.title}`}
          >
            <a
              className="shop-now"
              href={s.link || "#"}
              aria-label={`${labels[i] || s.title} - Shop now`}
              style={{ "--flipDur": `${flipDuration}ms` }}
              onClick={(e) => {
                if (s.categoryId) {
                  e.preventDefault();
                  handleCategoryClick(s.categoryId);
                }
              }}
            >
              SHOP NOW
            </a>
          </div>
        ))}
      </div>

      {/* 왼쪽 아래 텍스트 네비게이션 (3개 라벨) */}
      <nav className="slide-nav" aria-label="Slide titles">
        {safeSlides.map((slide, i) => (
          <button
            key={i}
            type="button"
            className={`nav-item ${i === idx ? "is-active" : ""}`}
            onClick={() => {
              goto(i);
              if (slide.categoryId) {
                handleCategoryClick(slide.categoryId);
              }
            }}
          >
            {labels[i] ?? `PROMOTION ${String(i + 1).padStart(2, "0")}`}
          </button>
        ))}
      </nav>

      {/* 진행바 */}
      <div className="progress" aria-hidden="true">
        <span ref={progressRef}></span>
      </div>

      {/* 좌/우 보조 컨트롤(그대로 유지) */}
      <div className="ctrl" aria-hidden="true">
        <button type="button" className="ctrl-btn" onClick={prev}>‹</button>
        <button type="button" className="ctrl-btn" onClick={next}>›</button>
      </div>
    </section>
  );
}