import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SiteContext } from '../context/SiteContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import './MypageLikes.scss';

const MypageLikes = () => {
  const { currentUser, products, siteData } = useContext(SiteContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [likedProducts, setLikedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingProducts, setDeletingProducts] = useState(new Set());

  // 좋아요 상품 데이터 로드
  useEffect(() => {
    const loadLikedProducts = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        const likesQuery = query(collection(db, 'likes'), where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(likesQuery);
        const likedProductIds = [];
        
        querySnapshot.forEach((doc) => {
          likedProductIds.push(doc.data().productId);
        });

        // 상품 정보와 매칭
        const likedProductsWithInfo = likedProductIds
          .map(productId => products.find(p => p.id === productId))
          .filter(product => product !== undefined);

        setLikedProducts(likedProductsWithInfo);
      } catch (error) {
        console.error('좋아요 상품 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLikedProducts();
  }, [currentUser, products]);

  const likedProductsCount = likedProducts.length;

  // 좋아요 상품 삭제 함수
  const removeLikedProduct = async (productId) => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    // 삭제 확인
    if (!window.confirm('이 상품을 좋아요 목록에서 삭제하시겠습니까?')) {
      return;
    }

    // 삭제 중 상태 추가
    setDeletingProducts(prev => new Set(prev).add(productId));

    try {
      // Firebase에서 해당 좋아요 데이터 삭제
      const likesQuery = query(
        collection(db, 'likes'), 
        where('userId', '==', currentUser.uid),
        where('productId', '==', productId)
      );
      const querySnapshot = await getDocs(likesQuery);
      
      // 삭제할 문서들 삭제
      const deletePromises = querySnapshot.docs.map(docSnapshot => 
        deleteDoc(doc(db, 'likes', docSnapshot.id))
      );
      await Promise.all(deletePromises);
      
      // 로컬 상태에서도 제거
      setLikedProducts(prev => prev.filter(product => product.id !== productId));
      
    } catch (error) {
      console.error('좋아요 삭제 실패:', error);
      alert('좋아요 삭제 중 오류가 발생했습니다.');
    } finally {
      // 삭제 중 상태 제거
      setDeletingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  return (
    <div className="likes-page">
      <div className="likes-section">
        <div className="likes-header">
          <h2>좋아요 <span className="likes-count">{likedProductsCount}개</span></h2>
        </div>

        <div className="likes-info">
          <ul>
            <li>좋아요상품은 최대 120일간 보관됩니다.</li>
            <li>상품이 품절되거나 판매 중단된 경우 좋아요 목록에서 자동으로 삭제됩니다.</li>
            <li>상품 정보가 변경된 경우 최신 정보로 업데이트됩니다.</li>
          </ul>
        </div>

        <div className="likes-table">
          <div className="table-header">
            <div>상품</div>
            <div>가격</div>
            <div>관리</div>
          </div>
          
          {isLoading ? (
            <div className="loading-state">
              <p>로딩 중...</p>
            </div>
          ) : likedProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⚠️</div>
              <p>좋아요 상품이 없습니다.</p>
            </div>
          ) : (
            likedProducts.map((product) => (
              <div key={product.id} className="liked-product-row">
                <div className="product-info" style={{ cursor: 'pointer' }}
                  onClick={() => {
                    const isSiteRoute = location.pathname.startsWith('/site/');
                    if (isSiteRoute) {
                      const siteName = location.pathname.split('/')[2];
                      navigate(`/site/${siteName}/product/${product.id}`);
                    } else {
                      navigate(`/product/${product.id}`);
                    }
                  }}
                >
                  <img 
                    src={product.image || '/image/parcel.png'} 
                    alt={product.name}
                    className="product-image"
                  />
                  <div className="product-details">
                    <div className="product-name">{product.name}</div>
                    <div className="product-category">{
                      (() => {
                        const cats = siteData?.categories || [];
                        const top = cats.find(c => c.id === product.categoryId);
                        if (top) return top.name;
                        for (const c of cats) {
                          const sub = (c.subcategories || []).find(sc => sc.id === product.categoryId);
                          if (sub) return sub.name;
                        }
                        return '';
                      })()
                    }</div>
                  </div>
                </div>
                <div className="product-price">
                  {product.salePrice ? (
                    <div className="price-container">
                      <div className="original-price">{product.price.toLocaleString()}원</div>
                      <div className="sale-price">{product.salePrice.toLocaleString()}원</div>
                    </div>
                  ) : (
                    <div className="price">{product.price.toLocaleString()}원</div>
                  )}
                </div>
                <div className="product-actions">
                  <button 
                    className="remove-btn"
                    onClick={() => removeLikedProduct(product.id)}
                    disabled={deletingProducts.has(product.id)}
                  >
                    {deletingProducts.has(product.id) ? '삭제중...' : '삭제'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MypageLikes;
