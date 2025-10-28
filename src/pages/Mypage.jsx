import React, { useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SiteContext } from '../context/SiteContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import MypageSidebar from '../components/MypageSidebar';
import MypageUserSimpleInformation from '../components/MypageUserSimpleInformation';
import OrderStatusFlow from '../components/OrderStatusFlow';
import MypageOrders from './MypageOrders';
import MypageReviews from './MypageReviews';
import MypageCoupons from './MypageCoupons';
import MypageLikes from './MypageLikes';
import MypageWithdrawal from './MypageWithdrawal';
import MegaMenu from '../components/MegaMenu';
import DropdownMenu from '../components/DropdownMenu';
import MobileHeader from '../components/MobileHeader';
import Footer from '../components/Footer';
import '../components/HeaderResponsive.scss';
import './Mypage.scss';

const Mypage = () => {
  const context = useContext(SiteContext);
  const location = useLocation();
  const navigate = useNavigate();
  
  // SiteContext가 없을 때 기본값 설정
  const siteData = context?.siteData || {
    siteTitle: "나의 쇼핑몰",
    searchPlaceholder: "상품을 검색해보세요",
    categories: [],
    logoUrl: "",
    logoStyle: "text",
    headerType: "HeaderA"
  };
  const currentUser = context?.currentUser || null;
  const products = context?.products || [];
  const contextLikedProducts = context?.likedProducts || new Set();
  
  // 현재 URL이 /site/siteName 형태인지 확인
  const isSiteRoute = location.pathname.startsWith('/site/');
  const siteName = isSiteRoute ? location.pathname.split('/')[2] : null;
  
  // 좋아요 상품 상태 (Hooks는 항상 최상위에서 호출)
  const [likedProducts, setLikedProducts] = useState([]);
  const [totalLikedCount, setTotalLikedCount] = useState(0);
  const [isLoadingLikes, setIsLoadingLikes] = useState(true);
  const [deletingProducts, setDeletingProducts] = useState(new Set());
  
  // 로그인 체크 - 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!currentUser) {
      alert('로그인이 필요한 기능입니다.');
      if (isSiteRoute && siteName) {
        navigate(`/site/${siteName}/login`);
      } else {
        navigate('/login');
      }
    }
  }, [currentUser, isSiteRoute, siteName, navigate]);

  // 좋아요 상품 데이터 로드
  useEffect(() => {
    const loadLikedProducts = async () => {
      if (!currentUser) {
        setIsLoadingLikes(false);
        return;
      }

      try {
        const likesQuery = query(collection(db, 'likes'), where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(likesQuery);
        const likedProductIds = [];
        
        querySnapshot.forEach((doc) => {
          likedProductIds.push(doc.data().productId);
        });

        // 상품 정보와 매칭 (현재 사이트의 상품만 필터링)
        const likedProductsWithInfo = likedProductIds
          .map(productId => products.find(p => p.id === productId))
          .filter(product => product !== undefined);
        
        // 전체 좋아요 상품 개수 저장 (필터링된 개수)
        setTotalLikedCount(likedProductsWithInfo.length);

        // 최대 3개만 표시
        setLikedProducts(likedProductsWithInfo.slice(0, 3));
      } catch (error) {
        console.error('좋아요 상품 로드 실패:', error);
      } finally {
        setIsLoadingLikes(false);
      }
    };

    loadLikedProducts();
  }, [currentUser, products]);

  // 로그인하지 않은 경우 아무것도 렌더링하지 않음
  if (!currentUser) {
    return null;
  }

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
      
      // 전체 개수도 업데이트
      setTotalLikedCount(prev => prev - 1);
      
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

  // 현재 경로에 따라 렌더링할 컴포넌트 결정
  const renderMypageContent = () => {
    const path = location.pathname;
    
    if (path.includes('/orders')) {
      return <MypageOrders />;
    } else if (path.includes('/reviews')) {
      return <MypageReviews />;
    } else if (path.includes('/coupons')) {
      return <MypageCoupons />;
    } else if (path.includes('/likes')) {
      return <MypageLikes />;
    } else if (path.includes('/withdrawal')) {
      return <MypageWithdrawal />;
    } else {
      // 기본 홈페이지 (대시보드)
      return renderDashboard();
    }
  };

  const orderStatus = [
    { status: '주문접수', count: 0 },
    { status: '결제완료', count: 0 },
    { status: '배송준비중', count: 0 },
    { status: '배송중', count: 0 },
    { status: '배송완료', count: 1, active: true }
  ];

  const renderDashboard = () => (
    <div className="main-dashboard">
      <div className="order-status-section">
        <div className="section-header">
          <h2>주문/배송조회</h2>
          <span className="period">(최근1개월)</span>
          <a href={isSiteRoute && siteName ? `/site/${siteName}/mypage/orders` : "/mypage/orders"} className="more-link">더보기 </a>
        </div>

        <OrderStatusFlow orderStatus={orderStatus} />
      </div>

      <div className="likes-section">
        <div className="section-header">
          <h2>좋아요 <span className="likes-count">{totalLikedCount}개</span></h2>
          {totalLikedCount > 3 && (
            <a href={isSiteRoute && siteName ? `/site/${siteName}/mypage/likes` : "/mypage/likes"} className="more-link">
              더보기 ({totalLikedCount - 3}개 더)
            </a>
          )}
        </div>

        <div className="likes-table">
          <div className="table-header">
            <div>상품</div>
            <div>가격</div>
            <div>관리</div>
          </div>
          
          {isLoadingLikes ? (
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
                <div
                  className="product-info"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    if (isSiteRoute && siteName) {
                      window.location.href = `/site/${siteName}/product/${product.id}`;
                    } else {
                      window.location.href = `/product/${product.id}`;
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

  // 카테고리 클릭 핸들러
  const handleCategoryClick = (categoryId) => {
    // categoryId가 객체인 경우 id 속성 추출
    const actualId = typeof categoryId === 'object' ? categoryId.id : categoryId;
    
    if (isSiteRoute && siteName) {
      navigate(`/site/${siteName}/category/${actualId}`);
    } else {
      navigate(`/category/${actualId}`);
    }
  };

  // 헤더 렌더링 함수
  const renderHeader = () => {
    const headerProps = {
      title: siteData.siteTitle || "",
      placeholder: siteData.searchPlaceholder || "상품을 검색해보세요",
      categories: siteData.categories || [],
      logoUrl: siteData.logoUrl || "",
      logoStyle: siteData.logoStyle || 'text',
      cartItemCount: 0,
      currentUser,
      onLoginClick: () => {},
      onSignupClick: () => {},
      onLogoutClick: () => {},
      onCategoryClick: handleCategoryClick,
      searchQuery: "",
      onSearchChange: () => {},
      onSearchSubmit: () => {},
      searchAdImage: siteData.searchAdImage
    };

    return (
      <>
        {/* 모바일 헤더 */}
        <MobileHeader {...headerProps} />
        
        {/* 데스크톱 헤더 */}
        <div className="desktop-header">
          {(() => {
            switch (siteData.headerType) {
              case "HeaderB":
                return <DropdownMenu {...headerProps} />;
              default:
                return <MegaMenu {...headerProps} />;
            }
          })()}
        </div>
      </>
    );
  };

  return (
    <div className="mobile-padding" style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      {/* 헤더 */}
      {renderHeader()}
      
      {/* 마이페이지 콘텐츠 */}
      <div className="mypage-container">
        <div className="mypage-layout">
          <MypageSidebar />
          <main className="mypage-content">
            <MypageUserSimpleInformation />
            {renderMypageContent()}
            {/* 메인 대시보드에도 좋아요 목록이 노출되므로 클릭 이동 지원 */}
          </main>
        </div>
      </div>

      {/* 푸터 */}
      <Footer siteData={siteData} />
    </div>
  );
};

export default Mypage;