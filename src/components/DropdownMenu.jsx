import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import "./DropdownMenu.scss";

/* 이미지 경로 */
const LogoImg = process.env.PUBLIC_URL + "/icons/logo.png";
const IcSearch = process.env.PUBLIC_URL + "/icons/seach_icon.png";
const IcUser = process.env.PUBLIC_URL + "/icons/mypage.png";
const IcBag = process.env.PUBLIC_URL + "/icons/shoppingcart.png";

/* ▼ SVGs */
function CaretDown({ className }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

const DropdownMenu = ({ 
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
  // 장바구니
  cartItemCount = 0
}) => {
  const [askOpen, setAskOpen] = useState(false);
  const askRef = useRef(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const searchBoxRef = useRef(null);

  // 클릭 밖/ESC 처리
  useEffect(() => {
    const onClickAway = (e) => {
      if (askRef.current && !askRef.current.contains(e.target)) setAskOpen(false);
      if (searchOpen && searchBoxRef.current && !searchBoxRef.current.contains(e.target)) setSearchOpen(false);
    };
    const onEscape = (e) => {
      if (e.key === "Escape") {
        setAskOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener("click", onClickAway);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("click", onClickAway);
      document.removeEventListener("keydown", onEscape);
    };
  }, [searchOpen]);

  // 현재 URL이 /site/siteName 형태인지 확인
  const isSiteRoute = window.location.pathname.startsWith('/site/');
  const siteName = isSiteRoute ? window.location.pathname.split('/')[2] : null;

  // 장바구니 경로 결정
  const getCartPath = () => {
    if (isSiteRoute && siteName) {
      return `/site/${siteName}/cart`;
    }
    return '/cart';
  };

  // 로그인/회원가입 경로 결정
  const getLoginPath = () => {
    if (isSiteRoute && siteName) {
      return `/site/${siteName}/login`;
    }
    return '/site-login';
  };

  const getSignupPath = () => {
    if (isSiteRoute && siteName) {
      return `/site/${siteName}/signup`;
    }
    return '/site-signup';
  };

  return (
    <header className="bh">
      {/* 로고/유틸 바 */}
      <div className="bh-bar container">
        <div className="bh-left">
          {currentUser ? (
            <div className="bh-user-info">
              <span className="bh-util">
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
              </span>
              <button 
                className="bh-util" 
                onClick={onLogoutClick}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                로그아웃
              </button>
            </div>
          ) : (
            <div className="bh-auth-links">
              <NavLink to={getSignupPath()} className="bh-util">회원가입</NavLink>
              <NavLink to={getLoginPath()} className="bh-util">로그인</NavLink>
            </div>
          )}
        </div>

        <NavLink to={isSiteRoute && siteName ? `/site/${siteName}` : "/preview"} className="bh-logo" aria-label="홈">
          {logoStyle === 'image' && logoUrl ? (
            <img src={logoUrl} alt="사이트 로고" />
          ) : (
            <div className="bh-logo-text">
              <h1>{title || "나의 쇼핑몰"}</h1>
            </div>
          )}
        </NavLink>

        <div className="bh-right">
          {/* 검색/마이페이지/장바구니 */}
          <div className="bh-icons">
            <NavLink
              to="/search" className="bh-icon1" aria-label="검색"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSearchOpen(true); }}
            >
              <img src={IcSearch} alt="" />
            </NavLink>
            <NavLink to={isSiteRoute && siteName ? `/site/${siteName}/mypage` : "/mypage"} className="bh-icon2" aria-label="마이페이지">
              <img src={IcUser} alt="" />
            </NavLink>
            <NavLink to={getCartPath()} className="bh-icon3" aria-label="장바구니">
              <img src={IcBag} alt="" />
              {cartItemCount > 0 && (
                <span className="bh-cart-badge">{cartItemCount}</span>
              )}
            </NavLink>
          </div>
        </div>
      </div>

      {/* ===== 메인 내비게이션 ===== */}
      <nav className="bh-nav" aria-label="메인 메뉴">
        <div className="container bh-nav-inner">
          {/* 데스크톱 메뉴 */}
          <ul className="bh-menu">
            {categories.map((category, i) => (
              <li className="bh-item" key={category.id || i}>
                <a 
                  className="bh-link" 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onCategoryClick && onCategoryClick(category);
                  }}
                >
                  {category.name}
                </a>
                {category.subcategories && category.subcategories.length > 0 && (
                  <div className="bh-dropdown" role="menu">
                    {category.subcategories.map((subcategory, j) => (
                      <a 
                        key={subcategory.id || j}
                        className="bh-drop-link" 
                        href="#" 
                        role="menuitem"
                        onClick={(e) => {
                          e.preventDefault();
                          onCategoryClick && onCategoryClick(subcategory);
                        }}
                      >
                        {subcategory.name}
                      </a>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* 검색 오버레이 */}
      <div className={`bh-ol ${searchOpen ? "open" : ""}`} aria-hidden={!searchOpen}>
        <div className="bh-ol-bg" onClick={() => setSearchOpen(false)} />
        <div
          className="bh-ol-center"
          ref={searchBoxRef}
          onClick={(e) => e.stopPropagation()}
          role="dialog" aria-modal="true"
        >
          <div className="bh-search-container">
            <input
              type="text"
              className="bh-ol-input"
              placeholder={placeholder || "검색어를 입력하세요"}
              autoFocus={searchOpen}
              value={searchQuery || ""}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onSearchSubmit && onSearchSubmit(e.target.value);
                  setSearchOpen(false);
                }
              }}
            />
            <button 
              className="bh-search-btn"
              onClick={() => {
                onSearchSubmit && onSearchSubmit(searchQuery);
                setSearchOpen(false);
              }}
            >
              검색
            </button>
          </div>
          <button className="bh-ol-close" aria-label="닫기" onClick={() => setSearchOpen(false)}>
            닫기
          </button>
        </div>
      </div>
    </header>
  );
};

export default DropdownMenu;