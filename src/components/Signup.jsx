import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import './Signup.scss';

const homeImg = process.env.PUBLIC_URL + '/home.jpg';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (!agreeTerms || !agreePrivacy) {
      alert('필수 약관에 동의해주세요.');
      return;
    }
    
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('회원가입에 성공했습니다.');
      
      // 현재 경로가 /site/로 시작하는지 확인
      const isSiteRoute = location.pathname.startsWith('/site/');
      if (isSiteRoute) {
        // 사이트 경로인 경우 해당 사이트로 이동
        const pathParts = location.pathname.split('/');
        const siteName = pathParts[2];
        navigate(`/site/${siteName}`);
      } else {
        // 관리자 경로인 경우 루트로 이동
        navigate('/');
      }
    } catch (error) {
      alert('회원가입에 실패했습니다: ' + error.message);
    }
  };

  return (
    <div className="signup-wrap">
      <div className="signup-container">
        {/* 상단 환영 메시지 */}
        <div className="signup-header">
          <h1 className="signup-title">회원가입</h1>
          <p className="signup-subtitle">회원가입하여 서비스를 이용해보세요.</p>
        </div>

        {/* 회원가입 헤더 */}
        <div className="signup-form-header">
          <div className="signup-form-title">회원가입</div>
        </div>

        {/* 회원가입 폼 */}
        <main className="signup-main">
          <form className="signup-form" onSubmit={handleSignup}>
            <div className="input-group">
              <input 
                name="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="input"
                placeholder="이메일"
                required
              />
            </div>
            
            <div className="input-group">
              <input 
                name="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="input"
                placeholder="비밀번호"
                required
              />
            </div>

            <div className="input-group">
              <input 
                name="confirmPassword" 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className="input"
                placeholder="비밀번호 확인"
                required
              />
            </div>

            <div className="input-group">
              <input 
                name="name" 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="input"
                placeholder="이름"
                required
              />
            </div>

            <div className="input-group">
              <input 
                name="phone" 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                className="input"
                placeholder="휴대폰 번호"
                required
              />
            </div>

            {/* 약관 동의 */}
            <div className="agreement-section">
              <h3 className="agreement-title">약관 동의</h3>
              
              <div className="agreement-item">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  required
                />
                <span className="agreement-text">
                  <strong>이용약관</strong>에 동의합니다 (필수)
                </span>
              </div>
              
              <div className="agreement-item">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  required
                />
                <span className="agreement-text">
                  <strong>개인정보처리방침</strong>에 동의합니다 (필수)
                </span>
              </div>
              
              <div className="agreement-item">
                <input
                  type="checkbox"
                  checked={agreeMarketing}
                  onChange={(e) => setAgreeMarketing(e.target.checked)}
                />
                <span className="agreement-text">
                  <strong>마케팅 정보 수신</strong>에 동의합니다 (선택)
                </span>
              </div>
            </div>

            <button type="submit" className="signup-btn">회원가입</button>
          </form>
          
          {/* 하단 링크들 */}
          <div className="signup-links">
            <div className="signup-links-content">
              <span className="signup-links-text">이미 계정이 있으신가요?</span>
              <button
                onClick={() => {
                  // 현재 경로가 /site/로 시작하는지 확인
                  const isSiteRoute = location.pathname.startsWith('/site/');
                  if (isSiteRoute) {
                    // 사이트 경로인 경우 /site/sitename/login으로 이동
                    const pathParts = location.pathname.split('/');
                    const siteName = pathParts[2];
                    navigate(`/site/${siteName}/login`);
                  } else {
                    // 관리자 경로인 경우 /login으로 이동
                    navigate('/login');
                  }
                }}
                className="link"
              >
                로그인
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Signup;
