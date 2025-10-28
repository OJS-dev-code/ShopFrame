import React, { useState, useContext, useEffect } from 'react';
import { SiteContext } from '../context/SiteContext';
import './MypageCoupons.scss';

const MypageCoupons = () => {
  const { currentUser } = useContext(SiteContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [userCoupons, setUserCoupons] = useState([]);

  // 신규회원 여부 확인 및 쿠폰 설정
  useEffect(() => {
    if (currentUser) {
      const isNewUser = currentUser.metadata?.creationTime && 
        (new Date() - new Date(currentUser.metadata.creationTime)) < (7 * 24 * 60 * 60 * 1000);
      
      if (isNewUser) {
        setUserCoupons([
          {
            id: 'welcome-shipping',
            name: '신규회원 배송비 무료 쿠폰',
            description: '배송비 3000원 이상',
            discount: '-3000원',
            type: 'shipping',
            expiryDate: '2024-12-31',
            isUsed: false
          }
        ]);
      } else {
        setUserCoupons([]);
      }
    } else {
      setUserCoupons([]);
    }
  }, [currentUser]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCouponCode('');
  };

  const handleSubmitCoupon = () => {
    // 쿠폰 등록 로직
    console.log('쿠폰 등록:', couponCode);
    handleCloseModal();
  };

  return (
    <div className="coupons-page">

      <div className="coupons-section">
        <h2>쿠폰</h2>
        
        <div className="coupon-actions">
          <div className="action-item">
            <div className="action-content">
              <div className="text-content">
                <p>보유하고 계시는</p>
                <p>쿠폰번호를 등록하세요.</p>
              </div>
              <button className="action-btn" onClick={handleOpenModal}>
                쿠폰 등록하기
                <span 
                  className="arrow"
                  style={{
                    backgroundImage: "url('/icons/right-arrow.png')",
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    width: "16px",
                    height: "16px",
                    display: "inline-block"
                  }}
                ></span>
              </button>
            </div>
          </div>
        </div>

        <div className="coupon-list">
          <div className="list-header">
            <div className="header-item">혜택</div>
            <div className="header-item">쿠폰명</div>
            <div className="header-item">쿠폰사용조건</div>
            <div className="header-item">사용기간</div>
          </div>
          
          {userCoupons.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⚠️</div>
              <p>보유하신 쿠폰이 없습니다.</p>
            </div>
          ) : (
            userCoupons.map((coupon) => (
              <div key={coupon.id} className={`coupon-item ${coupon.isUsed ? 'used' : ''}`}>
                <div className="coupon-benefit">
                  <span className="benefit-text">{coupon.discount}</span>
                </div>
                <div className="coupon-name">
                  <span className="name-text">{coupon.name}</span>
                </div>
                <div className="coupon-condition">
                  <span className="condition-text">{coupon.description}</span>
                </div>
                <div className="coupon-expiry">
                  <span className="expiry-text">{coupon.expiryDate}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="coupon-info">
          <ul>
            <li>발급받으신 쿠폰을 온라인에서 사용하시는 경우 다운로드 후 주문/결제 시 적용하실 수 있습니다.</li>
            <li>사용기간이 만료되거나 사용한 쿠폰은 보유 목록에서 자동으로 삭제됩니다.</li>
            <li>주문/취소 시 이용기간이 남아 있는 쿠폰인 경우 재발급됩니다.</li>
          </ul>
        </div>
      </div>

      {/* 쿠폰 등록 모달 */}
      {isModalOpen && (
        <div className="coupon-modal-overlay">
          <div className="coupon-modal-content">
            <div className="coupon-modal-header">
              <h3>쿠폰등록</h3>
              <button className="coupon-close-btn" onClick={handleCloseModal}>×</button>
            </div>
            
            <div className="coupon-modal-body">
              <div className="coupon-input-group">
                <label>쿠폰번호</label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="쿠폰번호를 입력하세요"
                />
              </div>
            </div>

            <div className="coupon-modal-actions">
              <button className="coupon-cancel-btn" onClick={handleCloseModal}>
                취소
              </button>
              <button className="coupon-submit-btn" onClick={handleSubmitCoupon}>
                등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MypageCoupons;
