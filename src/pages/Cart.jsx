import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SiteContext } from "../context/SiteContext";
import MegaMenu from "../components/MegaMenu";
import DropdownMenu from "../components/DropdownMenu";
import MobileHeader from "../components/MobileHeader";
import Footer from "../components/Footer";
import "../components/HeaderResponsive.scss";
import "./Cart.scss";

const Cart = () => {
  const { siteName } = useParams();
  const { 
    categories, 
    products,
    siteData, 
    currentUser,
    headerType,
    siteTitle,
    searchPlaceholder,
    logoUrl,
    isLoading,
    getCartItems,
    updateCartQuantity,
    removeFromCart,
    clearCart
  } = useContext(SiteContext);
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const navigate = useNavigate();

  // 카테고리 이름 찾기 (대/소카테고리 모두)
  const getCategoryNameById = (catId) => {
    if (!catId) return null;
    const topLevel = (siteData?.categories || []).find(c => c.id === catId);
    if (topLevel) return topLevel.name;
    for (const cat of siteData?.categories || []) {
      const sub = (cat.subcategories || []).find(sc => sc.id === catId);
      if (sub) return sub.name;
    }
    // 기존 categories 배열에서도 탐색 시도
    const fallback = (categories || []).find(c => c.id === catId);
    return fallback ? fallback.name : null;
  };

  // 장바구니 아이템 개수 계산
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // 사이트별 장바구니 데이터 로드
  useEffect(() => {
    const loadCartItems = async () => {
      if (currentUser) {
        try {
          const items = await getCartItems();
          setCartItems(items);
        } catch (error) {
          console.error('장바구니 로드 실패:', error);
        }
      } else {
        setCartItems([]);
      }
    };

    loadCartItems();
  }, [currentUser, getCartItems]);

  // 선택한 상품의 결제예정금액 계산
  const calculateSelectedTotal = () => {
    if (selectedItems.size === 0) return 0;
    
    let total = 0;
    cartItems.forEach(item => {
      const itemId = `${item.id}-${JSON.stringify(item.options || {})}`;
      if (selectedItems.has(itemId)) {
        const discountedPrice = item.salePrice || item.price;
        total += discountedPrice * item.quantity;
      }
    });
    // 항상 고정 배송비(3,000원). 선택한 상품이 없으면 0원
    const shippingFee = total > 0 ? 3000 : 0;
    return total + shippingFee;
  };

  const selectedTotal = calculateSelectedTotal();

  // 헤더 렌더링 함수
  const renderHeader = () => {
    const headerProps = {
      title: siteTitle,
      placeholder: searchPlaceholder,
      categories: categories || [],
      onCategoryClick: (category) => {
        const categoryId = typeof category === 'string' ? category : (category && category.id);
        if (!categoryId) return;
        if (siteName) {
          navigate(`/site/${siteName}/category/${categoryId}`);
        } else {
          navigate(`/category/${categoryId}`);
        }
      },
      searchQuery: "",
      onSearchChange: () => {},
      onSearchSubmit: () => {},
      currentUser: currentUser,
      onLoginClick: () => {
        if (siteName) {
          navigate(`/site/${siteName}/login`);
        } else {
          navigate(`/site-login`);
        }
      },
      onSignupClick: () => {
        if (siteName) {
          navigate(`/site/${siteName}/signup`);
        } else {
          navigate(`/site-signup`);
        }
      },
      onLogoutClick: () => {
        if (siteName) {
          navigate(`/site/${siteName}`);
        } else {
          navigate('/preview');
        }
      },
      logoUrl: logoUrl,
      logoStyle: siteData.logoStyle || 'text',
      cartItemCount: cartItemCount,
      searchAdImage: siteData.searchAdImage
    };

    return (
      <>
        {/* 모바일 헤더 */}
        <MobileHeader {...headerProps} />
        
        {/* 데스크톱 헤더 */}
        <div className="desktop-header">
          {(() => {
            switch (headerType) {
              case 'HeaderA':
                return <MegaMenu {...headerProps} />;
              case 'HeaderB':
                return <DropdownMenu {...headerProps} />;
              default:
                return <MegaMenu {...headerProps} />;
            }
          })()}
        </div>
      </>
    );
  };

  // 사이트별 장바구니 데이터 로드 (이미 위에서 처리됨)

  // 상품 데이터가 변경될 때 장바구니의 상품 정보 업데이트
  useEffect(() => {
    if (products && products.length > 0 && cartItems.length > 0) {
      const updatedCartItems = cartItems.map(cartItem => {
        const updatedProduct = products.find(p => p.id === cartItem.id);
        if (updatedProduct) {
          return {
            ...cartItem,
            name: updatedProduct.name,
            price: updatedProduct.price,
            salePrice: updatedProduct.salePrice,
            discountPercent: updatedProduct.discountPercent,
            image: updatedProduct.image,
            categoryId: updatedProduct.categoryId,
            description: updatedProduct.description
          };
        }
        return cartItem;
      });
      
      const hasChanges = updatedCartItems.some((item, index) => 
        JSON.stringify(item) !== JSON.stringify(cartItems[index])
      );
      
      if (hasChanges) {
        console.log('Updating cart items with new product data:', updatedCartItems);
        setCartItems(updatedCartItems);
        // 사이트별 시스템에서는 자동으로 저장됨
      }
    }
  }, [products, cartItems]);

  // 장바구니 데이터 저장 (사이트별 시스템 사용)
  const saveCart = async (items) => {
    setCartItems(items);
  };

  // 전체 선택/해제
  const toggleAllSelection = () => {
    if (isAllSelected) {
      setSelectedItems(new Set());
      setIsAllSelected(false);
    } else {
      const allItemIds = new Set(cartItems.map(item => `${item.id}-${JSON.stringify(item.options || {})}`));
      setSelectedItems(allItemIds);
      setIsAllSelected(true);
    }
  };

  // 개별 상품 선택/해제
  const toggleItemSelection = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
    setIsAllSelected(newSelected.size === cartItems.length);
  };

  // 수량 변경
  const updateQuantity = async (productId, options, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      await updateCartQuantity(productId, options, newQuantity);
      // 장바구니 데이터 다시 로드
      const items = await getCartItems();
      setCartItems(items);
    } catch (error) {
      console.error('수량 변경 실패:', error);
    }
  };

  // 선택된 상품 삭제
  const removeSelectedItems = async () => {
    if (selectedItems.size === 0) {
      alert("삭제할 상품을 선택해주세요!");
      return;
    }
    if (window.confirm(`선택된 ${selectedItems.size}개 상품을 삭제하시겠습니까?`)) {
      try {
        // 선택된 각 상품을 개별적으로 삭제
        for (const itemId of selectedItems) {
          const [productId, optionsStr] = itemId.split('-', 2);
          const options = JSON.parse(optionsStr);
          await removeFromCart(productId, options);
        }
        
        // 장바구니 데이터 다시 로드
        const items = await getCartItems();
        setCartItems(items);
        setSelectedItems(new Set());
        setIsAllSelected(false);
      } catch (error) {
        console.error('상품 삭제 실패:', error);
      }
    }
  };

  // 전체 삭제
  const clearCartItems = async () => {
    if (window.confirm("장바구니를 비우시겠습니까?")) {
      try {
        await clearCart();
        setCartItems([]);
        setSelectedItems(new Set());
        setIsAllSelected(false);
      } catch (error) {
        console.error('장바구니 비우기 실패:', error);
      }
    }
  };

  // 개별 상품 삭제
  const removeItem = async (productId, options) => {
    try {
      await removeFromCart(productId, options);
      
      // 장바구니 데이터 다시 로드
      const items = await getCartItems();
      setCartItems(items);
      
      const itemId = `${productId}-${JSON.stringify(options || {})}`;
      const newSelected = new Set(selectedItems);
      newSelected.delete(itemId);
      setSelectedItems(newSelected);
      setIsAllSelected(newSelected.size === items.length);
    } catch (error) {
      console.error('상품 삭제 실패:', error);
    }
  };

  // 찜하기
  const addToWishlist = (item) => {
    alert(`${item.name}을(를) 찜 목록에 추가했습니다.`);
  };

  // 바로구매
  const buyNow = (item) => {
    const checkoutItems = [item];
    localStorage.setItem('cart', JSON.stringify(checkoutItems));
    if (siteName) {
      navigate(`/site/${siteName}/checkout`);
    } else {
      navigate("/checkout");
    }
  };

  // 총 가격 계산 (선택된 상품만)
  const selectedItemsArray = cartItems.filter(item => {
    const itemId = `${item.id}-${JSON.stringify(item.options || {})}`;
    return selectedItems.has(itemId);
  });

  // 총 상품 금액: 선택한 상품의 판매가(원가)를 더한 값
  const totalProductAmount = selectedItemsArray.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  // 구매가 총액: 선택한 상품의 구매가(할인가)를 더한 값
  const totalPurchaseAmount = selectedItemsArray.reduce((sum, item) => {
    const purchasePrice = item.salePrice || item.price;
    return sum + (purchasePrice * item.quantity);
  }, 0);

  // 항상 고정 배송비(3,000원). 선택한 상품이 없으면 0원
  const shippingCost = selectedItemsArray.length > 0 ? 3000 : 0;
  
  // 할인금액: 판매가 총액에서 구매가 총액을 뺀 값
  const discountAmount = totalProductAmount - totalPurchaseAmount;

  const finalAmount = totalPurchaseAmount + shippingCost;

  // 로딩 중일 때는 헤더를 렌더링하지 않음
  if (isLoading) {
    return (
      <div className="cart-loading">
        로딩 중...
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="mobile-padding cart-page">
        {renderHeader()}
        <div className="cart-container">
          <h1 className="cart-title">장바구니</h1>
          <div className="empty-cart">
            <div className="empty-message">
              장바구니가 비어있습니다
            </div>
            <button
              onClick={() => {
                if (siteName) {
                  navigate(`/site/${siteName}`);
                } else {
                  navigate("/preview");
                }
              }}
              className="shopping-btn"
            >
              쇼핑 계속하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-padding cart-page">
      {renderHeader()}
      
      <div className="cart-container">
        <h1 className="cart-title">장바구니</h1>

        {/* 장바구니 테이블 */}
        <div className="cart-table">
          {/* 헤더 행 */}
          <div className="cart-header">
            <label className="select-all">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleAllSelection}
              />
              <span>전체선택</span>
            </label>
            <div className="header-cell">상품정보</div>
            <div className="header-cell">수량</div>
            <div className="header-cell">판매가</div>
            <div className="header-cell">구매가</div>
            <div></div>
          </div>

          {/* 상품 행들 */}
          {cartItems.map((item, index) => {
            const itemId = `${item.id}-${JSON.stringify(item.options || {})}`;
            const isSelected = selectedItems.has(itemId);
            const categoryName = getCategoryNameById(item.categoryId);
            const salePrice = item.salePrice || item.price;
            const hasDiscount = item.salePrice && item.salePrice < item.price;

            return (
              <div key={itemId} className="cart-item">
                {/* 체크박스 */}
                <div className="item-checkbox">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleItemSelection(itemId)}
                  />
                </div>
                
                {/* 삭제 버튼 (X 버튼) */}
                <button
                  className="remove-btn"
                  onClick={() => removeItem(item.id, item.options)}
                >
                  ×
                </button>

                {/* 상품 정보 */}
                <div className="item-info">
                  {/* 상품 이미지 */}
                  <div className="item-image">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                  </div>

                  {/* 상품 텍스트 정보 */}
                  <div className="item-details">
                    <div className="category">
                      {categoryName || ""}
                    </div>
                    <div className="name">
                      {item.name}
                    </div>
                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                      <div className="options">
                        {Object.entries(item.selectedOptions).map(([key, value]) => (
                          <div key={key} className="option-item">
                            {key}: {value}
                          </div>
                        ))}
                      </div>
                    )}
                    {item.selectedColor && (
                      <div className="color-option">
                        색상: {item.selectedColor.name}
                      </div>
                    )}
                    {item.options && Object.keys(item.options).length > 0 && (
                      <div className="options">
                        {Object.entries(item.options).map(([key, value]) => (
                          <div key={key} className="option-item">
                            {key}: {value}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 두 번째 줄: 수량조절과 가격 정보 (모바일 전용) */}
                <div className="item-bottom">
                  {/* 수량 */}
                  <div className="quantity-controls">
                    <button
                      onClick={() => updateQuantity(item.id, item.options, item.quantity - 1)}
                      className="quantity-btn"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, item.options, parseInt(e.target.value) || 1)}
                      className="quantity-input"
                    />
                    <button
                      onClick={() => updateQuantity(item.id, item.options, item.quantity + 1)}
                      className="quantity-btn"
                    >
                      +
                    </button>
                  </div>

                  {/* 가격 정보 */}
                  <div className="price-section">
                    {/* 판매가 (원래 가격) - 취소선 */}
                    <div className="original-price">
                      {item.price.toLocaleString()}원
                    </div>

                    {/* 구매가 (할인된 가격) */}
                    <div className="sale-price">
                      {hasDiscount ? (
                        <div className="final-price">
                          {salePrice.toLocaleString()}원
                        </div>
                      ) : (
                        <div className="normal-price">
                          {item.price.toLocaleString()}원
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* PC 버전용 수량 컨트롤 */}
                <div className="pc-quantity">
                  <button
                    onClick={() => updateQuantity(item.id, item.options, item.quantity - 1)}
                    className="quantity-btn"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, item.options, parseInt(e.target.value) || 1)}
                    className="quantity-input"
                  />
                  <button
                    onClick={() => updateQuantity(item.id, item.options, item.quantity + 1)}
                    className="quantity-btn"
                  >
                    +
                  </button>
                </div>

                {/* PC 버전용 판매가 (원래 가격) */}
                <div className="pc-original-price">
                  {item.price.toLocaleString()}원
                </div>

                {/* PC 버전용 구매가 (할인된 가격) */}
                <div className="pc-sale-price">
                  {hasDiscount ? (
                    <div>
                      {salePrice.toLocaleString()}원
                    </div>
                  ) : (
                    <div>
                      {item.price.toLocaleString()}원
                    </div>
                  )}
                </div>

                {/* 액션 버튼들 - 데스크톱에서만 표시 */}
                <div className="item-actions desktop-only">
                  <button
                    onClick={() => buyNow(item)}
                    className="action-btn"
                  >
                    바로구매
                  </button>
                  <button
                    onClick={() => addToWishlist(item)}
                    className="action-btn"
                  >
                    찜
                  </button>
                  <button
                    onClick={() => removeItem(item.id, item.options)}
                    className="action-btn"
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 선택 삭제, 전체 삭제 버튼 */}
        <div className="cart-actions">
          <button
            onClick={clearCartItems}
            className="action-btn"
          >
            전체 삭제
          </button>
          <button
            onClick={removeSelectedItems}
            className="action-btn"
          >
            선택 삭제
          </button>
        </div>

        {/* 하단 요약 영역 */}
        <div className="cart-summary">
          <div className="summary-item">
            <div className="label">총 상품 금액</div>
            <div className="amount">
              {totalProductAmount.toLocaleString()}원
            </div>
          </div>
          
          <div className="summary-item">
            <div className="label">배송비</div>
            <div className="amount">
              <span className="icon" style={{ color: "#007bff" }}>+</span>
              <span>{shippingCost.toLocaleString()}원</span>
            </div>
          </div>
          
          <div className="summary-item">
            <div className="label">할인금액</div>
            <div className="amount discount">
              <span className="icon" style={{ color: "#dc3545" }}>-</span>
              <span>{discountAmount.toLocaleString()}원</span>
            </div>
          </div>
          
          <div className="summary-item">
            <div className="label">결제예정금액</div>
            <div className="amount total">
              <span className="icon" style={{ color: "#333" }}>=</span>
              <span>{finalAmount.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* 결제 버튼 */}
        <div className="checkout-btn">
          <button
            onClick={() => {
              if (selectedItems.size === 0) {
                alert("주문할 상품을 선택해주세요!");
                return;
              }
              // 선택된 상품만 결제 페이지로 전달
              const checkoutItems = cartItems.filter(item => {
                const itemId = `${item.id}-${JSON.stringify(item.options || {})}`;
                return selectedItems.has(itemId);
              });
              localStorage.setItem('cart', JSON.stringify(checkoutItems));
              if (siteName) {
                navigate(`/site/${siteName}/checkout`);
              } else {
                navigate("/checkout");
              }
            }}
          >
            {selectedItems.size === 0 
              ? "상품을 선택해주세요" 
              : `${selectedTotal.toLocaleString()}원 주문하기`
            }
          </button>
        </div>
      </div>

      {/* 푸터 */}
      <Footer footerData={siteData.footer} />
    </div>
  );
};

export default Cart;