// 사이트별 장바구니 관리 유틸리티
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * 사이트별 장바구니 컬렉션 이름 생성
 * @param {string} siteName - 사이트 영어 이름
 * @returns {string} 컬렉션 이름
 */
export const getSiteCartCollection = (siteName) => {
  return `cart_${siteName}`;
};

/**
 * 사이트별 장바구니 데이터 저장
 * @param {string} siteName - 사이트 영어 이름
 * @param {string} userId - 사용자 ID
 * @param {Array} cartItems - 장바구니 아이템 배열
 */
export const saveSiteCart = async (siteName, userId, cartItems) => {
  try {
    const collectionName = getSiteCartCollection(siteName);
    const cartRef = doc(db, collectionName, userId);
    
    const cartData = {
      items: cartItems,
      updatedAt: new Date().toISOString(),
      siteName: siteName
    };
    
    await setDoc(cartRef, cartData);
    console.log(`사이트 ${siteName}에 사용자 ${userId} 장바구니 저장 완료`);
    return true;
  } catch (error) {
    console.error('사이트 장바구니 저장 실패:', error);
    throw error;
  }
};

/**
 * 사이트별 장바구니 데이터 조회
 * @param {string} siteName - 사이트 영어 이름
 * @param {string} userId - 사용자 ID
 * @returns {Array} 장바구니 아이템 배열
 */
export const getSiteCart = async (siteName, userId) => {
  try {
    const collectionName = getSiteCartCollection(siteName);
    const cartRef = doc(db, collectionName, userId);
    const cartDoc = await getDoc(cartRef);
    
    if (cartDoc.exists()) {
      const cartData = cartDoc.data();
      console.log(`사이트 ${siteName}에서 사용자 ${userId} 장바구니 로드 완료`);
      return cartData.items || [];
    } else {
      console.log(`사이트 ${siteName}에서 사용자 ${userId} 장바구니 없음`);
      return [];
    }
  } catch (error) {
    console.error('사이트 장바구니 조회 실패:', error);
    return [];
  }
};

/**
 * 사이트별 장바구니 아이템 추가
 * @param {string} siteName - 사이트 영어 이름
 * @param {string} userId - 사용자 ID
 * @param {Object} product - 상품 정보
 * @param {number} quantity - 수량
 * @param {Object} options - 옵션
 */
export const addToSiteCart = async (siteName, userId, product, quantity = 1, options = {}) => {
  try {
    const currentCart = await getSiteCart(siteName, userId);
    
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
      image: product.image,
      quantity,
      options,
      addedAt: new Date().toISOString()
    };

    const existingItemIndex = currentCart.findIndex(item => 
      item.id === cartItem.id && 
      JSON.stringify(item.options) === JSON.stringify(cartItem.options)
    );

    let updatedItems;
    if (existingItemIndex > -1) {
      updatedItems = [...currentCart];
      updatedItems[existingItemIndex].quantity += quantity;
    } else {
      updatedItems = [...currentCart, cartItem];
    }
    
    await saveSiteCart(siteName, userId, updatedItems);
    return updatedItems;
  } catch (error) {
    console.error('사이트 장바구니 추가 실패:', error);
    throw error;
  }
};

/**
 * 사이트별 장바구니 아이템 수량 업데이트
 * @param {string} siteName - 사이트 영어 이름
 * @param {string} userId - 사용자 ID
 * @param {string} productId - 상품 ID
 * @param {Object} options - 옵션
 * @param {number} newQuantity - 새로운 수량
 */
export const updateSiteCartQuantity = async (siteName, userId, productId, options, newQuantity) => {
  try {
    const currentCart = await getSiteCart(siteName, userId);
    
    const updatedItems = currentCart.map(item => {
      const currentItemId = `${item.id}-${JSON.stringify(item.options || {})}`;
      const targetItemId = `${productId}-${JSON.stringify(options || {})}`;
      
      if (currentItemId === targetItemId) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    
    await saveSiteCart(siteName, userId, updatedItems);
    return updatedItems;
  } catch (error) {
    console.error('사이트 장바구니 수량 업데이트 실패:', error);
    throw error;
  }
};

/**
 * 사이트별 장바구니 아이템 삭제
 * @param {string} siteName - 사이트 영어 이름
 * @param {string} userId - 사용자 ID
 * @param {string} productId - 상품 ID
 * @param {Object} options - 옵션
 */
export const removeFromSiteCart = async (siteName, userId, productId, options) => {
  try {
    const currentCart = await getSiteCart(siteName, userId);
    
    const updatedItems = currentCart.filter(item => {
      const currentItemId = `${item.id}-${JSON.stringify(item.options || {})}`;
      const targetItemId = `${productId}-${JSON.stringify(options || {})}`;
      
      return currentItemId !== targetItemId;
    });
    
    await saveSiteCart(siteName, userId, updatedItems);
    return updatedItems;
  } catch (error) {
    console.error('사이트 장바구니 삭제 실패:', error);
    throw error;
  }
};

/**
 * 사이트별 장바구니 비우기
 * @param {string} siteName - 사이트 영어 이름
 * @param {string} userId - 사용자 ID
 */
export const clearSiteCart = async (siteName, userId) => {
  try {
    await saveSiteCart(siteName, userId, []);
    return [];
  } catch (error) {
    console.error('사이트 장바구니 비우기 실패:', error);
    throw error;
  }
};

/**
 * 사이트별 장바구니 아이템 개수 계산
 * @param {string} siteName - 사이트 영어 이름
 * @param {string} userId - 사용자 ID
 * @returns {number} 장바구니 아이템 총 개수
 */
export const getSiteCartItemCount = async (siteName, userId) => {
  try {
    const cartItems = await getSiteCart(siteName, userId);
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  } catch (error) {
    console.error('사이트 장바구니 개수 계산 실패:', error);
    return 0;
  }
};
