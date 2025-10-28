import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SiteContext } from '../context/SiteContext';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, query, where, getDocs, doc } from 'firebase/firestore';
import './ProductList.scss';

  const ProductList = ({ products, onAddToCart, listType = 'ExpandedList', categoryId = null }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { productBadges = [], currentUser } = useContext(SiteContext);
    
    // 홈 페이지인지 카테고리 페이지인지 확인
    const isHomePage = location.pathname === '/' || location.pathname.includes('/site/') && !categoryId;
    const isCategoryPage = categoryId !== null;
    
    // 홈: 4x2 (8개), 카테고리: 4x3 (12개)
    const initialItems = isHomePage ? 8 : 12;
    const itemsPerPage = isHomePage ? 8 : 12;
    
    const [visibleCount, setVisibleCount] = useState(initialItems);
    const [currentPage, setCurrentPage] = useState(1);
    const [likedProducts, setLikedProducts] = useState(new Set());

    // 상품 데이터 디버깅
    console.log('ProductList products:', products);

    // 사용자의 좋아요 목록 로드
    useEffect(() => {
      const loadLikedProducts = async () => {
        if (!currentUser) return;
        
        try {
          const likesQuery = query(collection(db, 'likes'), where('userId', '==', currentUser.uid));
          const querySnapshot = await getDocs(likesQuery);
          const likedIds = new Set();
          
          querySnapshot.forEach((doc) => {
            likedIds.add(doc.data().productId);
          });
          
          setLikedProducts(likedIds);
        } catch (error) {
          console.error('좋아요 목록 로드 실패:', error);
        }
      };
      
      loadLikedProducts();
    }, [currentUser]);

    // 찜 토글 함수
    const toggleLike = async (productId) => {
      if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
      }

      try {
        const isLiked = likedProducts.has(productId);
        
        if (isLiked) {
          // 좋아요 취소 - Firebase에서 삭제
          const likesQuery = query(
            collection(db, 'likes'), 
            where('userId', '==', currentUser.uid),
            where('productId', '==', productId)
          );
          const querySnapshot = await getDocs(likesQuery);
          
          querySnapshot.forEach(async (docSnapshot) => {
            await deleteDoc(doc(db, 'likes', docSnapshot.id));
          });
          
          setLikedProducts(prev => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
          });
        } else {
          // 좋아요 추가 - Firebase에 저장
          await addDoc(collection(db, 'likes'), {
            userId: currentUser.uid,
            productId: productId,
            createdAt: new Date().toISOString()
          });
          
          setLikedProducts(prev => {
            const newSet = new Set(prev);
            newSet.add(productId);
            return newSet;
          });
        }
      } catch (error) {
        console.error('좋아요 처리 실패:', error);
        alert('좋아요 처리 중 오류가 발생했습니다.');
      }
    };

    // 상품에 해당하는 뱃지들을 가져오는 함수
    const getProductBadges = (product) => {
      if (!product.badges || !Array.isArray(product.badges)) return [];
      return (productBadges || []).filter(badge => product.badges.includes(badge.id));
    };

  // 상품 클릭 핸들러
  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  // 확장형 리스트 렌더링
  const renderExpandedList = () => {
    const visibleProducts = products.slice(0, visibleCount);
    const hasMore = visibleCount < products.length;

    return (
      <section className="collection-4x2 container">
        <div className="grid">
          {visibleProducts.map((product) => (
            <article key={product.id} className="card" onClick={() => {
              console.log('상품 카드 클릭됨!', product.id);
              console.log('현재 경로:', location.pathname);
              // 현재 경로가 /site/sitename 형태인지 확인
              const isSiteRoute = location.pathname.startsWith('/site/');
              console.log('사이트 라우트인가?', isSiteRoute);
              if (isSiteRoute) {
                const siteName = location.pathname.split('/')[2];
                console.log('사이트 이름:', siteName);
                console.log('이동할 경로:', `/site/${siteName}/product/${product.id}`);
                navigate(`/site/${siteName}/product/${product.id}`);
              } else {
                console.log('관리자 페이지에서 이동:', `/product/${product.id}`);
                navigate(`/product/${product.id}`);
              }
            }}>
              <div className="thumb">
                <img
                  src={product.mainImage || product.image || product.img || '/images/item1.png'}
                  alt={product.name}
                  onError={(e) => (e.currentTarget.src = '/images/item1.png')}
                />
              </div>

              <div className="meta">
                <div className="price">
                  {product.discountPercent && (
                    <strong className="sale">{product.discountPercent}%</strong>
                  )}
                  {product.salePrice && (
                    <s className="base">{product.price.toLocaleString()}원</s>
                  )}
                  <b className="now">
                    {product.salePrice ? product.salePrice.toLocaleString() : product.price.toLocaleString()}원
                  </b>
                </div>

                <p className="name">{product.name || '상품명 없음'}</p>

                {/* 색상 옵션 (동적) - 항상 공간 확보 */}
                <div className="dots">
                  {product.showColorOptions && product.colorOptions && product.colorOptions.length > 0 ? (
                    product.colorOptions.map((colorOption, index) => (
                      <span 
                        key={index} 
                        style={{ background: colorOption.color }}
                        title={colorOption.name}
                      />
                    ))
                  ) : null}
                </div>

                {/* 하단 고정 영역 */}
                <div className="card-footer">
                  {/* 구분선 */}
                  <div className="divider" />

                  {/* 뱃지들 */}
                  <div className="badges">
                    {getProductBadges(product).map(badge => (
                      <span 
                        key={badge.id} 
                        className={`badge ${badge.name === 'BEST' ? 'best' : ''}`}
                        style={{ 
                          color: badge.color
                        }}
                      >
                        {badge.name}
                      </span>
                    ))}
                  </div>

                  {/* 리뷰 정보와 아이콘들 */}
                  <div className="review-section">
                    <p className="review-text">리뷰 {product.reviewCount || 0}</p>
                    <div className="actions">
                    <button 
                      className={`action-btn heart-btn ${likedProducts.has(product.id) ? 'liked' : ''}`}
                      aria-label="찜하기"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(product.id);
                      }}
                    >
                      <img 
                        src={likedProducts.has(product.id) ? "/icons/heart_full.png" : "/icons/heart_bin.png"} 
                        alt="찜하기" 
                        width="20" 
                        height="20"
                      />
                    </button>
                      <button 
                        className="action-btn cart-btn" 
                        aria-label="장바구니"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product);
                        }}
                      >
                      <img 
                        src="/icons/shoppingcart.png" 
                        alt="장바구니" 
                        width="20" 
                        height="20"
                      />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="more-wrap">
          {isHomePage ? (
            // 홈 페이지에서는 항상 MORE 버튼 표시 (상품 개수와 관계없이)
            <button 
              className="more"
              onClick={() => {
                if (categoryId) {
                  navigate(`/category/${categoryId}`);
                }
              }}
            >
              카테고리 보기
            </button>
          ) : (
            // 카테고리 페이지에서는 상품이 더 있을 때만 MORE 버튼 표시
            hasMore ? (
              <button 
                className="more"
                onClick={() => {
                  setVisibleCount(prev => Math.min(prev + 12, products.length));
                }}
              >
                MORE + ({products.length - visibleCount}개 더)
              </button>
            ) : null
          )}
        </div>
      </section>
    );
  };

  // 페이지형 리스트 렌더링
  const renderPagedList = () => {
    const totalPages = Math.ceil(products.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = products.slice(startIndex, endIndex);

    return (
      <section className="collection-4x2 container">
        <div className="grid">
          {currentProducts.map((product) => (
            <article key={product.id} className="card">
              <div className="thumb">
                <img
                  src={product.mainImage || product.image || product.img || '/images/item1.png'}
                  alt={product.name}
                  onError={(e) => (e.currentTarget.src = '/images/item1.png')}
                />
              </div>

              <div className="meta">
                <div className="price">
                  {product.discountPercent && (
                    <strong className="sale">{product.discountPercent}%</strong>
                  )}
                  {product.salePrice && (
                    <s className="base">{product.price.toLocaleString()}원</s>
                  )}
                  <b className="now">
                    {product.salePrice ? product.salePrice.toLocaleString() : product.price.toLocaleString()}원
                  </b>
                </div>

                <p className="name">{product.name || '상품명 없음'}</p>

                {/* 색상 옵션 (동적) - 항상 공간 확보 */}
                <div className="dots">
                  {product.showColorOptions && product.colorOptions && product.colorOptions.length > 0 ? (
                    product.colorOptions.map((colorOption, index) => (
                      <span 
                        key={index} 
                        style={{ background: colorOption.color }}
                        title={colorOption.name}
                      />
                    ))
                  ) : null}
                </div>

                {/* 하단 고정 영역 */}
                <div className="card-footer">
                  {/* 구분선 */}
                  <div className="divider" />

                  {/* 뱃지들 */}
                  <div className="badges">
                    {getProductBadges(product).map(badge => (
                      <span 
                        key={badge.id} 
                        className={`badge ${badge.name === 'BEST' ? 'best' : ''}`}
                        style={{ 
                          color: badge.color
                        }}
                      >
                        {badge.name}
                      </span>
                    ))}
                  </div>

                  {/* 리뷰 정보와 아이콘들 */}
                  <div className="review-section">
                    <p className="review-text">리뷰 {product.reviewCount || 0}</p>
                    <div className="actions">
                    <button 
                      className={`action-btn heart-btn ${likedProducts.has(product.id) ? 'liked' : ''}`}
                      aria-label="찜하기"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(product.id);
                      }}
                    >
                      <img 
                        src={likedProducts.has(product.id) ? "/icons/heart_full.png" : "/icons/heart_bin.png"} 
                        alt="찜하기" 
                        width="20" 
                        height="20"
                      />
                    </button>
                      <button 
                        className="action-btn cart-btn" 
                        aria-label="장바구니"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product);
                        }}
                      >
                      <img 
                        src="/icons/shoppingcart.png" 
                        alt="장바구니" 
                        width="20" 
                        height="20"
                      />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
      </div>
        
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              이전
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`page-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              다음
            </button>
          </div>
        )}
      </section>
    );
  };

  if (products.length === 0) {
    return (
      <div className="empty-products">
        <p>등록된 상품이 없습니다.</p>
  </div>
);
  }

  return listType === 'ExpandedList' ? renderExpandedList() : renderPagedList();
};

export default ProductList;
