// 사이트별 사용자 데이터 관리 유틸리티
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * 사이트별 사용자 컬렉션 이름 생성
 * @param {string} siteName - 사이트 영어 이름
 * @returns {string} 컬렉션 이름
 */
export const getSiteUsersCollection = (siteName) => {
  return `users_${siteName}`;
};

/**
 * 사이트별 사용자 데이터 저장
 * @param {string} siteName - 사이트 영어 이름
 * @param {string} userId - 사용자 ID
 * @param {object} userData - 사용자 데이터
 */
export const saveSiteUser = async (siteName, userId, userData) => {
  try {
    const collectionName = getSiteUsersCollection(siteName);
    const userRef = doc(db, collectionName, userId);
    
    const userDataWithTimestamp = {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      siteName: siteName
    };
    
    await setDoc(userRef, userDataWithTimestamp);
    console.log(`사이트 ${siteName}에 사용자 ${userId} 저장 완료`);
    return true;
  } catch (error) {
    console.error('사이트 사용자 저장 실패:', error);
    throw error;
  }
};

/**
 * 사이트별 사용자 데이터 조회
 * @param {string} siteName - 사이트 영어 이름
 * @param {string} userId - 사용자 ID
 * @returns {object|null} 사용자 데이터
 */
export const getSiteUser = async (siteName, userId) => {
  try {
    const collectionName = getSiteUsersCollection(siteName);
    const userRef = doc(db, collectionName, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('사이트 사용자 조회 실패:', error);
    throw error;
  }
};

/**
 * 사이트별 사용자 데이터 업데이트
 * @param {string} siteName - 사이트 영어 이름
 * @param {string} userId - 사용자 ID
 * @param {object} updateData - 업데이트할 데이터
 */
export const updateSiteUser = async (siteName, userId, updateData) => {
  try {
    const collectionName = getSiteUsersCollection(siteName);
    const userRef = doc(db, collectionName, userId);
    
    const updateDataWithTimestamp = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(userRef, updateDataWithTimestamp);
    console.log(`사이트 ${siteName}의 사용자 ${userId} 업데이트 완료`);
    return true;
  } catch (error) {
    console.error('사이트 사용자 업데이트 실패:', error);
    throw error;
  }
};

/**
 * URL에서 사이트 이름 추출
 * @param {string} pathname - 현재 경로
 * @returns {string|null} 사이트 이름
 */
export const extractSiteNameFromUrl = (pathname) => {
  const pathParts = pathname.split('/');
  const siteIndex = pathParts.indexOf('site');
  
  if (siteIndex !== -1 && pathParts[siteIndex + 1]) {
    return pathParts[siteIndex + 1];
  }
  
  return null;
};

/**
 * 현재 사이트 이름 가져오기
 * @returns {string|null} 현재 사이트 이름
 */
export const getCurrentSiteName = () => {
  return extractSiteNameFromUrl(window.location.pathname);
};
