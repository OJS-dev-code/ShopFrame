import React, { useContext } from 'react';
import { KAKAO_AUTH_URL } from '../config/kakaoConfig';
import { SiteContext } from '../context/SiteContext';
import './KakaoLogin.scss';

const KakaoLogin = () => {
  const { isKakaoLoggingIn, setIsKakaoLoggingIn } = useContext(SiteContext);
  
  const handleKakaoLogin = () => {
    console.log('카카오 로그인 버튼 클릭됨');
    console.log('KAKAO_AUTH_URL:', KAKAO_AUTH_URL);
    
    // 카카오 로그인 진행 상태 설정
    setIsKakaoLoggingIn(true);
    localStorage.setItem('kakaoLoggingIn', 'true');
    
    try {
      console.log('카카오 인증 페이지로 새 창에서 열기 시도 중...');
      
      // 새 창에서 카카오 인증 페이지 열기
      const newWindow = window.open(KAKAO_AUTH_URL, '_blank', 'width=500,height=600,scrollbars=yes,resizable=yes');
      
      if (newWindow) {
        console.log('새 창에서 카카오 인증 페이지 열기 성공');
        
        // 새 창이 닫힐 때를 감지하여 상태 초기화
        const checkClosed = setInterval(() => {
          if (newWindow.closed) {
            clearInterval(checkClosed);
            console.log('카카오 인증 창이 닫힘');
            // 창이 닫혔을 때 상태 초기화
            setIsKakaoLoggingIn(false);
            localStorage.removeItem('kakaoLoggingIn');
          }
        }, 1000);
        
        // 30초 후 자동으로 상태 초기화 (타임아웃)
        setTimeout(() => {
          clearInterval(checkClosed);
          setIsKakaoLoggingIn(false);
          localStorage.removeItem('kakaoLoggingIn');
        }, 30000);
        
      } else {
        console.log('팝업 차단됨, 현재 창에서 이동');
        // 팝업이 차단된 경우 현재 창에서 이동
        window.location.href = KAKAO_AUTH_URL;
      }
    } catch (error) {
      console.error('카카오 로그인 리다이렉트 오류:', error);
      // 에러 시 상태 초기화
      setIsKakaoLoggingIn(false);
      localStorage.removeItem('kakaoLoggingIn');
    }
  };

  return (
    <button 
      type="button" 
      className="kakao-login-btn"
      onClick={handleKakaoLogin}
    >
      <img 
        src={process.env.PUBLIC_URL + '/icons/kakao_login_medium_narrow.png'} 
        alt="카카오 로그인" 
        className="kakao-login-img"
      />
    </button>
  );
};

export default KakaoLogin;
