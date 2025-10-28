import React, { useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { SiteContext } from '../context/SiteContext';
import { saveSiteUser, getCurrentSiteName } from '../utils/siteUserManager';
import MegaMenu from './MegaMenu';
import Footer from './Footer';
import './SignupStep2.scss';

function SignupStep2() {
  const navigate = useNavigate();
  const { siteData } = useContext(SiteContext);
  
  // 입력값 상태
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [baseAddress, setBaseAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('010');
  const [phoneMiddle, setPhoneMiddle] = useState('');
  const [phoneLast, setPhoneLast] = useState('');
  const [email, setEmail] = useState('');
  
  // 유효성 상태
  const [showSuccess, setShowSuccess] = useState(false);
  const [idError, setIdError] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwMismatch, setPwMismatch] = useState('');
  
  // 주소검색 레이어
  const [showPostcode, setShowPostcode] = useState(false);
  const postcodeLayerRef = useRef();
  const detailAddressRef = useRef();
  
  // 비밀번호 보기 토글
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  // 유효성 검사
  const validateId = (value) => {
    const hasLower = /[a-z]/.test(value);
    const hasDigit = /[0-9]/.test(value);
    const validLength = value.length >= 4 && value.length <= 16;
    const validChars = /^[a-z0-9]+$/.test(value);
    if (!value) return '';
    if (!(hasLower && hasDigit && validLength && validChars)) {
      return '아이디는 영문소문자/숫자, 4~16자로 입력하세요.';
    }
    return '';
  };
  
  const validatePw = (value) => {
    let types = 0;
    if (/[a-zA-Z]/.test(value)) types++;
    if (/[0-9]/.test(value)) types++;
    if (/[@$!%*?&]/.test(value)) types++;
    if (!value) return '';
    if (value.length < 8 || value.length > 16 || types < 2) {
      return '비밀번호는 영문 대소문자/숫자/특수문자 중 2가지 이상 조합, 8~16자로 입력하세요.';
    }
    return '';
  };
  
  const validatePwMatch = (pw, confirm) => {
    if (!confirm) return '';
    if (pw !== confirm) return '비밀번호가 일치하지 않습니다.';
    return '';
  };

  // 가입하기 버튼 활성화 조건
  const isValid =
    userId &&
    password &&
    confirmPassword &&
    name &&
    phoneMiddle &&
    phoneLast &&
    email &&
    !validateId(userId) &&
    !validatePw(password) &&
    !validatePwMatch(password, confirmPassword);

  // 입력 핸들러
  const handleIdChange = (e) => {
    setUserId(e.target.value);
    setIdError(validateId(e.target.value));
  };
  
  const handlePwChange = (e) => {
    setPassword(e.target.value);
    setPwError(validatePw(e.target.value));
    setPwMismatch(validatePwMatch(e.target.value, confirmPassword));
  };
  
  const handleConfirmPwChange = (e) => {
    setConfirmPassword(e.target.value);
    setPwMismatch(validatePwMatch(password, e.target.value));
  };

  // 주소검색 (카카오 우편번호 API)
  const handleAddressSearch = () => {
    setShowPostcode(true);
    if (!window.daum || !window.daum.Postcode) {
      const script = document.createElement('script');
      script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.onload = openPostcode;
      document.body.appendChild(script);
    } else {
      openPostcode();
    }
  };
  
  const openPostcode = () => {
    if (!window.daum || !window.daum.Postcode) return;
    new window.daum.Postcode({
      oncomplete: function(data) {
        setPostalCode(data.zonecode);
        setBaseAddress(data.roadAddress || data.jibunAddress);
        setShowPostcode(false);
        setTimeout(() => {
          if (detailAddressRef.current) detailAddressRef.current.focus();
        }, 100);
      },
      onclose: function() {
        setShowPostcode(false);
      },
      width: '100%',
      height: '400',
    }).embed(postcodeLayerRef.current);
  };

  // 가입하기 버튼 클릭 (Firebase Auth 연동)
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // 사이트별 사용자 데이터 저장
      const siteName = getCurrentSiteName();
      if (siteName) {
        const userData = {
          uid: result.user.uid,
          email: email,
          displayName: name,
          userId: userId,
          phone: `${phonePrefix}-${phoneMiddle}-${phoneLast}`,
          address: {
            postalCode: postalCode,
            baseAddress: baseAddress,
            detailAddress: detailAddress
          },
          createdAt: new Date().toISOString(),
          isSiteUser: true
        };
        
        await saveSiteUser(siteName, result.user.uid, userData);
        console.log(`사이트 ${siteName}에 사용자 데이터 저장 완료`);
      }
      
      setShowSuccess(true);
    } catch (error) {
      console.error('회원가입 실패:', error);
      alert('회원가입에 실패했습니다. 이미 가입된 이메일이거나, 비밀번호가 약합니다.');
    }
  };
  
  // 팝업에서 홈으로 가기
  const goHome = () => {
    const siteName = getCurrentSiteName();
    if (siteName) {
      navigate(`/site/${siteName}`);
    } else {
      navigate('/site/default');
    }
  };
  
  // 취소/뒤로가기
  const handleCancel = () => {
    const siteName = getCurrentSiteName();
    if (siteName) {
      navigate(`/site/${siteName}/login`);
    } else {
      navigate('/');
    }
  };
  
  const handleBack = () => {
    const siteName = getCurrentSiteName();
    if (siteName) {
      navigate(`/site/${siteName}/signup/step1`);
    } else {
      navigate('/signup/step1');
    }
  };

  return (
    <div className="signup-page">
      <MegaMenu categories={siteData.categories} />
      <div className="signup-container">
        {/* 주소검색 레이어 */}
        {showPostcode && (
          <div id="postcodeLayer" style={{display:'flex',position:'fixed',zIndex:1000,left:0,top:0,right:0,bottom:0,background:'rgba(0,0,0,0.3)',alignItems:'center',justifyContent:'center'}}>
            <div className="layer-content" style={{position:'relative',background:'#fff',borderRadius:8,boxShadow:'0 4px 24px rgba(0,0,0,0.18)',padding:16,width:'100%',maxWidth:500,minWidth:320}}>
              <button className="close-btn" onClick={()=>setShowPostcode(false)} style={{display:'block',margin:'0 0 8px auto',background:'none',border:'none',fontSize:18,cursor:'pointer'}}>×</button>
              <div ref={postcodeLayerRef} style={{width:'100%',height:400}}></div>
            </div>
          </div>
        )}
        
        <main className="main-content">
          <h1 className="page-title">회원가입</h1>
          
          {/* 진행 단계 표시 */}
          <div className="progress-steps">
            <div className="step">
              <button className="link" onClick={() => {
                const siteName = getCurrentSiteName();
                if (siteName) {
                  navigate(`/site/${siteName}/signup/step1`);
                } else {
                  navigate('/signup/step1');
                }
              }} style={{background:'none',border:'none',padding:0}}>
                <div className="step-number">1</div>
                <span className="step-text">약관동의</span>
              </button>
            </div>
            <div className="step-line"></div>
            <div className="step active">
              <div className="step-number">2</div>
              <span className="step-text">정보입력</span>
            </div>
            <div className="step-line"></div>
            <div className="step">
              <div className="step-number">3</div>
              <span className="step-text">가입완료</span>
            </div>
          </div>
          
          {/* 정보입력 폼 */}
          <form onSubmit={handleRegister} autoComplete="off">
            <div className="form-section">
              <h2 className="form-section-title">회원인증</h2>
              <div className="form-row">
                <label className="form-label required label-membertype">회원구분</label>
                <div className="form-input-group">
                  <div className="radio-group">
                    <label className="radio-item">
                      <input type="radio" name="memberType" value="individual" className="radio-input" checked readOnly />
                      <span className="radio-label">개인회원</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <div className="form-section-title-row">
                <h2 className="form-section-title">기본정보</h2>
                <div className="required-notice"><span className="dot">•</span>필수입력사항</div>
              </div>
              
              {/* 아이디 */}
              <div className="form-row">
                <label className="form-label required label-id">아이디</label>
                <div className="form-input-group">
                  <input type="text" className={`form-input${idError ? ' error' : ''}`} value={userId} onChange={handleIdChange} placeholder="아이디를 입력하세요" />
                  {idError && <div className="form-hint" style={{color:'#FF0000'}}>{idError}</div>}
                  {!idError && <div className="form-hint" style={{color:'#999999'}}>(영문소문자/숫자, 4~16자)</div>}
                </div>
              </div>
              
              {/* 비밀번호 */}
              <div className="form-row">
                <label className="form-label required label-password">비밀번호</label>
                <div className="form-input-group" style={{position:'relative'}}>
                  <input type={showPw ? 'text' : 'password'} className={`form-input${pwError ? ' error' : ''}`} value={password} onChange={handlePwChange} placeholder="비밀번호를 입력하세요" id="password" />
                  <button type="button" className="pw-toggle-btn" tabIndex="-1" aria-label="비밀번호 보기" style={{position:'absolute',top:'50%',right:12,transform:'translateY(-50%)',background:'none',border:'none',padding:0,cursor:'pointer',zIndex:10}} onClick={()=>setShowPw(v=>!v)}>
                    {showPw ? (
                      <svg width="20" height="20" viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" stroke="#007AFF" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="#007AFF" strokeWidth="2"/><line x1="4" y1="20" x2="20" y2="4" stroke="#007AFF" strokeWidth="2"/></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" stroke="#999" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="#999" strokeWidth="2"/></svg>
                    )}
                  </button>
                  {pwError && <div className="form-hint" style={{color:'#FF0000'}}>{pwError}</div>}
                  {!pwError && <div className="form-hint" style={{color:'#999999'}}>(영문 대소문자/숫자/특수문자 중 2가지 이상 조합, 8~16자)</div>}
                </div>
              </div>
              
              {/* 비밀번호 확인 */}
              <div className="form-row">
                <label className="form-label required label-confirm">비밀번호 확인</label>
                <div className="form-input-group" style={{position:'relative'}}>
                  <input type={showPw2 ? 'text' : 'password'} className={`form-input${pwMismatch ? ' error' : ''}`} value={confirmPassword} onChange={handleConfirmPwChange} placeholder="비밀번호를 다시 입력하세요" id="confirmPassword" ref={detailAddressRef} />
                  <button type="button" className="pw-toggle-btn" tabIndex="-1" aria-label="비밀번호 보기" style={{position:'absolute',top:'50%',right:12,transform:'translateY(-50%)',background:'none',border:'none',padding:0,cursor:'pointer',zIndex:10}} onClick={()=>setShowPw2(v=>!v)}>
                    {showPw2 ? (
                      <svg width="20" height="20" viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" stroke="#007AFF" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="#007AFF" strokeWidth="2"/><line x1="4" y1="20" x2="20" y2="4" stroke="#007AFF" strokeWidth="2"/></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" stroke="#999" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="#999" strokeWidth="2"/></svg>
                    )}
                  </button>
                  {pwMismatch && <div className="form-hint" style={{color:'#FF0000'}}>{pwMismatch}</div>}
                </div>
              </div>
              
              {/* 이름 */}
              <div className="form-row">
                <label className="form-label required label-name">이름</label>
                <div className="form-input-group">
                  <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="이름을 입력하세요" />
                </div>
              </div>
              
              {/* 주소 */}
              <div className="form-row">
                <label className="form-label">주소</label>
                <div className="form-input-group">
                  <div className="address-group">
                    <div className="address-row">
                      <input type="text" className="address-input" value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="우편번호" readOnly />
                      <button type="button" className="address-search-btn" onClick={handleAddressSearch}>주소검색</button>
                    </div>
                    <input type="text" className="address-input" value={baseAddress} onChange={e => setBaseAddress(e.target.value)} placeholder="기본주소" readOnly />
                    <input type="text" className="address-input" value={detailAddress} onChange={e => setDetailAddress(e.target.value)} placeholder="나머지 주소(선택 입력 가능)" ref={detailAddressRef} />
                  </div>
                </div>
              </div>
              
              {/* 휴대전화 */}
              <div className="form-row">
                <label className="form-label required label-phone">휴대전화</label>
                <div className="form-input-group">
                  <div className="phone-group">
                    <select className="phone-select" value={phonePrefix} onChange={e => setPhonePrefix(e.target.value)}>
                      <option value="010">010</option>
                      <option value="011">011</option>
                      <option value="016">016</option>
                      <option value="017">017</option>
                      <option value="018">018</option>
                      <option value="019">019</option>
                    </select>
                    <span className="phone-separator">-</span>
                    <input type="text" className="phone-input" maxLength={4} value={phoneMiddle} onChange={e => setPhoneMiddle(e.target.value.replace(/[^0-9]/g, ''))} />
                    <span className="phone-separator">-</span>
                    <input type="text" className="phone-input" maxLength={4} value={phoneLast} onChange={e => setPhoneLast(e.target.value.replace(/[^0-9]/g, ''))} />
                  </div>
                </div>
              </div>
              
              {/* 이메일 */}
              <div className="form-row">
                <label className="form-label required label-email">이메일</label>
                <div className="form-input-group">
                  <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="이메일을 입력하세요" />
                </div>
              </div>
            </div>
            
            {/* 버튼 */}
            <div className="button-section">
              <div className="button-group">
                <button className="cancel-btn" type="button" onClick={handleCancel}>취소</button>
                <button className="register-btn" type="submit" disabled={!isValid}>가입하기</button>
              </div>
            </div>
          </form>
        </main>
      </div>
      
      <Footer footerData={siteData.footer} />
      
      {showSuccess && (
        <div id="successPopup" style={{display:'flex',position:'fixed',zIndex:2000,left:0,top:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.3)',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:'32px 24px 24px 24px',borderRadius:'12px',boxShadow:'0 4px 24px rgba(0,0,0,0.18)',maxWidth:'320px',width:'90%',textAlign:'center'}}>
            <h2 style={{fontSize:'20px',fontWeight:700,color:'#007AFF',marginBottom:16}}>회원가입이 완료되었습니다!</h2>
            <button onClick={goHome} style={{background:'#007AFF',color:'#fff',fontSize:16,fontWeight:600,padding:'10px 0',width:'100%',border:'none',borderRadius:6,cursor:'pointer'}}>홈으로 가기</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SignupStep2;
