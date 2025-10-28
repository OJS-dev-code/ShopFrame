import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  REST_API_KEY, 
  REDIRECT_URI, 
  CLIENT_SECRET 
} from '../config/kakaoConfig';
// Firebase auth imports removed - using local authentication
import { saveSiteUser } from '../utils/siteUserManager';
import { SiteContext } from '../context/SiteContext';
import axios from 'axios';
import './KakaoAuth.scss';


const KakaoAuth = () => {
  const navigate = useNavigate();
  const { setIsKakaoLoggingIn } = useContext(SiteContext);
  
  // URL에서 인가 코드 추출
  const code = new URL(document.URL).searchParams.get('code');

  const getKakaoAuthToken = async () => {
    console.log('KakaoAuth 컴포넌트 로드됨');
    console.log('URL에서 추출한 code:', code);
    
    if (!code) {
      console.log('인가 코드가 없음');
      alert('인가 코드가 없습니다. 다시 시도해주세요.');
      navigate('/');
      return;
    }

    try {
      console.log('카카오 토큰 요청 시작');
      
      // 카카오 토큰 요청
      const payload = {
        grant_type: 'authorization_code',
        client_id: REST_API_KEY,
        redirect_uri: REDIRECT_URI,
        code,
        client_secret: CLIENT_SECRET,
      };

      console.log('카카오 토큰 요청 payload:', payload);

      const response = await axios.post(
        'https://kauth.kakao.com/oauth/token',
        payload,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
        }
      );

      console.log('카카오 토큰 응답 성공:', response.data);
      console.log('응답 데이터 구조:', {
        access_token: response.data.access_token ? '존재' : '없음',
        id_token: response.data.id_token ? '존재' : '없음',
        refresh_token: response.data.refresh_token ? '존재' : '없음',
        token_type: response.data.token_type,
        expires_in: response.data.expires_in
      });

      // 카카오 사용자 정보 가져오기
      console.log('카카오 사용자 정보 요청 시작');
      const userInfoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: {
          'Authorization': `Bearer ${response.data.access_token}`
        }
      });
      
      console.log('카카오 사용자 정보:', userInfoResponse.data);

      console.log('카카오 로그인 성공 - 로컬 인증 처리');
      
      // 카카오 사용자 정보 추출
      const kakaoUser = userInfoResponse.data;
      const userData = {
        uid: `kakao_${kakaoUser.id}`,
        displayName: kakaoUser.kakao_account?.profile?.nickname || '카카오 사용자',
        email: kakaoUser.kakao_account?.email || `kakao_${kakaoUser.id}@kakao.local`,
        photoURL: kakaoUser.kakao_account?.profile?.profile_image_url || null,
        provider: 'kakao',
        kakaoId: kakaoUser.id
      };
      
      console.log('카카오 사용자 데이터:', userData);
      
      // 로컬 스토리지에 사용자 정보 저장
      localStorage.setItem('kakaoUser', JSON.stringify(userData));
      localStorage.setItem('isLoggedIn', 'true');
      
      // 카카오 로그인 진행 상태 초기화
      setIsKakaoLoggingIn(false);
      localStorage.removeItem('kakaoLoggingIn');
      
      // Firebase 인증 없이 로컬 인증으로 처리
      const mockUser = {
        uid: userData.uid,
        displayName: userData.displayName,
        email: userData.email,
        photoURL: userData.photoURL,
        provider: 'kakao'
      };
      
      console.log('로컬 인증 완료:', mockUser);
      
      // 새 창에서 열린 경우 부모 창 새로고침 후 창 닫기
      if (window.opener) {
        console.log('부모 창 새로고침 후 창 닫기');
        window.opener.location.reload();
        window.close();
        return;
      }
      
      // 사용자 정보 저장 (필요시)
      const user = mockUser;
      console.log('사용자 정보:', {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        provider: 'kakao'
      });

      // 현재 경로 확인
      const currentPath = window.location.pathname;
      const isSiteRoute = currentPath.startsWith('/site/');
      const siteName = isSiteRoute ? currentPath.split('/')[2] : null;
      
      // 사이트별 웹사이트에서 로그인한 경우 해당 사이트로, 관리자 로그인인 경우 에디터로 이동
      if (isSiteRoute && siteName) {
        try {
          // 사이트별 사용자 데이터 저장
          const siteUserData = {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            provider: 'kakao',
            kakaoId: userData.kakaoId,
            loginCount: 1,
            lastLoginAt: new Date().toISOString()
          };
          
          await saveSiteUser(siteName, user.uid, siteUserData);
          console.log(`사이트 ${siteName}에 사용자 데이터 저장 완료`);
        } catch (error) {
          console.error('사이트 사용자 데이터 저장 실패:', error);
          // 저장 실패해도 로그인은 계속 진행
        }
        
        // 해당 사이트로 이동
        navigate(`/site/${siteName}`);
      } else {
        // 관리자 로그인 - 에디터로 이동
        navigate('/editor');
      }
      
    } catch (error) {
      console.error('카카오 로그인 오류:', error);
      alert('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      navigate('/');
    }
  };

  useEffect(() => {
    console.log('KakaoAuth useEffect 실행됨');
    console.log('현재 URL:', window.location.href);
    console.log('URL 파라미터:', window.location.search);
    
    // 즉시 실행 (지연 제거)
    getKakaoAuthToken();
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      flexDirection: 'column'
    }}>
      <h1>카카오 로그인 콜백 페이지</h1>
      <p>현재 URL: {window.location.href}</p>
      <p>URL 파라미터: {window.location.search}</p>
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>카카오 로그인 진행 중...</p>
      </div>
    </div>
  );
};

export default KakaoAuth;
