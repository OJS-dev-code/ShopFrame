import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { NavLink } from "react-router-dom";
import "./MegaMenu.scss";

const MegaMenu = ({ 
  title, 
  placeholder, 
  categories = [], 
  onCategoryClick,
  // 검색
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  // 인증
  currentUser,
  onLoginClick,
  onSignupClick,
  onLogoutClick,
  // 로고
  logoUrl,
  logoStyle,
  logoTextSize,
  logoTextColor,
  logoTextFont,
  // 장바구니
  cartItemCount = 0,
  // 검색창 광고이미지
  searchAdImage,
}) => {
  const location = useLocation();
  
  // 현재 URL이 /site/siteName 형태인지 확인
  const isSiteRoute = location.pathname.startsWith('/site/');
  const siteName = isSiteRoute ? location.pathname.split('/')[2] : null;
  
  // 장바구니 경로 결정
  const getCartPath = () => {
    if (isSiteRoute && siteName) {
      return `/site/${siteName}/cart`;
    }
    return '/cart';
  };

  // 상태 관리
  const [showSearch, setShowSearch] = useState(false);
  const [q, setQ] = useState(searchQuery || "");
  const searchWrapRef = useRef(null);
  const [catOpen, setCatOpen] = useState(false);
  const catPanelRef = useRef(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);

  // 검색어 동기화
  useEffect(() => {
    setQ(searchQuery || "");
  }, [searchQuery]);

  // 검색 기록 불러오기
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse search history:', e);
      }
    }
  }, []);

  // 스크롤 이벤트 처리 - 헤더가 항상 보이도록 함
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 이벤트 리스너
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowSearch(false);
        setCatOpen(false);
      }
    };
    const onClickAway = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) setShowSearch(false);
      if (catPanelRef.current && !catPanelRef.current.contains(e.target)) setCatOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClickAway);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClickAway);
    };
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    if (q.trim()) {
      // 검색 기록에 추가
      const newHistory = [q.trim(), ...searchHistory.filter(item => item !== q.trim())].slice(0, 8);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      
      onSearchChange && onSearchChange(q);
      onSearchSubmit && onSearchSubmit();
      // 검색 결과 페이지로 이동
      if (isSiteRoute && siteName) {
        window.location.href = `/site/${siteName}?search=${encodeURIComponent(q)}`;
      } else {
        window.location.href = `/preview?search=${encodeURIComponent(q)}`;
      }
    }
  };

  // 카테고리를 메뉴로 변환
  const MENUS = categories.map((cat, index) => ({
    key: `menu${index + 1}`,
    to: `#${cat.id}`,
    label: cat.name
  }));

  return (
    <header 
      className={`site-header ${isScrolled ? 'scrolled' : ''}`} 
      data-header-type="HeaderA"
    >
      <div className="header-inner">
        {/* 로고 */}
        <NavLink to={isSiteRoute && siteName ? `/site/${siteName}` : "/preview"} className="logo" aria-label="홈으로">
          {logoStyle === 'image' && logoUrl ? (
            <img src={logoUrl} alt="사이트 로고" className="logo-img" />
          ) : (
            <div className="logo-text">
              <h1 style={{
                fontSize: typeof logoTextSize === 'number' ? `${logoTextSize}px` : (logoTextSize || '24px'),
                color: logoTextColor || '#333',
                fontFamily: logoTextFont || 'inherit',
                margin: 0
              }}>{title || "나의 쇼핑몰"}</h1>
            </div>
          )}
        </NavLink>

        {/* 내비 */}
        <nav id="global-nav" className="nav" aria-label="주요 메뉴">
          <ul className="nav-list">
            {/* 카테고리 */}
            <li className="category">
              <button
                type="button"
                className="cat-btn"
                aria-label={catOpen ? "카테고리 닫기" : "카테고리 열기"}
                onClick={(e) => { e.stopPropagation(); setCatOpen(v => !v); }}
              >
                <img src={catOpen ? "/icons/close_btn.png" : "/icons/menu.png"} alt="" />
                <span>카테고리</span>
              </button>
            </li>

            {/* 메뉴들 */}
            {MENUS.map((m, i) => (
              <li key={m.key} className="nav-item">
                <NavLink
                  to={m.to}
                  className="nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    onCategoryClick && onCategoryClick(categories[i]);
                  }}
                >
                  {m.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* 검색 + 아이콘 */}
        <div className="actions">
          <div className="search-wrap" ref={searchWrapRef}>
            <form className="search" role="search" onSubmit={submitSearch} onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                placeholder={placeholder || "원하시는 내용을 검색해보세요."}
                aria-label="사이트 검색"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => setShowSearch(true)}
              />
              <button className="btn-search" aria-label="검색" type="submit">
                <img src="/icons/seach_icon.png" alt="" className="icon-img" />
              </button>
            </form>

            {showSearch && (
              <div className="search-panel">
                {searchAdImage && (
                  <div className="banner">
                    <img 
                      src={searchAdImage} 
                      alt="검색창 광고" 
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        objectFit: "cover",
                        borderRadius: "8px"
                      }} 
                    />
                  </div>
                )}
                <h4>검색 기록</h4>
                <div className="keywords">
                  {searchHistory.length > 0 ? (
                    <ul>
                      {searchHistory.slice(0, 4).map((item, index) => (
                        <li key={index}>
                          <a 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              setQ(item);
                              submitSearch(e);
                            }}
                          >
                            {item}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
                      검색 기록이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 마이페이지 버튼 */}
          {currentUser && (
            <NavLink 
              className="icon-btn" 
              to={isSiteRoute && siteName ? `/site/${siteName}/mypage` : '/mypage'} 
              aria-label="마이페이지"
            >
              <img src="/icons/mypage.png" alt="마이페이지" className="icon-img" />
            </NavLink>
          )}

          <NavLink className="icon-btn" to={getCartPath()} aria-label="장바구니">
            <img src="/icons/shoppingcart.png" alt="장바구니" className="icon-img" />
            {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
          </NavLink>
          
          {currentUser !== undefined && (
            currentUser ? (
              <button className="icon-btn" onClick={onLogoutClick} aria-label="로그아웃">
                <img src="/icons/logout_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg" alt="" className="icon-img" />
              </button>
            ) : (
              <button className="icon-btn" onClick={onLoginClick} aria-label="로그인">
                <img src="/icons/login_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg" alt="" className="icon-img" />
              </button>
            )
          )}
        </div>
      </div>

      {/* 카테고리 메가메뉴 */}
      <div
        className={`category-panel ${catOpen ? "open" : ""}`}
        ref={catPanelRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="container category-grid" 
          style={{ 
            ['--sub-count']: Math.max(...categories.map(cat => cat.subcategories?.length || 0), 1),
            ['--category-count']: categories.length,
            ['--grid-template-columns']: categories.length > 6 
              ? `160px repeat(${Math.min(categories.length, 8)}, 1fr)` 
              : `160px repeat(6, 1fr)`,
            ['--grid-gap']: categories.length > 6 ? '20px' : '28px'
          }}
        >
          <div className="category-col title"><strong>Category</strong></div>
          {categories.length > 0 ? (
            categories.map((category, i) => (
              <div className="category-col" key={category.id || i}>
                <h5>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      onCategoryClick && onCategoryClick(category);
                      setCatOpen(false);
                    }}
                  >
                    {category.name}
                  </a>
                </h5>
                <ul>
                  {category.subcategories && category.subcategories.length > 0 ? (
                    category.subcategories.map((subcategory, j) => (
                      <li key={subcategory.id || j}>
                        <a 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            onCategoryClick && onCategoryClick(subcategory);
                            setCatOpen(false);
                          }}
                        >
                          {subcategory.name}
                        </a>
                      </li>
                    ))
                  ) : (
                    <li>
                      <a 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          onCategoryClick && onCategoryClick(category);
                          setCatOpen(false);
                        }}
                      >
                        {category.name}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            ))
          ) : (
            <div className="category-col">
              <h5>카테고리가 없습니다</h5>
              <ul>
                <li>카테고리를 추가해주세요</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default MegaMenu;