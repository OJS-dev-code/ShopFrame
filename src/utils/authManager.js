// 인증 관리 유틸리티
import { getSiteUser, getCurrentSiteName } from './siteUserManager';

/**
 * 사용자가 관리자 권한을 가지고 있는지 확인
 * @param {object} user - Firebase 사용자 객체
 * @returns {boolean} 관리자 권한 여부
 */
export const isAdminUser = async (user) => {
  if (!user) return false;
  
  // 관리자 이메일 도메인 또는 특정 이메일 확인
  const adminEmails = [
    'admin@example.com',
    'manager@example.com'
  ];
  
  const adminDomains = [
    '@admin.com',
    '@manager.com'
  ];
  
  // 특정 이메일 확인
  if (adminEmails.includes(user.email)) {
    return true;
  }
  
  // 도메인 확인
  if (user.email && adminDomains.some(domain => user.email.endsWith(domain))) {
    return true;
  }
  
  // 사이트별 사용자인지 확인
  const siteName = getCurrentSiteName();
  if (siteName) {
    const isSiteUserResult = await isSiteUser(user, siteName);
    if (isSiteUserResult) {
      return false; // 사이트별 사용자는 관리자가 아님
    }
  }
  
  // 관리자 회원가입을 완료한 사용자는 모두 관리자 권한 부여
  // (실제 운영에서는 더 엄격한 권한 관리가 필요할 수 있음)
  return true;
};

/**
 * 사용자가 사이트별 사용자인지 확인
 * @param {object} user - Firebase 사용자 객체
 * @param {string} siteName - 사이트 이름
 * @returns {boolean} 사이트별 사용자 여부
 */
export const isSiteUser = async (user, siteName) => {
  if (!user || !siteName) return false;
  
  try {
    const siteUserData = await getSiteUser(siteName, user.uid);
    return siteUserData !== null;
  } catch (error) {
    console.error('사이트 사용자 확인 실패:', error);
    return false;
  }
};

/**
 * 현재 경로가 관리자 영역인지 확인
 * @returns {boolean} 관리자 영역 여부
 */
export const isAdminArea = () => {
  const pathname = window.location.pathname;
  return !pathname.startsWith('/site/') && !pathname.startsWith('/auth/');
};

/**
 * 현재 경로가 사용자 영역인지 확인
 * @returns {boolean} 사용자 영역 여부
 */
export const isUserArea = () => {
  const pathname = window.location.pathname;
  return pathname.startsWith('/site/');
};

/**
 * 사용자 로그인 권한 확인
 * @param {object} user - Firebase 사용자 객체
 * @returns {object} 권한 확인 결과
 */
export const checkUserPermissions = async (user) => {
  if (!user) {
    return { canAccess: false, reason: 'not_logged_in' };
  }
  
  const isAdmin = isAdminUser(user);
  const isAdminAreaPath = isAdminArea();
  const isUserAreaPath = isUserArea();
  
  // 관리자 영역에서 접근 시도
  if (isAdminAreaPath) {
    if (isAdmin) {
      return { canAccess: true, userType: 'admin' };
    } else {
      return { canAccess: false, reason: 'not_admin', userType: 'site_user' };
    }
  }
  
  // 사용자 영역에서 접근 시도
  if (isUserAreaPath) {
    const siteName = getCurrentSiteName();
    if (siteName) {
      const isSiteUserResult = await isSiteUser(user, siteName);
      if (isSiteUserResult) {
        return { canAccess: true, userType: 'site_user' };
      } else {
        return { canAccess: false, reason: 'not_site_user', userType: 'other' };
      }
    }
  }
  
  return { canAccess: true, userType: 'unknown' };
};
