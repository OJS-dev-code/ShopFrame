import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './MypageSidebar.scss';

const MypageSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isSiteRoute = location.pathname.startsWith('/site/');
  const siteName = isSiteRoute ? location.pathname.split('/')[2] : null;
  const base = isSiteRoute && siteName ? `/site/${siteName}/mypage` : '/mypage';

  const menuItems = [
    { name: '주문배송조회', path: `${base}/orders` },
    { name: '리뷰', path: `${base}/reviews` },
    { name: '쿠폰', path: `${base}/coupons` },
    { name: '좋아요', path: `${base}/likes` },
    { name: '회원탈퇴', path: `${base}/withdrawal` }
  ];

  const handleMenuClick = (path) => {
    navigate(path);
  };

  const handleTitleClick = () => {
    navigate(base);
  };

  return (
    <div className="mypage-sidebar">
      <h2 className="mypage-sidebar-title" onClick={handleTitleClick}>마이페이지</h2>
      <nav className="mypage-sidebar-nav">
        <ul className="mypage-nav-list">
          {menuItems.map((item, index) => (
            <li key={index}>
              <button
                className={`mypage-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => handleMenuClick(item.path)}
              >
                {item.name}
              </button>
              {(item.name === '리뷰' || item.name === '좋아요') && (
                <div className="mypage-nav-divider"></div>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default MypageSidebar;