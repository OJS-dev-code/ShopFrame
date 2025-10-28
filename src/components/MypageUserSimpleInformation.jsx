import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SiteContext } from '../context/SiteContext';
import './MypageUserSimpleInformation.scss';

const MypageUserSimpleInformation = () => {
  const context = useContext(SiteContext);
  const currentUser = context?.currentUser || null;
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState({
    userName: '000',
    coupons: 0,
    points: 0,
    isNewUser: false
  });
  
  useEffect(() => {
    if (currentUser) {
      // 사용자 이름 결정 (displayName > email의 @ 앞부분 > '000')
      const userName = currentUser.displayName || 
                      (currentUser.email ? currentUser.email.split('@')[0] : '000');
      
      // 신규회원 여부 확인 (7일 이내 가입)
      const isNewUser = currentUser.metadata?.creationTime && 
        (new Date() - new Date(currentUser.metadata.creationTime)) < (7 * 24 * 60 * 60 * 1000);
      
      // 신규회원 기본 혜택
      const coupons = isNewUser ? 1 : 0; // 배송비 무료 쿠폰 1개
      const points = isNewUser ? 2000 : 0; // 기본 적립금 2000원
      
      setUserInfo({
        userName,
        coupons,
        points,
        isNewUser
      });
    } else {
      // 로그인하지 않은 경우 기본값
      setUserInfo({
        userName: '000',
        coupons: 0,
        points: 0,
        isNewUser: false
      });
    }
  }, [currentUser]);

  // 쿠폰 클릭 핸들러
  const handleCouponClick = () => {
    // 현재 URL이 /site/siteName 형태인지 확인
    const isSiteRoute = location.pathname.startsWith('/site/');
    const siteName = isSiteRoute ? location.pathname.split('/')[2] : null;
    
    if (isSiteRoute && siteName) {
      navigate(`/site/${siteName}/mypage/coupons`);
    } else {
      navigate('/mypage/coupons');
    }
  };

  return (
    <div className="mypage-welcome-section">
      <div className="mypage-welcome-banner">
        <div className="mypage-top-section">
          <div className="mypage-user-info">
            <div 
              className="mypage-user-icon"
              style={{
                backgroundImage: "url('/icons/mypage-usericon.png')",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center"
              }}
            ></div>
            <span>{userInfo.userName}님 반갑습니다.</span>
          </div>
        </div>
        <div className="mypage-bottom-section">
          <div className="mypage-user-stats">
            <span 
              className="mypage-coupon-link"
              onClick={handleCouponClick}
            >
              쿠폰 <span className="mypage-number">{userInfo.coupons}</span>개
            </span>
            <span>적립금 <span className="mypage-number">{userInfo.points}</span>원</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MypageUserSimpleInformation;
