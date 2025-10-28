import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SiteContext } from '../context/SiteContext';
import { getCurrentSiteName } from '../utils/siteUserManager';
import MegaMenu from './MegaMenu';
import Footer from './Footer';
import './SignupStep1.scss';

const kakaoImg = process.env.PUBLIC_URL + '/icons/kakao_login_medium_narrow.png';
const naverImg = process.env.PUBLIC_URL + '/icons/btnG_완성형.png';

function SignupStep1() {
  const navigate = useNavigate();
  const { siteData } = useContext(SiteContext);
  // 약관 체크박스 상태
  const [agreements, setAgreements] = useState({
    all: false,
    terms1: false,
    terms2: false,
    terms3: false,
    terms4: false,
  });
  // 수신동의 토글
  const [smsAgree, setSmsAgree] = useState(false);
  const [emailAgree, setEmailAgree] = useState(false);
  // 소셜 로그인 모달
  const [socialLayer, setSocialLayer] = useState({ open: false, type: null });

  // 약관 전체동의/개별동의 핸들러
  const handleAllAgree = (checked) => {
    setAgreements({
      all: checked,
      terms1: checked,
      terms2: checked,
      terms3: checked,
      terms4: checked,
    });
  };
  const handleAgreement = (key, checked) => {
    const next = { ...agreements, [key]: checked };
    next.all = next.terms1 && next.terms2 && next.terms3 && next.terms4;
    setAgreements(next);
  };
  // 필수 약관 모두 체크 여부
  const requiredChecked = agreements.terms1 && agreements.terms2 && agreements.terms3;

  // 소셜 로그인 모달 내용
  const renderSocialLayer = () => {
    if (!socialLayer.open) return null;
    const type = socialLayer.type;
    const logo = type === 'kakao'
      ? <div className="social-mock-logo kakao">K</div>
      : <div className="social-mock-logo naver">N</div>;
    const title = type === 'kakao' ? '카카오 로그인' : '네이버 로그인';
    return (
      <div id="socialLoginLayer" style={{display:'block'}} onClick={() => setSocialLayer({ open: false, type: null })}>
        <div className="layer-content" onClick={e => e.stopPropagation()}>
          <button className="close-btn" onClick={() => setSocialLayer({ open: false, type: null })}>×</button>
          {logo}
          <div className="social-mock-title">{title}</div>
          <input type="text" placeholder="아이디 또는 이메일" style={{width:'90%',height:40,marginBottom:12,padding:'0 10px',border:'1px solid #ddd',borderRadius:4,fontSize:15}} />
          <input type="password" placeholder="비밀번호" style={{width:'90%',height:40,marginBottom:12,padding:'0 10px',border:'1px solid #ddd',borderRadius:4,fontSize:15}} />
          <button className="social-mock-btn" onClick={() => setSocialLayer({ open: false, type: null })}>로그인 성공</button>
        </div>
      </div>
    );
  };

  // 페이지 이동 핸들러
  const handleNext = () => {
    if (requiredChecked) {
      const siteName = getCurrentSiteName();
      if (siteName) {
        navigate(`/site/${siteName}/signup/step2`);
      } else {
        navigate('/signup/step2');
      }
    }
  };
  const handleCancel = () => {
    const siteName = getCurrentSiteName();
    if (siteName) {
      navigate(`/site/${siteName}/login`);
    } else {
      navigate('/');
    }
  };
  const handleBack = () => {
    navigate('/login');
  };

  return (
    <div className="signup-page">
      <MegaMenu 
        siteData={siteData}
        currentUser={null}
        onLogoutClick={() => {}}
      />
      <div className="signup-container">
        {renderSocialLayer()}
        {/* 메인 콘텐츠 */}
        <main className="main-content">
        {/* 제목 */}
        <h1 className="page-title">회원가입</h1>
        
        {/* 진행 단계 표시 */}
        <div className="progress-steps">
          <div className="step active">
            <div className="step-number">1</div>
            <span className="step-text">약관동의</span>
          </div>
          <div className="step-line"></div>
          <div className="step">
            <div className="step-number">2</div>
            <span className="step-text">정보입력</span>
          </div>
          <div className="step-line"></div>
          <div className="step">
            <div className="step-number">3</div>
            <span className="step-text">가입완료</span>
          </div>
        </div>
        {/* 약관 동의 섹션 */}
        <div className="agreement-section">
          <h2 className="section-title">이용약관 및 개인정보처리방침</h2>
          {/* 전체 동의 */}
          <div className="agreement-item main-agreement">
            <label className="checkbox-container">
              <input type="checkbox" className="checkbox-input" checked={agreements.all} onChange={e => handleAllAgree(e.target.checked)} />
              <span className="checkmark"></span>
              <span className="agreement-text">전체 동의</span>
            </label>
          </div>
          {/* 개별 약관들 */}
          <div className="agreement-list">
            <div className="agreement-item">
              <label className="checkbox-container">
                <input type="checkbox" className="checkbox-input" checked={agreements.terms1} onChange={e => handleAgreement('terms1', e.target.checked)} />
                <span className="checkmark"></span>
                <span className="agreement-text">[필수] 서비스 이용약관 동의</span>
              </label>
              <button className="view-btn" type="button" onClick={() => alert('서비스 이용약관의 전체 내용을 확인합니다.')}>보기</button>
            </div>
            <div className="agreement-item">
              <label className="checkbox-container">
                <input type="checkbox" className="checkbox-input" checked={agreements.terms2} onChange={e => handleAgreement('terms2', e.target.checked)} />
                <span className="checkmark"></span>
                <span className="agreement-text">[필수] 개인정보처리방침 동의</span>
              </label>
              <button className="view-btn" type="button" onClick={() => alert('개인정보처리방침의 전체 내용을 확인합니다.')}>보기</button>
            </div>
            <div className="agreement-item">
              <label className="checkbox-container">
                <input type="checkbox" className="checkbox-input" checked={agreements.terms3} onChange={e => handleAgreement('terms3', e.target.checked)} />
                <span className="checkmark"></span>
                <span className="agreement-text">[필수] 개인정보 제3자 제공 동의</span>
              </label>
              <button className="view-btn" type="button" onClick={() => alert('개인정보 제3자 제공 동의의 전체 내용을 확인합니다.')}>보기</button>
            </div>
            <div className="agreement-item">
              <label className="checkbox-container">
                <input type="checkbox" className="checkbox-input" checked={agreements.terms4} onChange={e => handleAgreement('terms4', e.target.checked)} />
                <span className="checkmark"></span>
                <span className="agreement-text">[선택] 마케팅 정보 수신 동의</span>
              </label>
              <button className="view-btn" type="button" onClick={() => alert('마케팅 정보 수신 동의의 전체 내용을 확인합니다.')}>보기</button>
            </div>
          </div>
        </div>
        
        {/* 다음/취소 버튼 */}
        <div className="button-section">
          <div className="button-group">
            <button className="cancel-btn" type="button" onClick={handleCancel}>취소</button>
            <button className="next-btn" type="button" onClick={handleNext} disabled={!requiredChecked}>다음</button>
          </div>
        </div>
        </main>
      </div>
      <Footer footerData={siteData.footer} />
    </div>
  );
}

export default SignupStep1;
