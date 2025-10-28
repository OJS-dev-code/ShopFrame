// URL명 중복 확인 및 관리 유틸리티
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * URL명 중복 확인
 * @param {string} urlName - 확인할 URL명
 * @param {string} currentUserId - 현재 사용자 ID (자신의 URL명은 제외)
 * @returns {boolean} 중복 여부 (true: 중복됨, false: 사용 가능)
 */
export const checkUrlNameDuplicate = async (urlName, currentUserId) => {
  try {
    // 모든 관리자의 사이트 데이터에서 URL명 확인
    const siteDataCollection = collection(db, 'siteData');
    const snapshot = await getDocs(siteDataCollection);
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const userId = doc.id;
      
      // 자신의 데이터는 제외
      if (userId === currentUserId) {
        continue;
      }
      
      // URL명 중복 확인
      if (data.siteEnglishName === urlName) {
        return true; // 중복됨
      }
    }
    
    return false; // 사용 가능
  } catch (error) {
    console.error('URL명 중복 확인 실패:', error);
    return false; // 오류 시 사용 가능으로 처리
  }
};

/**
 * URL명 유효성 검사
 * @param {string} urlName - 확인할 URL명
 * @returns {object} 유효성 검사 결과
 */
export const validateUrlName = (urlName) => {
  const result = {
    isValid: true,
    message: ''
  };
  
  // 빈 값 확인
  if (!urlName || urlName.trim() === '') {
    result.isValid = false;
    result.message = 'URL명을 입력해주세요.';
    return result;
  }
  
  // 길이 확인 (3-20자)
  if (urlName.length < 3 || urlName.length > 20) {
    result.isValid = false;
    result.message = 'URL명은 3-20자 사이여야 합니다.';
    return result;
  }
  
  // 영문자, 숫자, 하이픈만 허용
  const validPattern = /^[a-zA-Z0-9-]+$/;
  if (!validPattern.test(urlName)) {
    result.isValid = false;
    result.message = 'URL명은 영문자, 숫자, 하이픈(-)만 사용할 수 있습니다.';
    return result;
  }
  
  // 하이픈으로 시작하거나 끝나는 것 방지
  if (urlName.startsWith('-') || urlName.endsWith('-')) {
    result.isValid = false;
    result.message = 'URL명은 하이픈(-)으로 시작하거나 끝날 수 없습니다.';
    return result;
  }
  
  // 연속된 하이픈 방지
  if (urlName.includes('--')) {
    result.isValid = false;
    result.message = 'URL명에 연속된 하이픈(--)을 사용할 수 없습니다.';
    return result;
  }
  
  return result;
};

/**
 * URL명 중복 확인 및 유효성 검사
 * @param {string} urlName - 확인할 URL명
 * @param {string} currentUserId - 현재 사용자 ID
 * @returns {Promise<object>} 검사 결과
 */
export const validateAndCheckUrlName = async (urlName, currentUserId) => {
  // 유효성 검사
  const validation = validateUrlName(urlName);
  if (!validation.isValid) {
    return validation;
  }
  
  // 중복 확인
  const isDuplicate = await checkUrlNameDuplicate(urlName, currentUserId);
  if (isDuplicate) {
    return {
      isValid: false,
      message: '이미 사용 중인 URL명입니다. 다른 URL명을 사용해주세요.'
    };
  }
  
  return {
    isValid: true,
    message: '사용 가능한 URL명입니다.'
  };
};
