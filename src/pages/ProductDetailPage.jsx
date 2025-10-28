import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { SiteContext } from '../context/SiteContext';
import MegaMenu from '../components/MegaMenu';
import DropdownMenu from '../components/DropdownMenu';
import MobileHeader from '../components/MobileHeader';
import Footer from '../components/Footer';
import ProductList2 from '../components/ProductList2';
import './ProductDetailPage.scss';
import '../components/HeaderResponsive.scss';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { siteData, addToCart, toggleLike, likedProducts, currentUser, getProductReviews, getProductRating } = useContext(SiteContext);
  const location = useLocation();
  const isSiteRoute = location.pathname.startsWith('/site/');
  const siteName = isSiteRoute ? location.pathname.split('/')[2] : null;
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('detail-images');
  const [openAccordions, setOpenAccordions] = useState({});
  const [selectedColorName, setSelectedColorName] = useState('');
  const [reviews, setReviews] = useState([]);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const reviewsPerPage = 5;
  
  // 스크롤 위치에 따라 앵커 내비게이션 활성 탭 자동 변경
  useEffect(() => {
    const HEADER_OFFSET = 65; // SCSS 변수 --header-height와 동일하게 유지
    const sectionIds = ['detail-images', 'recommended', 'reviews', 'product-info'];

    const onScroll = () => {
      let current = activeTab;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const topThreshold = HEADER_OFFSET + 1;
        const isInView = rect.top <= topThreshold && rect.bottom > topThreshold;
        if (isInView) {
          current = id;
          break;
        }
      }
      if (current !== activeTab) setActiveTab(current);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [activeTab]);

  // 상세페이지 최초 진입 시, 앵커가 아닌 이미지 슬라이더가 보이도록 스크롤 위치 조정
  useEffect(() => {
    // 해시로 특정 섹션을 명시적으로 요청한 경우는 건너뜀
    if (window.location.hash) return;
    const HEADER_OFFSET = 65;
    // 이미지 섹션 컨테이너를 기준으로 스크롤
    const imageSection = document.querySelector('.image-section');
    if (imageSection) {
      const rect = imageSection.getBoundingClientRect();
      const targetY = window.scrollY + rect.top - HEADER_OFFSET - 10;
      window.scrollTo({ top: Math.max(targetY, 0), behavior: 'auto' });
    }
  }, []);

  // 상품 데이터 찾기
  const product = siteData?.products?.find(p => p.id === productId);

  // 후기 데이터 로드
  useEffect(() => {
    if (productId) {
      const productReviews = getProductReviews(productId);
      setReviews(productReviews);
    }
  }, [productId, getProductReviews]);
  
  // 디버깅: siteData 확인
  console.log('ProductDetailPage siteData:', siteData);
  console.log('siteTitle:', siteData?.siteTitle);
  console.log('footer:', siteData?.footer);
  
  // 상품이 로드되지 않은 경우 로딩 표시
  if (!siteData) {
    return (
      <div className="product-detail-page">
        <MegaMenu 
        title={siteData?.siteTitle || "Shop Frame"}
        placeholder={siteData?.searchPlaceholder || "상품을 검색하세요"}
        categories={siteData?.categories || []}
        searchQuery=""
        onSearchChange={() => {}}
        onSearchSubmit={() => {}}
        currentUser={currentUser}
        onLoginClick={() => navigate('/')}
        onSignupClick={() => navigate('/signup')}
        onLogoutClick={() => {}}
        logoUrl={siteData?.logoUrl}
        logoStyle={siteData?.logoStyle}
        cartItemCount={0}
        searchAdImage={siteData?.searchAdImage}
      />
        <div className="not-found">
          <h2>데이터를 로딩 중입니다...</h2>
          <p>잠시만 기다려주세요.</p>
        </div>
        <Footer footerData={siteData?.footer || {}} />
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="product-detail-page">
        <MegaMenu 
        title={siteData?.siteTitle || "Shop Frame"}
        placeholder={siteData?.searchPlaceholder || "상품을 검색하세요"}
        categories={siteData?.categories || []}
        searchQuery=""
        onSearchChange={() => {}}
        onSearchSubmit={() => {}}
        currentUser={currentUser}
        onLoginClick={() => navigate('/')}
        onSignupClick={() => navigate('/signup')}
        onLogoutClick={() => {}}
        logoUrl={siteData?.logoUrl}
        logoStyle={siteData?.logoStyle}
        cartItemCount={0}
        searchAdImage={siteData?.searchAdImage}
      />
        <div className="not-found">
          <h2>상품을 찾을 수 없습니다</h2>
          <p>상품 ID: {productId}</p>
          <button onClick={() => navigate(-1)}>뒤로 가기</button>
        </div>
        <Footer footerData={siteData?.footer || {}} />
      </div>
    );
  }

  // 카테고리 정보 찾기
  const getCategoryInfo = () => {
    let parentCategory = null;
    let subcategory = null;
    
    // 대카테고리에서 찾기
    parentCategory = siteData?.categories?.find(cat => cat.id === product.categoryId);
    
    // 소카테고리인지 확인
    if (!parentCategory) {
      for (const category of siteData?.categories || []) {
        if (category.subcategories) {
          const sub = category.subcategories.find(sub => sub.id === product.categoryId);
          if (sub) {
            parentCategory = category;
            subcategory = sub;
            break;
          }
        }
      }
    }
    
    return { parentCategory, subcategory };
  };

  const { parentCategory, subcategory } = getCategoryInfo();

  // 뱃지 정보 가져오기
  const getProductBadges = () => {
    if (!product.badges || !Array.isArray(product.badges)) return [];
    return product.badges.map(badgeId => 
      siteData?.productBadges?.find(badge => badge.id === badgeId)
    ).filter(Boolean);
  };

  // 이미지 슬라이드 처리
  const allImages = [
    product.image,
    ...(product.subImages || [])
  ].filter(Boolean);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // 옵션 선택 처리
  const handleOptionChange = (optionName, value) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  // 색상 옵션 선택 처리
  const handleColorSelect = (colorOption) => {
    setSelectedColor(colorOption);
    setSelectedColorName(colorOption.name);
  };

  // 장바구니 추가
  const handleAddToCart = async () => {
    // 모든 옵션이 선택되었는지 확인
    if (!areAllOptionsSelected()) {
      alert('모든 옵션을 선택해주세요.');
      return;
    }

    const cartItem = {
      ...product,
      selectedOptions,
      selectedColor,
      quantity: quantity
    };
    
    try {
      // 옵션 정보를 포함한 상품 데이터로 장바구니에 추가
      const productWithOptions = {
        ...product,
        selectedOptions,
        selectedColor,
        options: selectedOptions // 기존 options 필드도 업데이트
      };
      
      await addToCart(productWithOptions, quantity, selectedOptions);
      
      // 확인 메시지로 변경
      if (window.confirm('장바구니에 추가되었습니다!\n지금 바로 장바구니 페이지로 이동하시겠습니까?')) {
        if (isSiteRoute && siteName) {
          navigate(`/site/${siteName}/cart`);
        } else {
          navigate('/cart');
        }
      }
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      alert('장바구니 추가에 실패했습니다.');
    }
  };

  // 바로구매
  const handleBuyNow = () => {
    // 모든 옵션이 선택되었는지 확인
    if (!areAllOptionsSelected()) {
      alert('모든 옵션을 선택해주세요.');
      return;
    }

    const cartItem = {
      ...product,
      selectedOptions,
      selectedColor,
      quantity: quantity,
      options: selectedOptions // 기존 options 필드도 업데이트
    };
    
    // 바로구매용 데이터를 cart 키에 저장
    localStorage.setItem('cart', JSON.stringify([cartItem]));
    
    // 사이트별 URL 구조에 맞게 이동
    if (isSiteRoute && siteName) {
      navigate(`/site/${siteName}/checkout`);
    } else {
      navigate('/checkout');
    }
  };

  // 수량 변경
  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  // 수량 감소
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // 수량 증가
  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  // 총 가격 계산
  const totalPrice = (product.salePrice || product.price) * quantity;

  // 장바구니 추가 요청 (옵션 모달 처리)
  const handleAddToCartRequest = async () => {
    // 옵션이 있는 경우 옵션 모달 표시
    if (product.options && product.options.length > 0) {
      // 옵션 모달 로직 (기존 코드에서 가져옴)
      await handleAddToCart();
    } else {
      await handleAddToCart();
    }
  };

  // 관련 상품 가져오기 (같은 카테고리의 다른 상품들)
  const getRelatedProducts = () => {
    if (!product || !siteData?.products) return [];
    return siteData.products
      .filter(p => p.id !== product.id && p.categoryId === product.categoryId)
      .slice(0, 8); // 최대 8개
  };

  // 찜하기 토글
  const handleToggleLike = async () => {
    await toggleLike(product.id);
  };

  // likedProducts가 Set 또는 배열일 수 있으므로 모두 대응
  const liked = Array.isArray(likedProducts)
    ? likedProducts.includes(product.id)
    : (likedProducts?.has ? likedProducts.has(product.id) : false);

  // 적립금 계산 (할인가격의 10%, 할인가격이 없으면 원가의 10%)
  const calculatePoints = () => {
    const price = product.salePrice || product.price;
    return Math.floor(price * 0.1);
  };

  // 총 금액 계산
  const calculateTotalPrice = () => {
    const price = product.salePrice || product.price;
    return price * quantity;
  };

  // 선택된 옵션들이 모두 선택되었는지 확인
  const isColorOptionName = (name) => {
    if (!name) return false;
    const normalized = String(name).trim().toLowerCase();
    return normalized.includes('color') || normalized.includes('컬러') || normalized.includes('색상');
  };

  const hasColorSection = !!(product.showColorOptions && product.colorOptions && product.colorOptions.length > 0);
  const nonColorOptions = (product.options || []).filter(opt => !isColorOptionName(opt.name));

  const areAllOptionsSelected = () => {
    const requiredGeneralOptions = hasColorSection ? nonColorOptions : (product.options || []);
    const generalDone = requiredGeneralOptions.length === 0 || requiredGeneralOptions.every(option => !!selectedOptions[option.name]);
    const colorDone = hasColorSection ? selectedColor !== null : true;
    return generalDone && colorDone;
  };

  // 아코디언 토글
  const toggleAccordion = (accordionId) => {
    setOpenAccordions(prev => ({
      ...prev,
      [accordionId]: !prev[accordionId]
    }));
  };

  // 헤더 카테고리 클릭 이동 처리
  const handleCategoryClick = (category) => {
    if (!category) return;
    // 페이지 전환 전에 스크롤을 최상단으로 이동해 새 페이지가 상단부터 보이도록
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (isSiteRoute && siteName) {
      navigate(`/site/${siteName}/category/${category.id}`);
    } else {
      navigate(`/category/${category.id}`);
    }
  };


  const renderHeader = () => {
    const headerProps = {
      title: siteData?.siteTitle || "Shop Frame",
      placeholder: siteData?.searchPlaceholder || "상품을 검색하세요",
      categories: siteData?.categories || [],
      onCategoryClick: handleCategoryClick,
      searchQuery: "",
      onSearchChange: () => {},
      onSearchSubmit: () => {},
      currentUser,
      onLoginClick: () => navigate('/'),
      onSignupClick: () => navigate('/signup'),
      onLogoutClick: () => {},
      logoUrl: siteData?.logoUrl,
      logoStyle: siteData?.logoStyle,
      cartItemCount: 0,
      searchAdImage: siteData?.searchAdImage,
    };
    
    return (
      <>
        {/* 모바일 헤더 */}
        <MobileHeader {...headerProps} />
        
        {/* 데스크톱 헤더 */}
        <div className="desktop-header">
          {siteData?.headerType === 'HeaderB' ? (
            <DropdownMenu {...headerProps} />
          ) : (
            <MegaMenu {...headerProps} />
          )}
        </div>
      </>
    );
  };

  // 헤더 높이 계산 (모바일/데스크톱 구분)
  const getHeaderHeight = () => {
    // 모바일에서는 MobileHeader 사용 (56px)
    if (window.innerWidth <= 768) {
      return '56px';
    }
    // 데스크톱에서는 헤더 타입에 따라 결정
    if (siteData?.headerType === 'HeaderB') {
      return '248px'; // DropdownMenu 높이 (200px + 48px)
    }
    return '65px'; // MegaMenu 높이
  };

  return (
    <div className="product-detail-page mobile-padding" style={{ ['--header-height']: getHeaderHeight() }}>
      {renderHeader()}
      
      <div className="container">
        {/* 카테고리 경로 */}
        <div className="breadcrumb">
          <span onClick={() => navigate('/')}>홈</span>
          <span className="separator">&gt;</span>
          <span onClick={() => navigate(`/category/${parentCategory?.id}`)}>
            {parentCategory?.name}
          </span>
          {subcategory && (
            <>
              <span className="separator">&gt;</span>
              <span>{subcategory.name}</span>
            </>
          )}
        </div>

        {/* 메인 상품 상세 영역 */}
        <div className="product-detail-main">
          {/* 좌측: 이미지 및 탭 영역 */}
          <div className="left-section">
            {/* 이미지 슬라이더 */}
            <div className="image-section">
              {/* 서브 이미지들 (왼쪽 세로 배치) */}
              {allImages.length > 1 && (
                <div className="sub-images">
                  {allImages.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className={`sub-image ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
        </div>
              )}

              {/* 메인 이미지 (세로로 긴 형태) */}
            <div className="main-image-container">
              <img 
                src={allImages[currentImageIndex] || '/image/parcel.png'} 
                alt={product.name}
                className="main-image"
              />
                {allImages.length > 1 && (
                  <>
                    <button className="nav-btn prev-btn" onClick={prevImage}>
                    </button>
                    <button className="nav-btn next-btn" onClick={nextImage}>
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* 모바일에서 product-info-panel을 이미지슬라이더 아래로 이동 */}
            <div className="mobile-product-info">
              <div className="product-info-panel">
                {/* 카테고리 브레드크럼 */}
                <div className="category-breadcrumb">
                  <span className="category-name">{parentCategory?.name}</span>
                  <img src="/icons/right-arrow.png" alt=">" className="arrow-icon" />
                  <span className="category-name">{subcategory?.name || parentCategory?.name}</span>
                </div>

              {/* 상품명 */}
              <h1 className="product-name">{product.name}</h1>

              {/* 가격 정보 */}
              <div className="price-section">
                {product.discountPercent > 0 && (
                  <span className="discount-rate">{product.discountPercent}%</span>
                )}
                <span className="current-price">
                  {(product.salePrice || product.price).toLocaleString()}원
                </span>
                {product.discountPercent > 0 && (
                  <span className="original-price">
                    {product.price.toLocaleString()}원
                  </span>
                )}
              </div>

                {/* 프로모션 정보 */}
                <div className="promotion-section">
                  <div className="points-container">
                    <div className="points-header">
                      <span>{calculatePoints().toLocaleString()}원 최대적립</span>
                    </div>
                    <div className="points-details">
                      <ul>
                        <li>{Math.floor(calculatePoints() * 0.5).toLocaleString()}원 구매적립</li>
                        <li>{Math.floor(calculatePoints() * 0.5).toLocaleString()}원 후기적립</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 상품 옵션들 (색상 + 일반 옵션 표시, 일반 옵션에서 '색상/컬러/color'는 제외) */}
                {hasColorSection && (
                  <div className="color-options">
                    <div className="color-label-row">
                      <label className="color-label">색상</label>
                      {selectedColorName && (
                        <span className="selected-color-name">{selectedColorName}</span>
                      )}
                    </div>
                    <div className="color-dots">
                      {product.colorOptions.map((colorOption, index) => (
                        <button
                          key={index}
                          className={`color-dot ${selectedColor?.id === colorOption.id ? 'selected' : ''}`}
                          style={{ backgroundColor: colorOption.color }}
                          title={colorOption.name}
                          onClick={() => handleColorSelect(colorOption)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {(hasColorSection ? nonColorOptions.length > 0 : (product.options && product.options.length > 0)) && (
                  <div className="options-section">
                    {(hasColorSection ? nonColorOptions : product.options).map((option, index) => (
                      <div key={index} className="option-group">
                        <label className="option-label">{option.name}</label>
                        <select
                          className="option-select"
                          value={selectedOptions[option.name] || ''}
                          onChange={(e) => handleOptionChange(option.name, e.target.value)}
                        >
                          <option value="">선택하세요</option>
                          {option.values.map((value, valueIndex) => (
                            <option key={valueIndex} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                {/* 수량 선택 */}
                <div className="quantity-section">
                  <label className="quantity-label">수량</label>
                  <div className="quantity-controls">
                    <button 
                      className="quantity-btn minus" 
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="quantity-display">{quantity}</span>
                    <button 
                      className="quantity-btn plus" 
                      onClick={increaseQuantity}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 총 가격 */}
                <div className="total-price-section">
                  <div className="total-price-label">총 상품금액</div>
                  <div className="total-price-amount">
                    {(totalPrice).toLocaleString()}원
                  </div>
                </div>

                {/* 액션 버튼들 */}
                <div className="action-buttons">
                  <button 
                    className={`like-btn ${liked ? 'liked' : ''}`}
                    onClick={handleToggleLike}
                  >
                    <img 
                      src={liked ? "/icons/heart_full.png" : "/icons/heart_bin.png"} 
                      alt="찜하기" 
                      width="20" 
                      height="20"
                    />
                  </button>
                  <button 
                    className="cart-btn"
                    onClick={handleAddToCartRequest}
                  >
                    장바구니
                  </button>
                  <button 
                    className="buy-btn"
                    onClick={handleBuyNow}
                  >
                    바로구매
                  </button>
                </div>
              </div>
            </div>
            
            {/* 앵커 내비게이션 버튼들 */}
            <div className="anchor-navigation">
              <a 
                href="#detail-images"
                className={`nav-link ${activeTab === 'detail-images' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('detail-images');
                  document.getElementById('detail-images')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                상세 이미지
              </a>
              <a 
                href="#recommended"
                className={`nav-link ${activeTab === 'recommended' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('recommended');
                  document.getElementById('recommended')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                추천상품
              </a>
              <a 
                href="#reviews"
                className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('reviews');
                  document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                후기
              </a>
              <a 
                href="#product-info"
                className={`nav-link ${activeTab === 'product-info' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('product-info');
                  document.getElementById('product-info')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                상품 상세 정보
              </a>
            </div>
            
            {/* 섹션 콘텐츠들 */}
            <div id="detail-images" className="content-section">
              {product.detailImages && product.detailImages.length > 0 ? (
                <div className="detail-images">
                  {product.detailImages.map((image, index) => (
                    <div key={index} className="detail-image-wrapper">
                      <img
                    src={image}
                        alt={`${product.name} 상세 ${index + 1}`}
                        className="detail-image"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-detail-images">
                  <p>상세 이미지가 없습니다.</p>
                </div>
              )}
            </div>

            <div id="recommended" className="content-section">
              <h3 className="recommended-title">추천 상품</h3>
              {getRelatedProducts().length > 0 ? (
                <ProductList2 
                  products={getRelatedProducts().slice(0, 8)}
                  onAddToCart={addToCart}
                  onToggleLike={toggleLike}
                  likedProducts={likedProducts}
                  showPagination={false}
                  useSlider
                />
              ) : (
                <div className="no-recommended">
                  <p>추천 상품이 없습니다.</p>
                </div>
              )}
            </div>

            <div id="reviews" className="content-section">
              <div className="reviews-summary">
                <div className="rating-overview">
                  <div className="rating-score">
                    <span className="score">{getProductRating(productId).average || 0}</span>
                    <div className="stars">
                      {(() => {
                        const rating = getProductRating(productId).average || 0;
                        const fullStars = Math.floor(rating);
                        const hasHalfStar = rating % 1 >= 0.5;
                        return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));
                      })()}
                    </div>
                    <div className="review-count">({getProductRating(productId).count}개 후기)</div>
                  </div>
                  <div className="rating-breakdown">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = reviews.filter(r => r.rating === star).length;
                      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={star} className="rating-item">
                          <span>{star}점</span>
                          <div className="progress-bar">
                            <div className="progress" style={{width: `${percentage}%`}}></div>
                          </div>
                          <span>{Math.round(percentage)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="reviews-list">
                {reviews.length === 0 ? (
                  <div className="no-reviews">
                    <p>아직 후기가 없습니다.</p>
                  </div>
                ) : (
                  <>
                    {reviews
                      .slice((currentReviewPage - 1) * reviewsPerPage, currentReviewPage * reviewsPerPage)
                      .map((review, index) => (
                        <div key={review.id} className="review-item">
                          <div className="review-header">
                            <div className="review-rating">
                              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                            </div>
                            <div className="review-date">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="review-content">
                            {review.content}
                          </div>
                          {review.author && (
                            <div className="review-author">
                              - {review.author}
                            </div>
                          )}
                        </div>
                      ))}
                    
                    {/* 페이지네이션 */}
                    {reviews.length > reviewsPerPage && (
                      <div className="review-pagination">
                        <button 
                          onClick={() => setCurrentReviewPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentReviewPage === 1}
                          className="pagination-btn"
                        >
                          이전
                        </button>
                        <span className="pagination-info">
                          {currentReviewPage} / {Math.ceil(reviews.length / reviewsPerPage)}
                        </span>
                        <button 
                          onClick={() => setCurrentReviewPage(prev => Math.min(prev + 1, Math.ceil(reviews.length / reviewsPerPage)))}
                          disabled={currentReviewPage === Math.ceil(reviews.length / reviewsPerPage)}
                          className="pagination-btn"
                        >
                          다음
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div id="product-info" className="content-section">
              <div className="product-description">
                <h3>상세 정보</h3>
              </div>
              
              {/* 아코디언 섹션들 */}
              <div className="accordion-sections">
                {/* 상품 정보 안내 */}
                <div className="accordion-item">
                  <div 
                    className="accordion-header"
                    onClick={() => toggleAccordion('product-notification')}
                  >
                    <span>상품 정보 안내</span>
                    <span className={`accordion-icon ${openAccordions['product-notification'] ? 'open' : ''}`}>▼</span>
                  </div>
                  {openAccordions['product-notification'] && (
                    <div className="accordion-content">
                      {product.description ? (
                        <div
                          className="description-content"
                          dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br>') }}
                        />
                      ) : (
                        <p>상품 정보가 없습니다.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* 판매자 정보 섹션 제거 */}

                {/* 결제 정보 섹션 제거 */}
              </div>
            </div>
          </div>

          {/* 우측: 고정 정보 패널 */}
          <div className="right-section">
            <div className="product-info-panel">
              {/* 카테고리 브레드크럼 */}
              <div className="category-breadcrumb">
                <span className="category-name">{parentCategory?.name}</span>
                <img src="/icons/right-arrow.png" alt=">" className="arrow-icon" />
                <span className="category-name">{subcategory?.name || parentCategory?.name}</span>
              </div>

            {/* 상품명 */}
            <h1 className="product-name">{product.name}</h1>

            {/* 가격 정보 */}
            <div className="price-section">
              {product.discountPercent > 0 && (
                <span className="discount-rate">{product.discountPercent}%</span>
              )}
              <span className="current-price">
                {(product.salePrice || product.price).toLocaleString()}원
              </span>
              {product.discountPercent > 0 && (
                <span className="original-price">
                  {product.price.toLocaleString()}원
                </span>
              )}
            </div>

              {/* 프로모션 정보 */}
              <div className="promotion-section">
                <div className="points-container">
                  <div className="points-header">
                    <span>{calculatePoints().toLocaleString()}원 최대적립</span>
                  </div>
                  <div className="points-details">
                    <ul>
                      <li>{Math.floor(calculatePoints() * 0.5).toLocaleString()}원 구매적립</li>
                      <li>{Math.floor(calculatePoints() * 0.5).toLocaleString()}원 후기적립</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 상품 옵션들 (색상 + 일반 옵션 표시, 일반 옵션에서 '색상/컬러/color'는 제외) */}
              {hasColorSection && (
                <div className="color-options">
                  <div className="color-label-row">
                    <label className="color-label">색상</label>
                    {selectedColorName && (
                      <span className="selected-color-name">{selectedColorName}</span>
                    )}
                  </div>
                  <div className="color-dots">
                    {product.colorOptions.map((colorOption, index) => (
                      <button
                        key={index}
                        className={`color-dot ${selectedColor?.id === colorOption.id ? 'selected' : ''}`}
                        style={{ backgroundColor: colorOption.color }}
                        title={colorOption.name}
                        onClick={() => handleColorSelect(colorOption)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {(hasColorSection ? nonColorOptions.length > 0 : (product.options && product.options.length > 0)) && (
                <div className="options-section">
                  {(hasColorSection ? nonColorOptions : product.options).map((option, index) => (
                    <div key={index} className="option-group">
                      <label className="option-label">{option.name}</label>
                      <select
                        className="option-select"
                        value={selectedOptions[option.name] || ''}
                        onChange={(e) => handleOptionChange(option.name, e.target.value)}
                      >
                        <option value="">선택하세요</option>
                        {option.values.map((value, valueIndex) => (
                          <option key={valueIndex} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* 선택된 옵션들 섹션은 숨김 처리 (요청에 따라 미표시) */}


              {/* 선택된 옵션 및 금액 표시 */}
              {areAllOptionsSelected() && (
                <div className="selected-item-display">
                  <div className="item-info">
                    <div className="selected-values">
                      {(hasColorSection ? nonColorOptions : (product.options || [])).map((option, index) => (
                        <span key={index} className="option-value">
                          {selectedOptions[option.name]}
                          {index < ((hasColorSection ? nonColorOptions : (product.options || [])).length) - 1 && ' · '}
                        </span>
                      ))}
                      {selectedColorName && (
                        <span className="option-value">
                          {(hasColorSection ? nonColorOptions.length > 0 : (product.options && product.options.length > 0)) && ' · '}
                          {selectedColorName}
                        </span>
                      )}
                    </div>
                    <div className="delivery-info">
                      10.10(금) 도착 예정
                    </div>
                  </div>
                  <div className="item-controls">
                    <div className="quantity-controls">
                      <button 
                        className="quantity-btn minus"
                        onClick={() => handleQuantityChange(-1)}
                      >
                        -
                      </button>
                      <span className="quantity-display">{quantity}</span>
                      <button 
                        className="quantity-btn plus"
                        onClick={() => handleQuantityChange(1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="item-price">
                      {calculateTotalPrice().toLocaleString()}원
                    </div>
                    <button 
                      className="remove-btn"
                      onClick={() => {
                        setSelectedOptions({});
                        setSelectedColor(null);
                        setSelectedColorName('');
                        setQuantity(1);
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

            {/* 액션 버튼들 */}
            <div className="action-buttons">
              <button 
                className={`like-btn ${liked ? 'liked' : ''}`}
                onClick={handleToggleLike}
              >
                <img 
                  src={liked ? "/icons/heart_full.png" : "/icons/heart_bin.png"} 
                  alt="찜하기" 
                  width="20" 
                  height="20"
                />
              </button>
              <button className="cart-btn" onClick={handleAddToCart}>
                  장바구니
              </button>
                <button className="buy-btn" onClick={handleBuyNow}>
                  결제하기
            </button>
          </div>

              {/* 총 금액 */}
              <div className="total-amount">
                <span>총 금액 {calculateTotalPrice().toLocaleString()}원</span>
              </div>
              </div>
          </div>
        </div>
      </div>

      <Footer footerData={siteData?.footer || {}} />
    </div>
  );
};

export default ProductDetailPage;