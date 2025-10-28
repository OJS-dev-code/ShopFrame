// 소셜 로그인 유틸리티 함수들
import { loadKakaoSDK, kakaoConfig } from './kakaoConfig';

// 카카오 로그인 초기화
export const initKakaoSDK = async () => {
  try {
    return await loadKakaoSDK();
  } catch (error) {
    throw new Error('카카오 SDK 로드 실패: ' + error.message);
  }
};

// 카카오 로그인
export const loginWithKakao = async () => {
  try {
    const Kakao = await initKakaoSDK();
    
    return new Promise((resolve, reject) => {
      Kakao.Auth.login({
        success: (authObj) => {
          // 사용자 정보 가져오기
          Kakao.API.request({
            url: kakaoConfig.api.userInfoUrl,
            success: (res) => {
              const userInfo = {
                id: res.id,
                email: res.kakao_account?.email,
                nickname: res.kakao_account?.profile?.nickname,
                profile_image: res.kakao_account?.profile?.profile_image_url,
                access_token: authObj.access_token
              };
              resolve(userInfo);
            },
            fail: (error) => {
              reject(error);
            }
          });
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    throw new Error('카카오 로그인 초기화 실패: ' + error.message);
  }
};

// Firebase 커스텀 토큰 생성 (서버에서 구현 필요)
export const createCustomToken = async (provider, userInfo) => {
  try {
    // 실제로는 서버에서 커스텀 토큰을 생성해야 함
    // 여기서는 시뮬레이션으로 처리
    const response = await fetch('/api/auth/custom-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider,
        userInfo
      })
    });
    
    if (!response.ok) {
      throw new Error('커스텀 토큰 생성 실패');
    }
    
    const { customToken } = await response.json();
    return customToken;
  } catch (error) {
    console.error('커스텀 토큰 생성 실패:', error);
    throw error;
  }
};
