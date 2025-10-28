import React, { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { SiteContext } from "../context/SiteContext";
import "./ProductList2.scss";

const ProductList2 = ({ 
  products = [], 
  onAddToCart = () => {}, 
  onToggleLike = () => {},
  likedProducts = new Set(),
  showPagination = true,
  currentPage = 1,
  onPageChange = () => {},
  useSlider = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { productBadges } = useContext(SiteContext);

  // 홈 페이지인지 카테고리 페이지인지 확인
  const isHomePage = location.pathname.includes('/home') || location.pathname.endsWith('/') || !location.pathname.includes('/category');
  const isCategoryPage = location.pathname.includes('/category');
  
  // 홈에서는 2줄(8개), 카테고리에서는 5줄(20개) 표시
  const itemsPerRow = 4;
  const rowsPerPage = isHomePage ? 2 : 5;
  const itemsPerPage = itemsPerRow * rowsPerPage;

  // 뱃지 정보 가져오기
  const getProductBadges = (product) => {
    if (!product.badges || !Array.isArray(product.badges)) return [];
    return (productBadges || []).filter(badge => product.badges.includes(badge.id));
  };

  // 페이지네이션 처리
  const handlePageChange = (page) => {
    if (onPageChange) {
      onPageChange(page);
    } else {
      // URL 쿼리로 페이지 변경
      const searchParams = new URLSearchParams(location.search);
      searchParams.set("page", page.toString());
      navigate({ pathname: location.pathname, search: searchParams.toString() });
    }
  };

  // 상품 데이터 처리
  const processedProducts = products.map(product => ({
    ...product,
    // 기본값 설정
    discount: product.discountPercent || 0,
    base: product.price || 0,
    price: product.salePrice || product.price || 0,
    rating: product.rating,
    reviews: product.reviewCount || 0,
    badges: getProductBadges(product)
  }));

  // 추천 영역 슬라이더에서는 최대 8개만 보여줌
  const sliderItems = processedProducts.slice(0, 8);

  const renderCard = (product) => {
    const liked = likedProducts.has(product.id);
    return (
      <article key={product.id} className="card2" onClick={() => {
        console.log('상품 카드2 클릭됨!', product.id);
        console.log('현재 경로:', location.pathname);
        const isSiteRoute = location.pathname.startsWith('/site/');
        if (isSiteRoute) {
          const siteName = location.pathname.split('/')[2];
          navigate(`/site/${siteName}/product/${product.id}`);
        } else {
          navigate(`/product/${product.id}`);
        }
      }}>
        <div className="thumb2">
          <img
            src={product.image || "/image/parcel.png"}
            alt={product.name}
            onError={(e) => (e.currentTarget.src = "/image/parcel.png")}
          />
        </div>

        <div className="meta2">
          <div className="price2">
            {product.discount > 0 && (
              <strong className="sale2">{product.discount}%</strong>
            )}
            {product.discount > 0 && (
              <s className="base2">{product.base.toLocaleString()}원</s>
            )}
            <b className="now2">{product.price.toLocaleString()}원</b>
          </div>

          <p className="name2">{product.name}</p>

          <div className="badges2">
            {product.badges.length > 0 ? (
              product.badges.map((badge) => (
                <span 
                  key={badge.id} 
                  className="badge2"
                  style={{ color: badge.color }}
                >
                  {badge.name}
                </span>
              ))
            ) : (
              <span className="badge2" style={{ visibility: 'hidden' }}>placeholder</span>
            )}
          </div>

          <div className="rating-reviews2">
            <span className="rating2">★ {product.rating || "-"}</span>
            <span className="reviews2">리뷰 {product.reviews}</span>
          </div>

          <div className="actions2">
            <button
              type="button"
              aria-pressed={liked}
              aria-label={liked ? "위시 해제" : "위시에 추가"}
              className={`icon-btn2 heart2 ${liked ? "liked" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(product.id);
              }}
            >
              <img 
                src={liked ? "/icons/heart_full.png" : "/icons/heart_bin.png"} 
                alt={liked ? "위시 해제" : "위시에 추가"} 
                width="20" 
                height="20"
              />
            </button>

            <button
              type="button"
              aria-label="장바구니 담기"
              className="icon-btn2 cart2"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
            >
              <img 
                src="/icons/shoppingcart.png" 
                alt="장바구니 담기" 
                width="20" 
                height="20"
              />
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <section className="product-grid2 container2">
      {useSlider ? (
        <div className="grid2-swiper">
          <Swiper
            modules={[Navigation]}
            navigation
            spaceBetween={20}
            slidesPerView={2.5}
            slidesPerGroup={2}
            breakpoints={{
              0: { slidesPerView: 1.2, slidesPerGroup: 1 },
              480: { slidesPerView: 1.5, slidesPerGroup: 1 },
              768: { slidesPerView: 2, slidesPerGroup: 2 },
              1024: { slidesPerView: 2.5, slidesPerGroup: 2 },
            }}
          >
            {sliderItems.map((product) => (
              <SwiperSlide key={product.id}>
                {renderCard(product)}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      ) : (
        <div className="grid2">
          {processedProducts.map((product) => {
          const liked = likedProducts.has(product.id);
          return (
            <article key={product.id} className="card2" onClick={() => {
              console.log('상품 카드2 클릭됨!', product.id);
              console.log('현재 경로:', location.pathname);
              // 현재 경로가 /site/sitename 형태인지 확인
              const isSiteRoute = location.pathname.startsWith('/site/');
              console.log('사이트 라우트인가?', isSiteRoute);
              if (isSiteRoute) {
                const siteName = location.pathname.split('/')[2];
                console.log('사이트 이름:', siteName);
                console.log('이동할 경로:', `/site/${siteName}/product/${product.id}`);
                navigate(`/site/${siteName}/product/${product.id}`);
              } else {
                console.log('관리자 페이지에서 이동:', `/product/${product.id}`);
                navigate(`/product/${product.id}`);
              }
            }}>
              <div className="thumb2">
                <img
                  src={product.image || "/image/parcel.png"}
                  alt={product.name}
                  onError={(e) => (e.currentTarget.src = "/image/parcel.png")}
                />
              </div>

              <div className="meta2">
                {/* 가격 라인 */}
                <div className="price2">
                  {product.discount > 0 && (
                    <strong className="sale2">{product.discount}%</strong>
                  )}
                  {product.discount > 0 && (
                    <s className="base2">{product.base.toLocaleString()}원</s>
                  )}
                  <b className="now2">{product.price.toLocaleString()}원</b>
                </div>

                {/* 상품명 */}
                <p className="name2">{product.name}</p>

                {/* 뱃지들 - 뱃지가 없어도 컨테이너는 항상 표시 */}
                <div className="badges2">
                  {product.badges.length > 0 ? (
                    product.badges.map((badge) => (
                      <span 
                        key={badge.id} 
                        className="badge2"
                        style={{ color: badge.color }}
                      >
                        {badge.name}
                      </span>
                    ))
                  ) : (
                    <span className="badge2" style={{ visibility: 'hidden' }}>placeholder</span>
                  )}
                </div>

                {/* 별점과 리뷰수 */}
                <div className="rating-reviews2">
                  <span className="rating2">★ {product.rating || "-"}</span>
                  <span className="reviews2">리뷰 {product.reviews}</span>
                </div>

                {/* 액션 버튼들 */}
                <div className="actions2">
                  <button
                    type="button"
                    aria-pressed={liked}
                    aria-label={liked ? "위시 해제" : "위시에 추가"}
                    className={`icon-btn2 heart2 ${liked ? "liked" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLike(product.id);
                    }}
                  >
                    <img 
                      src={liked ? "/icons/heart_full.png" : "/icons/heart_bin.png"} 
                      alt={liked ? "위시 해제" : "위시에 추가"} 
                      width="20" 
                      height="20"
                    />
                  </button>

                  <button
                    type="button"
                    aria-label="장바구니 담기"
                    className="icon-btn2 cart2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product);
                    }}
                  >
                    <img 
                      src="/icons/shoppingcart.png" 
                      alt="장바구니 담기" 
                      width="20" 
                      height="20"
                    />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        </div>
      )}
      {/* 페이지네이션 - 카테고리 페이지에서만 표시 (슬라이더 모드 아님) */}
      {!useSlider && showPagination && isCategoryPage && (
        <div className="pagination2">
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1}
          >
            &lt;
          </button>

          {Array.from({ length: Math.ceil(products.length / itemsPerPage) }, (_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                className={currentPage === page ? "active" : ""}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= Math.ceil(products.length / itemsPerPage)}
          >
            &gt;
          </button>
        </div>
      )}
    </section>
  );
};

export default ProductList2;
