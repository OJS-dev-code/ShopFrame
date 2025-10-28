import React from "react";
import "./Footer.scss";

const Footer = ({ footerData = {} }) => {
  // 기본값 설정
  const {
    mallName = "",
    logoStyle = "text",
    logoUrl = "",
    customerPhone = "",
    operatingHours = "",
    holidays = "",
    showNoticeButton = false,
    showInquiryButton = false,
    showCustomerServiceButton = false,
    accounts = [],
    returnAddress = "",
    companyName = "",
    representative = "",
    address = "",
    businessNumber = "",
    ecommerceReport = "",
    privacyManager = "",
    instagram = "",
    facebook = "",
    youtube = "",
    kakao = "",
    twitter = "",
    naver = "",
    showFacebookButton = false,
    showKakaoButton = false,
    showTwitterButton = false,
    showYoutubeButton = false,
    showInstagramButton = false,
    showNaverButton = false,
    accountHolder = ""
  } = footerData;

  // 표시용 데이터 처리
  const displayMallName = mallName || '[쇼핑몰 이름]';
  const displayCompanyName = companyName || '[회사명]';
  const displayReturnAddress = returnAddress || '[반품 주소]';

  // 고객센터 버튼 클릭 핸들러
  const handleButtonClick = (buttonType) => {
    alert('죄송합니다! 아직 준비중입니다!');
  };

  // 네비게이션 링크 클릭 핸들러
  const handleNavClick = (e) => {
    e.preventDefault();
    alert('죄송합니다! 아직 준비중입니다!');
  };

  return (
    <footer className="footer">
      <div className="footer-top">
        {/* 고객센터 */}
        <div className="footer-column">
          <h3>CUSTOMER CENTER</h3>
          <div className="phone">{customerPhone || '1599-0000'}</div>
          <div className="info">{operatingHours || '운영시간 10:00-17:00 Lunch 13:00-14:00'}</div>
          <div className="info">{holidays || '토/일/공휴일(임시공휴일 포함) 휴무'}</div>
          <div className="footer-buttons">
            {showNoticeButton && (
              <button className="footer-btn" onClick={() => handleButtonClick('notice')}>
                공지사항
              </button>
            )}
            {showInquiryButton && (
              <button className="footer-btn" onClick={() => handleButtonClick('inquiry')}>
                상품문의
              </button>
            )}
            {showCustomerServiceButton && (
              <button className="footer-btn" onClick={() => handleButtonClick('customerService')}>
                고객센터
              </button>
            )}
          </div>
        </div>

        {/* 은행 정보 */}
        {accounts.length > 0 && (
          <div className="footer-column">
            <h3>BANK INFO</h3>
            <div className="sub-heading">입금계좌</div>
            <ul className="account-list">
              {accounts.map((account, index) => (
                <li key={index}>
                  {account.bank} {account.number}
                </li>
              ))}
            </ul>
            {accountHolder && (
              <div className="account-holder">예금주: {accountHolder}</div>
            )}
          </div>
        )}

        {/* 반품 주소 */}
        <div className="footer-column">
          <h3>RETURN ADDRESS</h3>
          <div className="sub-heading">우체국</div>
          <div className="address">{displayReturnAddress}</div>
          <div className="note">타택배 이용 시 (선불결제)</div>
        </div>

        {/* SNS */}
        <div className="footer-column">
          <h3>SNS</h3>
          <div className="sns-icons">
            {showFacebookButton && (
              facebook ? (
                <a href={facebook} className="sns-icon facebook-icon" target="_blank" rel="noopener noreferrer">
                  <img src="/icons/Facebook_Logo_Primary.png" alt="Facebook" />
                </a>
              ) : (
                <div className="sns-icon facebook-icon">
                  <img src="/icons/Facebook_Logo_Primary.png" alt="Facebook" />
                </div>
              )
            )}
            {showKakaoButton && (
              kakao ? (
                <a href={kakao} className="sns-icon kakao-icon" target="_blank" rel="noopener noreferrer">
                  <img src="/icons/kakaologo.svg" alt="Kakao" />
                </a>
              ) : (
                <div className="sns-icon kakao-icon">
                  <img src="/icons/kakaologo.svg" alt="Kakao" />
                </div>
              )
            )}
            {showTwitterButton && (
              twitter ? (
                <a href={twitter} className="sns-icon twitter-icon" target="_blank" rel="noopener noreferrer">
                  <img src="/icons/x-logo-black.png" alt="X" />
                </a>
              ) : (
                <div className="sns-icon twitter-icon">
                  <img src="/icons/x-logo-black.png" alt="X" />
                </div>
              )
            )}
            {showYoutubeButton && (
              youtube ? (
                <a href={youtube} className="sns-icon youtube-icon" target="_blank" rel="noopener noreferrer">
                  <img src="/icons/youtube-logo.png" alt="YouTube" className="youtube-logo" />
                </a>
              ) : (
                <div className="sns-icon youtube-icon">
                  <img src="/icons/youtube-logo.png" alt="YouTube" className="youtube-logo" />
                </div>
              )
            )}
            {showInstagramButton && (
              instagram ? (
                <a href={instagram} className="sns-icon instagram-icon" target="_blank" rel="noopener noreferrer">
                  <img src="/icons/Instagram_Glyph_White.svg" alt="Instagram" />
                </a>
              ) : (
                <div className="sns-icon instagram-icon">
                  <img src="/icons/Instagram_Glyph_White.svg" alt="Instagram" />
                </div>
              )
            )}
            {showNaverButton && (
              naver ? (
                <a href={naver} className="sns-icon naver-icon" target="_blank" rel="noopener noreferrer">
                  <img src="/icons/naverblog-logo.svg" alt="Naver" />
                </a>
              ) : (
                <div className="sns-icon naver-icon">
                  <img src="/icons/naverblog-logo.svg" alt="Naver" />
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-content">
                  {/* 브랜드명 */}
                  <div className="brand-section">
                    <div className="brand-lines">
                      <div className="brand-line"></div>
                      <div className="brand-line"></div>
                      <div className="brand-line"></div>
                      <div className="brand-line"></div>
                    </div>
                    <div className="brand-name">
                      {logoStyle === 'image' && logoUrl ? (
                        <img src={logoUrl} alt={displayMallName} style={{ maxWidth: 400, maxHeight: 300 }} />
                      ) : (
                        <div className="mall-name">{displayMallName}</div>
                      )}
                    </div>
                  </div>

          {/* 네비게이션 및 회사 정보 */}
          <div className="content-section">
            <div className="navigation-links">
              <a href="#" className="nav-link" onClick={handleNavClick}>회사소개</a>
              <a href="#" className="nav-link" onClick={handleNavClick}>개인정보보호방침</a>
              <a href="#" className="nav-link" onClick={handleNavClick}>이용약관</a>
              <a href="#" className="nav-link" onClick={handleNavClick}>가이드</a>
              <a href="#" className="nav-link" onClick={handleNavClick}>제휴문의</a>
              <a href="#" className="nav-link" onClick={handleNavClick}>장소협찬제의</a>
              <a href="#" className="nav-link" onClick={handleNavClick}>고객센터</a>
            </div>

            <div className="company-info">
              <div className="company-name">
                법인명 : {displayCompanyName} 대표자 : {representative || '[대표자명]'} 주소 : {address || '[회사 주소]'}
              </div>
              <div>
                사업자등록번호 : {businessNumber || '[사업자등록번호]'} <a href="#" className="business-link" onClick={handleNavClick}>(사업자정보확인)</a> 통신판매신고 : {ecommerceReport || '[통신판매신고번호]'} 개인정보 보호 책임자 : {privacyManager || '[개인정보보호책임자]'}
              </div>
              <div className="copyright">
                Copyright © {displayCompanyName} ALL RIGHTS RESERVED.
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
