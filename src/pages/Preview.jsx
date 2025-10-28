import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { SiteContext } from "../context/SiteContext";

// UI 컴포넌트
import MegaMenu from "../components/MegaMenu";
import DropdownMenu from "../components/DropdownMenu";
import MobileHeader from "../components/MobileHeader";
import "../components/HeaderResponsive.scss";
import BasicHeroCarousel from "../components/BasicHeroCarousel";
import FadeHeroBanner from "../components/FadeHeroBanner";
import NumberedProgressSlider from "../components/NumberedProgressSlider";
import ProductList from "../components/ProductList";
import ProductList2 from "../components/ProductList2";
import Popup from "../components/Popup";
import Footer from "../components/Footer";
import OptionsModal from "../components/OptionsModal";

const Preview = () => {
  const { 
    siteData, 
    categories, 
    products,
    // 검색
    searchQuery,
    setSearchQuery,
    // 인증
    currentUser,
    signOutUser,
    // 로딩 상태
    isLoading,
    // 사이트별 장바구니 관리
    addToCart: addToCartContext,
    getCartItemCount
  } = useContext(SiteContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { siteName, categoryId } = useParams();
  
  // 찜 상태 관리
  const [likedProducts, setLikedProducts] = useState(new Set());
  
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
        const { collection, query, where, getDocs, deleteDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        
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
        const { collection, addDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        
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
  
  // 현재 URL이 /site/siteName 형태인지 확인
  const isSiteRoute = location.pathname.startsWith('/site/');
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [showPopup, setShowPopup] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [optionsTargetProduct, setOptionsTargetProduct] = useState(null);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);

  // 사이트별 장바구니 개수 로드
  useEffect(() => {
    const loadCartCount = async () => {
      if (currentUser && isSiteRoute) {
        try {
          const count = await getCartItemCount();
          setCartItemCount(count);
        } catch (error) {
          console.error('장바구니 개수 로드 실패:', error);
        }
      } else {
        setCartItemCount(0);
      }
    };

    loadCartCount();
  }, [currentUser, isSiteRoute, getCartItemCount]);

  // 사용자의 좋아요 목록 로드
  useEffect(() => {
    const loadLikedProducts = async () => {
      if (!currentUser) return;
      
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        
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

  // 스크롤 이벤트 핸들러
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // localStorage 변경 감지하여 cartItemCount 업데이트
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('cartItems');
      if (saved) {
        const items = JSON.parse(saved);
        const count = items.reduce((sum, item) => sum + item.quantity, 0);
        setCartItemCount(count);
        setCartItems(items);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // URL에서 검색어 가져오기
  const urlParams = new URLSearchParams(location.search);
  const urlSearchQuery = urlParams.get('search') || '';
  
  // 검색어 정리 (URL 파라미터만 사용 - 실시간 검색 방지)
  const trimmedQuery = urlSearchQuery || "";

  // 필터링된 상품 목록
  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    
    let filtered = products;
    
    // 검색어 필터링
    if (trimmedQuery) {
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(trimmedQuery.toLowerCase())
      );
    }
    
    // URL에서 카테고리 ID 필터링
    if (categoryId) {
      // 현재 카테고리가 소카테고리인지 확인
      const currentCategory = categories.find(cat => cat.id === categoryId);
      
      if (currentCategory && currentCategory.parentId) {
        // 소카테고리인 경우 - 해당 소카테고리의 상품만 표시
        filtered = filtered.filter(product => product.categoryId === categoryId);
      } else {
        // 대카테고리인 경우 - 해당 대카테고리의 모든 소카테고리 상품 표시
        const currentCategoryObj = categories.find(cat => cat.id === categoryId);
        const subcategoryIds = currentCategoryObj?.subcategories?.map(sub => sub.id) || [];
        
        filtered = filtered.filter(product => 
          product.categoryId === categoryId || 
          subcategoryIds.includes(product.categoryId)
        );
      }
    }
    
    // 선택된 카테고리 필터링 (기존 로직 유지)
    if (selectedCategory && !categoryId) {
      filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }
    
    return filtered;
  }, [products, trimmedQuery, selectedCategory, categoryId, categories]);

  // 검색 결과
  const searchResults = useMemo(() => {
    if (!trimmedQuery) return [];
    return filteredProducts;
  }, [filteredProducts, trimmedQuery]);

  // 표시할 카테고리 목록 (관리자가 지정한 순서대로)
  const finalDisplayCategories = useMemo(() => {
    if (!categories || !Array.isArray(categories)) return [];
    
    const validCategories = categories.filter(cat => cat && cat.id && cat.name);
    
    // siteData.categoryOrder가 있으면 해당 순서로 정렬
    if (siteData?.categoryOrder && Array.isArray(siteData.categoryOrder)) {
      const orderedCategories = [];
      const categoryMap = new Map(validCategories.map(cat => [cat.id, cat]));
      
      // 순서대로 카테고리 추가
      siteData.categoryOrder.forEach(catId => {
        if (categoryMap.has(catId)) {
          orderedCategories.push(categoryMap.get(catId));
          categoryMap.delete(catId);
        }
      });
      
      // 순서에 없는 카테고리들을 끝에 추가
      orderedCategories.push(...Array.from(categoryMap.values()));
      
      return orderedCategories;
    }
    
    // categoryOrder가 없으면 기존 순서 유지
    return validCategories;
  }, [categories, siteData?.categoryOrder]);

  // 현재 선택된 카테고리 정보
  const currentCategory = useMemo(() => {
    if (!categoryId || !categories) return null;
    
    // 먼저 대카테고리에서 찾기
    let found = categories.find(cat => cat.id === categoryId);
    
    // 대카테고리에서 찾지 못했다면 소카테고리에서 찾기
    if (!found) {
      for (const category of categories) {
        if (category.subcategories) {
          const subcategory = category.subcategories.find(sub => sub.id === categoryId);
          if (subcategory) {
            found = {
              ...subcategory,
              parentId: category.id,
              parentName: category.name
            };
            break;
          }
        }
      }
    }
    
    return found;
  }, [categoryId, categories]);

  // 장바구니에 상품 추가 (사이트별 시스템 사용)
  const addToCart = async (product, quantity = 1, options = {}) => {
    try {
      await addToCartContext(product, quantity, options);
      // 장바구니 개수 업데이트
      const newCount = await getCartItemCount();
      setCartItemCount(newCount);
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
    }
  };

  // 상품 카드의 장바구니 클릭 시: 옵션 필요하면 모달 열기
  const handleAddToCartRequest = (product) => {
    const needsColor = product?.showColorOptions && product?.colorOptions?.length > 0;
    const needsOptions = product?.options && product?.options?.length > 0;
    if (needsColor || needsOptions) {
      setOptionsTargetProduct(product);
      setIsOptionsModalOpen(true);
      return;
    }
    // 옵션이 없다면 바로 담기 (수량 1)
    addToCart(product, 1, {});
    alert('장바구니에 추가되었습니다!');
  };

  const handleConfirmOptions = ({ quantity, options }) => {
    if (!optionsTargetProduct) return;
    addToCart(optionsTargetProduct, quantity, options || {});
    setIsOptionsModalOpen(false);
    setOptionsTargetProduct(null);
    alert('장바구니에 추가되었습니다!');
  };

  const handleCancelOptions = () => {
    setIsOptionsModalOpen(false);
    setOptionsTargetProduct(null);
  };

  // 카테고리 클릭 핸들러
  const handleCategoryClick = (category) => {
    
    // 소카테고리인 경우 해당 소카테고리만 필터링
    if (category.parentId) {
      // 소카테고리인 경우 - 소카테고리 ID로 필터링
      if (isSiteRoute && siteName) {
        navigate(`/site/${siteName}/category/${category.id}`);
      } else {
        navigate(`/category/${category.id}`);
      }
    } else {
      // 대카테고리인 경우 - 해당 대카테고리의 모든 소카테고리 표시
      if (isSiteRoute && siteName) {
        navigate(`/site/${siteName}/category/${category.id}`);
      } else {
        navigate(`/category/${category.id}`);
      }
    }
  };

  // 헤더 렌더링 함수
  const renderHeader = () => {
    // 상단 배너가 있을 때 헤더 위치 조정
    
    const headerProps = {
      title: siteData.siteTitle || "",
      placeholder: siteData.searchPlaceholder || "상품을 검색해보세요",
      categories: finalDisplayCategories,
      logoUrl: siteData.logoUrl || "",
        logoStyle: siteData.logoStyle || 'text',
        logoTextSize: siteData.logoTextSize,
        logoTextColor: siteData.logoTextColor,
        logoTextFont: siteData.logoTextFont,
      cartItemCount,
      currentUser,
      searchQuery: searchQuery,
      onSearchChange: setSearchQuery,
      onSearchSubmit: (query) => {
        setSearchQuery(query);
        // 검색 결과 페이지로 이동하거나 검색 실행
        if (isSiteRoute && siteName) {
          navigate(`/site/${siteName}?search=${encodeURIComponent(query)}`);
        } else {
          navigate(`/?search=${encodeURIComponent(query)}`);
        }
      },
      onLoginClick: handleLoginClick,
      onSignupClick: handleSignupClick,
      onLogoutClick: handleLogoutClick,
      onCategoryClick: handleCategoryClick,
      searchAdImage: siteData.searchAdImage,
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

  // 로그인 클릭 핸들러
  const handleLoginClick = () => {
    if (siteName) {
      navigate(`/site/${siteName}/login`);
    } else {
      navigate("/site-login");
    }
  };

  // 회원가입 클릭 핸들러
  const handleSignupClick = () => {
    if (siteName) {
      navigate(`/site/${siteName}/signup`);
    } else {
      navigate("/site-signup");
    }
  };

  // 로그아웃 클릭 핸들러
  const handleLogoutClick = () => {
    signOutUser();
    if (siteName) {
      navigate(`/site/${siteName}`);
    } else {
      navigate("/preview");
    }
  };

  // 장바구니 토글 함수
  useEffect(() => {
    window.toggleCart = () => {
      if (siteName) {
        navigate(`/site/${siteName}/cart`);
      } else {
        setShowCart(!showCart);
      }
    };
  }, [siteName, showCart, navigate]);

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        fontSize: "18px",
        color: "#666"
      }}>
        사이트를 불러오는 중...
      </div>
    );
  }

  // 메인 콘텐츠 렌더링 함수
  const renderMainContent = () => {
    if (trimmedQuery && urlSearchQuery) {
      // URL에 검색어가 있을 때만: 검색 결과 표시 (실시간 검색 방지)
      return (
        <div style={{
          marginBottom: "40px"
        }}>
          <div style={{ padding: "20px 0", textAlign: "center" }}>
            <h2 style={{ margin: 0, fontSize: 24, color: "#333" }}>
              검색 결과: "{trimmedQuery}" ({searchResults.length}개)
            </h2>
          </div>
          {searchResults.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#6c757d" }}>
              일치하는 상품이 없습니다.
            </div>
          ) : (
            <div data-tutorial="product-area">
              {siteData.productListType === "ExpandedList" ? (
                <ProductList products={searchResults} onAddToCart={handleAddToCartRequest} listType={siteData.productListType} />
              ) : (
                <ProductList2 
                  products={searchResults} 
                  onAddToCart={handleAddToCartRequest} 
                  onToggleLike={toggleLike}
                  likedProducts={likedProducts}
                />
              )}
            </div>
          )}
        </div>
      );
    } else if (categoryId) {
      // URL에서 카테고리 ID가 있을 때: 해당 카테고리 상품만 표시
      return (
        <div style={{
          marginBottom: "40px"
        }}>
          <div style={{ padding: "20px 0", textAlign: "center" }}>
            <h2 style={{ margin: 0, fontSize: 24, color: "#333" }}>
              {currentCategory ? (
                currentCategory.parentId ? (
                  // 소카테고리인 경우: 대카테고리 > 소카테고리 형식
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {currentCategory.parentName}
                    <img src="/icons/right-arrow.png" alt=">" style={{ width: '12px', height: '12px' }} />
                    {currentCategory.name}
                    <span style={{ marginLeft: '8px' }}>({filteredProducts.length}개)</span>
                  </span>
                ) : (
                  // 대카테고리인 경우: 카테고리 이름만
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {currentCategory.name}
                    <span>({filteredProducts.length}개)</span>
                  </span>
                )
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  카테고리
                  <span>({filteredProducts.length}개)</span>
                </span>
              )}
            </h2>
          </div>
          {filteredProducts.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#6c757d" }}>
              이 카테고리에 상품이 없습니다.
            </div>
          ) : (
            <div data-tutorial="product-area">
              {siteData.productListType === "ExpandedList" ? (
                <ProductList products={filteredProducts} onAddToCart={handleAddToCartRequest} listType={siteData.productListType} />
              ) : (
                <ProductList2 
                  products={filteredProducts} 
                  onAddToCart={handleAddToCartRequest} 
                  onToggleLike={toggleLike}
                  likedProducts={likedProducts}
                />
              )}
            </div>
          )}
        </div>
      );
    } else {
      // 검색어가 없을 때: 카테고리별 섹션 표시
      if (finalDisplayCategories.length === 0) {
        return (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px"
          }}>
            <h2 style={{ color: "#6c757d", marginBottom: "20px" }}>
              카테고리가 없습니다
            </h2>
            <p style={{ color: "#6c757d" }}>
              에디터에서 카테고리를 추가해보세요.
            </p>
          </div>
        );
      } else if (selectedCategory) {
        // 특정 카테고리 선택 시 (대카테고리면 소카테고리 상품도 포함)
        const selectedCat = finalDisplayCategories.find(cat => cat.id === selectedCategory);
        const subcategoryIds = selectedCat?.subcategories?.map(sub => sub.id) || [];
        const categoryProducts = filteredProducts.filter(product => 
          product.categoryId === selectedCategory || subcategoryIds.includes(product.categoryId)
        );
        
        return (
          <div style={{ 
            marginBottom: "40px"
          }}>
            <div style={{ 
              padding: "20px 0",
              textAlign: "center"
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: 24, 
                color: "#333",
                display: "inline-block",
                padding: "8px 16px",
                borderRadius: "4px"
              }}>
                {selectedCat ? selectedCat.name : "카테고리"}
              </h2>
            </div>
            {categoryProducts.length === 0 ? (
              <div style={{ 
                padding: "40px", 
                textAlign: "center", 
                color: "#6c757d" 
              }}>
                이 카테고리에 등록된 상품이 없습니다.
              </div>
            ) : (
              <div data-tutorial="product-area">
                {siteData.productListType === "ExpandedList" ? (
                  <ProductList products={categoryProducts} onAddToCart={handleAddToCartRequest} listType={siteData.productListType} />
                ) : (
                  <ProductList2 
                    products={categoryProducts} 
                    onAddToCart={handleAddToCartRequest} 
                    onToggleLike={toggleLike}
                    likedProducts={likedProducts}
                  />
                )}
              </div>
            )}
          </div>
        );
      } else {
        // 모든 카테고리 표시
        return finalDisplayCategories.map((category) => {
          const subcategoryIds = category?.subcategories?.map(sub => sub.id) || [];
          const categoryProducts = filteredProducts.filter(product => 
            product.categoryId === category.id || subcategoryIds.includes(product.categoryId)
          );
          
          return (
            <div key={category.id} style={{ marginBottom: "40px" }}>
              <div style={{
                marginBottom: "20px"
              }}>
                <div style={{ 
                  padding: "20px 0", 
                  textAlign: "center"
                }}>
                  <h2 
                    style={{ 
                      margin: 0, 
                      fontSize: 24, 
                      color: "#333",
                      cursor: "pointer",
                      display: "inline-block",
                      padding: "8px 16px",
                      borderRadius: "4px",
                      transition: "background-color 0.2s ease"
                    }}
                    onClick={() => {
                      // 카테고리 페이지로 이동
                      if (isSiteRoute && siteName) {
                        navigate(`/site/${siteName}/category/${category.id}`);
                      } else {
                        navigate(`/category/${category.id}`);
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#f8f9fa";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                  >
                    {category.name}
                  </h2>
                </div>
                {categoryProducts.length === 0 ? (
                  <div style={{ 
                    padding: "40px", 
                    textAlign: "center", 
                    color: "#6c757d" 
                  }}>
                    이 카테고리에 등록된 상품이 없습니다.
                  </div>
                ) : (
                  <div data-tutorial="product-area">
                    {siteData.productListType === "ExpandedList" ? (
                  <ProductList products={categoryProducts} onAddToCart={handleAddToCartRequest} listType={siteData.productListType} />
                ) : (
                  <ProductList2 
                    products={categoryProducts} 
                    onAddToCart={handleAddToCartRequest} 
                    onToggleLike={toggleLike}
                    likedProducts={likedProducts}
                  />
                )}
                  </div>
                )}
              </div>
            </div>
          );
        });
      }
    }
  };

  // 헤더 높이 계산 (상단 배너 고려)
  const headerHeight = siteData.headerType === "HeaderA" ? 64 : 0;
  const bannerHeight = showPopup && siteData.popup && siteData.popup.enabled && !isScrolled ? 40 : 0;
  // HeaderA는 position: relative이므로 paddingTop 불필요, 스크롤 시에만 fixed됨
  const totalTopPadding = 0;

  return (
    <div className="mobile-padding" style={{ minHeight: "100vh", backgroundColor: "#ffffff", paddingTop: `${totalTopPadding}px` }}>
      {/* 데스크톱 상단 배너 */}
      <div className="desktop-banner">
        {(() => {
          return showPopup && siteData.popup && siteData.popup.enabled && !isScrolled;
        })() && (
          <Popup 
            popupData={siteData.popup} 
            onClose={() => {
              setShowPopup(false);
            }} 
          />
        )}
      </div>

      {/* 헤더 */}
      <div data-tutorial="header-area" style={{ 
        marginTop: showPopup && siteData.popup && siteData.popup.enabled && !isScrolled ? '40px' : '0px'
      }}>
      {renderHeader()}
      </div>

      {/* 슬라이더와 메인 콘텐츠 */}
      {siteData.sliderType && siteData.sliderType === "NumberedProgressSlider" ? (
        // NumberedProgressSlider인 경우: 좌우 분할 레이아웃
        <div style={{ display: "flex", minHeight: "calc(100vh - 200px)" }}>
          {/* 좌측: 고정 슬라이더 영역 */}
          <div style={{ 
            width: "40%", 
            position: "sticky",
            top: "0",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 10
          }}>
            <NumberedProgressSlider slides={siteData.sliderImages?.NumberedProgressSlider || []} />
          </div>
          {/* 우측: 카테고리별 상품리스트 */}
          <div style={{ 
            width: "60%", 
            padding: "20px", 
            overflowY: "auto"
          }}>
            {renderMainContent()}
          </div>
        </div>
      ) : (
        // 다른 슬라이더인 경우: 기존 방식
        <>
          {siteData.sliderType && (
            <div style={{ marginBottom: "20px" }}>
              {siteData.sliderType === "BasicHeroCarousel" && (
                <BasicHeroCarousel slides={siteData.sliderImages?.BasicHeroCarousel || []} />
              )}
              {siteData.sliderType === "FadeHeroBanner" && (
                <FadeHeroBanner 
                  slides={siteData.sliderImages?.FadeHeroBanner || []}
                />
              )}
            </div>
          )}

          {/* 모바일 상단 배너 */}
          <div className="mobile-banner">
            {(() => {
              return showPopup && siteData.popup && siteData.popup.enabled;
            })() && (
              <Popup 
                popupData={siteData.popup} 
                isMobile={true}
                onClose={() => {
                  setShowPopup(false);
                }} 
              />
            )}
          </div>

          {/* 메인 콘텐츠 */}
          <div style={{ padding: "20px" }}>
            {renderMainContent()}
          </div>


          {/* 장바구니 모달 */}
          {showCart && !siteName && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 1000,
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}>
              <div style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                maxWidth: "500px",
                width: "90%",
                maxHeight: "80vh",
                overflow: "auto"
              }}>
                <h3>장바구니</h3>
                {cartItems.length === 0 ? (
                  <p>장바구니가 비어있습니다.</p>
                ) : (
                  <div>
                    {cartItems.map((item, index) => (
                      <div key={index} style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        padding: "10px 0",
                        borderBottom: "1px solid #eee"
                      }}>
                        <div>
                          <div>{item.name}</div>
                          <div style={{ fontSize: "14px", color: "#666" }}>
                            {item.quantity}개 × {item.price.toLocaleString()}원
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setCartItems(prev => prev.filter((_, i) => i !== index));
                            setCartItemCount(prev => prev - item.quantity);
                          }}
                          style={{
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            padding: "5px 10px",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}
                        >
                          삭제
                        </button>
        </div>
      ))}
                    <div style={{ 
                      marginTop: "20px", 
                      textAlign: "center",
                      borderTop: "1px solid #eee",
                      paddingTop: "20px"
                    }}>
                      <button 
                        onClick={() => navigate("/cart")}
                        style={{
                          backgroundColor: "#007bff",
                          color: "white",
                          border: "none",
                          padding: "10px 20px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          marginRight: "10px"
                        }}
                      >
                        장바구니 보기
                      </button>
                      <button 
                        onClick={() => setShowCart(false)}
                        style={{
                          backgroundColor: "#6c757d",
                          color: "white",
                          border: "none",
                          padding: "10px 20px",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        닫기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* 푸터 */}
      <Footer footerData={siteData.footer} />

      {/* 옵션 모달 */}
      {isOptionsModalOpen && optionsTargetProduct && (
        <OptionsModal
          product={optionsTargetProduct}
          onConfirm={handleConfirmOptions}
          onCancel={handleCancelOptions}
        />
      )}
    </div>
  );
};

export default Preview;
