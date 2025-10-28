import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './MobileHeader.scss';

const MobileHeader = ({
  title = "나의 쇼핑몰",
  placeholder = "상품을 검색해보세요",
  categories = [],
  logoUrl = "",
  logoStyle = 'text',
  logoTextSize,
  logoTextColor,
  logoTextFont,
  cartItemCount = 0,
  currentUser,
  onLoginClick = () => {},
  onSignupClick = () => {},
  onLogoutClick = () => {},
  onCategoryClick = () => {}
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  // 현재 경로가 사이트별 웹사이트인지 확인
  const isSiteRoute = location.pathname.startsWith('/site/');
  const siteName = isSiteRoute ? location.pathname.split('/')[2] : null;

  // 스크롤 이벤트 처리
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 검색 처리
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (isSiteRoute && siteName) {
        navigate(`/site/${siteName}?search=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        navigate(`/preview?search=${encodeURIComponent(searchQuery.trim())}`);
      }
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  // 카테고리 클릭 처리
  const handleCategoryClick = (category) => {
    if (isSiteRoute && siteName) {
      navigate(`/site/${siteName}/category/${category.id}`);
    } else {
      navigate(`/preview/category/${category.id}`);
    }
    setIsMenuOpen(false);
    onCategoryClick(category);
  };

  // 장바구니 경로 생성
  const getCartPath = () => {
    if (isSiteRoute && siteName) {
      return `/site/${siteName}/cart`;
    }
    return '/cart';
  };

  // 로그인 경로 생성
  const getLoginPath = () => {
    if (isSiteRoute && siteName) {
      return `/site/${siteName}/login`;
    }
    return '/login';
  };

  // 회원가입 경로 생성
  const getSignupPath = () => {
    if (isSiteRoute && siteName) {
      return `/site/${siteName}/signup`;
    }
    return '/signup';
  };

  return (
    <>
      {/* 모바일 헤더 */}
      <header className={`mobile-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="mobile-header-inner">
          {/* 햄버거 메뉴 버튼 */}
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
          >
            <span className={`hamburger ${isMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          {/* 로고 */}
          <NavLink 
            to={isSiteRoute && siteName ? `/site/${siteName}` : "/preview"} 
            className="mobile-logo"
            aria-label="홈으로"
          >
            {logoStyle === 'image' && logoUrl ? (
              <img src={logoUrl} alt="사이트 로고" className="mobile-logo-img" />
            ) : (
              <div className="mobile-logo-text">
                <h1 style={{
                  fontSize: typeof logoTextSize === 'number' ? `${logoTextSize}px` : (logoTextSize || '20px'),
                  color: logoTextColor || '#333',
                  fontFamily: logoTextFont || 'inherit',
                  margin: 0
                }}>{title}</h1>
              </div>
            )}
          </NavLink>

          {/* 액션 버튼들 */}
          <div className="mobile-actions">
            {/* 검색 버튼 */}
            <button
              className="mobile-action-btn search-btn"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="검색"
            >
              <img src="/icons/seach_icon.png" alt="검색" width="20" height="20" />
            </button>

            {/* 장바구니 버튼 */}
            <NavLink to={getCartPath()} className="mobile-action-btn cart-btn" aria-label="장바구니">
              <img src="/icons/shoppingcart.png" alt="장바구니" width="20" height="20" />
              {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
            </NavLink>
          </div>
        </div>

        {/* 검색바 */}
        {isSearchOpen && (
          <div className="mobile-search-bar">
            <form onSubmit={handleSearch} className="mobile-search-form">
              <input
                type="text"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mobile-search-input"
                autoFocus
              />
              <button type="submit" className="mobile-search-submit">
                <img src="/icons/seach_icon.png" alt="검색" width="16" height="16" />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* 모바일 메뉴 오버레이 */}
      {isMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            {/* 메뉴 닫기 버튼 */}
            <div className="mobile-menu-close-container">
              <button
                className="mobile-menu-close"
                onClick={() => setIsMenuOpen(false)}
                aria-label="메뉴 닫기"
              >
                <span className="close-icon">×</span>
              </button>
            </div>

            {/* 사용자 정보 */}
            <div className="mobile-menu-user">
              {currentUser ? (
                <div className="mobile-user-info">
                  <div className="mobile-user-name">
                    {(() => {
                      if (currentUser?.name) {
                        return `${currentUser.name}님, 환영합니다!`;
                      } else if (currentUser?.displayName) {
                        return `${currentUser.displayName}님, 환영합니다!`;
                      } else if (currentUser?.email) {
                        const emailName = currentUser.email.split('@')[0];
                        return `${emailName}님, 환영합니다!`;
                      } else {
                        return '사용자님, 환영합니다!';
                      }
                    })()}
                  </div>
                  <button 
                    className="mobile-logout-btn"
                    onClick={() => {
                      onLogoutClick();
                      setIsMenuOpen(false);
                    }}
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <div className="mobile-auth-links">
                  <NavLink 
                    to={getLoginPath()} 
                    className="mobile-auth-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    로그인
                  </NavLink>
                  <NavLink 
                    to={getSignupPath()} 
                    className="mobile-auth-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    회원가입
                  </NavLink>
                </div>
              )}
            </div>

            {/* 카테고리 메뉴 */}
            {categories && categories.length > 0 && (
              <div className="mobile-menu-categories">
                <h3>카테고리</h3>
                <ul className="mobile-category-list">
                  {categories.map((category) => (
                    <li key={category.id} className="mobile-category-item">
                      <button
                        className="mobile-category-btn"
                        onClick={() => handleCategoryClick(category)}
                      >
                        {category.name}
                      </button>
                      {category.subcategories && category.subcategories.length > 0 && (
                        <ul className="mobile-subcategory-list">
                          {category.subcategories.map((subcategory) => (
                            <li key={subcategory.id} className="mobile-subcategory-item">
                              <button
                                className="mobile-subcategory-btn"
                                onClick={() => handleCategoryClick(subcategory)}
                              >
                                {subcategory.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 기타 메뉴 */}
            <div className="mobile-menu-links">
              <NavLink 
                to={isSiteRoute && siteName ? `/site/${siteName}` : "/preview"} 
                className="mobile-menu-link"
                onClick={() => setIsMenuOpen(false)}
              >
                홈
              </NavLink>
              <NavLink 
                to={getCartPath()} 
                className="mobile-menu-link"
                onClick={() => setIsMenuOpen(false)}
              >
                장바구니
              </NavLink>
              {currentUser && (
                <NavLink 
                  to={isSiteRoute && siteName ? `/site/${siteName}/mypage` : "/mypage"} 
                  className="mobile-menu-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  마이페이지
                </NavLink>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileHeader;
