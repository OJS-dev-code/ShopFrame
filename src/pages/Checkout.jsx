import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SiteContext } from "../context/SiteContext";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import MegaMenu from "../components/MegaMenu";
import DropdownMenu from "../components/DropdownMenu";
import MobileHeader from "../components/MobileHeader";
import Footer from "../components/Footer";
import "../components/HeaderResponsive.scss";
import "./Checkout.scss";

const Checkout = () => {
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
        isLoading
    } = useContext(SiteContext);

    const [cartItems, setCartItems] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        postalCode: "",
        address: "",
        detailedAddress: "",
        points: "",
        coupon: "",
        paymentMethod: "creditCard",
        selectedCard: ""
    });

    const navigate = useNavigate();

    // 장바구니 데이터 로드 (Cart에서 전달한 선택 상품 사용)
    useEffect(() => {
        const loadCartData = () => {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                setCartItems(JSON.parse(savedCart));
            }
        };

        loadCartData();

        // localStorage 변경 감지를 위한 이벤트 리스너
        const handleStorageChange = (e) => {
            if (e.key === 'cart') {
                loadCartData();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // 기본 배송지 불러오기
    useEffect(() => {
        const loadDefaultAddress = async () => {
            if (!currentUser) return;

            try {
                const addressDoc = await getDoc(doc(db, "users", currentUser.uid, "defaultAddress", "address"));
                if (addressDoc.exists()) {
                    const addressData = addressDoc.data();
                    setFormData(prev => ({
                        ...prev,
                        name: addressData.name || "",
                        phone: addressData.phone || "",
                        postalCode: addressData.postalCode || "",
                        address: addressData.address || "",
                        detailedAddress: addressData.detailedAddress || ""
                    }));
                }
            } catch (error) {
                console.error("기본 배송지 불러오기 오류:", error);
            }
        };

        loadDefaultAddress();
    }, [currentUser]);

    // 장바구니 아이템 수 계산
    const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    // 헤더 렌더링 함수
    const renderHeader = () => {
        const headerProps = {
            title: siteTitle,
            placeholder: searchPlaceholder,
            categories: categories || [],
            onCategoryClick: (categoryId) => {
                if (siteName) {
                    navigate(`/site/${siteName}`);
                } else {
                    navigate("/preview");
                }
            },
            searchQuery: "",
            onSearchChange: () => { },
            onSearchSubmit: () => { },
            currentUser: currentUser,
            onLoginClick: () => navigate('/'),
            onSignupClick: () => navigate('/signup'),
            onLogoutClick: () => {
                navigate('/');
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

    // 금액 계산
    const totalProductAmount = cartItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);

    const totalPurchaseAmount = cartItems.reduce((sum, item) => {
        const purchasePrice = item.salePrice || item.price;
        return sum + (purchasePrice * item.quantity);
    }, 0);

    const discountAmount = totalProductAmount - totalPurchaseAmount;
    const baseShippingCost = totalPurchaseAmount > 50000 ? 0 : 3000;
    const couponDiscount = formData.coupon === "newuser" ? 3000 : 0; // 신규가입 배송비 무료 쿠폰 (표시용)
    const shippingCost = formData.coupon === "newuser" ? 0 : baseShippingCost; // 쿠폰 적용 시 배송비 무료
    const pointsDiscount = parseInt(formData.points) || 0; // 적립금 할인
    const finalAmount = totalPurchaseAmount + baseShippingCost - couponDiscount - pointsDiscount; // 실제 계산에서는 baseShippingCost 사용

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Daum 우편번호 서비스
    const handleAddressSearch = () => {
        new window.daum.Postcode({
            oncomplete: function (data) {
                // 우편번호와 주소 정보를 해당 필드에 넣는다.
                setFormData(prev => ({
                    ...prev,
                    postalCode: data.zonecode,
                    address: data.address
                }));
            }
        }).open();
    };

    const handlePointsBlur = (e) => {
        const value = parseInt(e.target.value) || 0;
        const adjustedPoints = Math.floor(value / 10) * 10; // 10원 단위로 내림

        if (value !== adjustedPoints && value > 0) {
            alert("적립금은 10원 단위로 사용 가능합니다.");
            setFormData(prev => ({
                ...prev,
                points: adjustedPoints.toString()
            }));
        }
    };

    const saveDefaultAddress = async () => {
        if (!currentUser) {
            alert("로그인이 필요합니다.");
            return;
        }

        if (!formData.name || !formData.phone || !formData.postalCode || !formData.address) {
            alert("배송지 정보를 모두 입력해주세요.");
            return;
        }

        try {
            const addressData = {
                name: formData.name,
                phone: formData.phone,
                postalCode: formData.postalCode,
                address: formData.address,
                detailedAddress: formData.detailedAddress,
                savedAt: new Date().toISOString()
            };

            await setDoc(doc(db, "users", currentUser.uid, "defaultAddress", "address"), addressData);
            alert("기본 배송지가 저장되었습니다.");
        } catch (error) {
            console.error("배송지 저장 오류:", error);
            alert("배송지 저장에 실패했습니다.");
        }
    };

    const handlePayment = () => {
        // 신용카드 결제 선택 시 카드 종류 필수 선택
        if (formData.paymentMethod === "creditCard" && !formData.selectedCard) {
            alert("결제수단을 선택해주십시오.");
            return;
        }
        // 주문 데이터 생성 및 저장 (배송완료 처리)
        try {
            const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            const now = new Date();
            const orderDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
            const orderNumber = `O${now.getTime()}`;
            const newOrders = cartItems.map((item) => {
                let optionText = '';
                if (item.selectedOptions && Object.keys(item.selectedOptions).length > 0) {
                    optionText += Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ');
                }
                if (item.selectedColor) {
                    if (optionText) optionText += ', ';
                    optionText += `색상: ${item.selectedColor.name}`;
                }

                const amount = (item.salePrice || item.price) * item.quantity;
                return {
                    orderDate,
                    orderNumber,
                    product: {
                        image: item.image || '/images/item1.png',
                        brand: '',
                        name: item.name,
                        option: optionText
                    },
                    quantity: item.quantity,
                    amount,
                    status: '배송완료'
                };
            });
            localStorage.setItem('orders', JSON.stringify([...existingOrders, ...newOrders]));
        } catch { }

        alert("실제 결제 과정은 준비중입니다.");
        // 장바구니 비우기 (주문한 항목만 제거)
        try {
            const existingCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
            const orderedKeys = new Set(
                (cartItems || []).map((it) => `${it.id}-${JSON.stringify(it.options || {})}`)
            );
            const remaining = existingCartItems.filter((it) => {
                const key = `${it.id}-${JSON.stringify(it.options || {})}`;
                return !orderedKeys.has(key);
            });
            localStorage.setItem('cartItems', JSON.stringify(remaining));
        } catch { }

        localStorage.removeItem('cart');
        setCartItems([]);
        // 홈으로 이동 (사용자 사이트 범위 유지)
        if (siteName) {
            navigate(`/site/${siteName}`);
        } else {
            navigate("/preview");
        }
    };

    // 로딩 중일 때는 헤더를 렌더링하지 않음
    if (isLoading) {
        return (
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                fontSize: "18px",
                color: "#6c757d"
            }}>
                로딩 중...
            </div>
        );
    }

    return (
        <div className="mobile-padding checkout-page">
            {renderHeader()}

            <div className="checkout-container">
                <h1 className="checkout-title">주문 / 결제</h1>

                <div className="checkout-content">
                    {/* 왼쪽 메인 컨텐츠 */}
                    <div className="checkout-main">

                        {/* 1. 배송지 */}
                        <div className="section">
                            <h2 className="section-title">
                                1. 배송지
                            </h2>

                            <div className="form-group">
                                <div>
                                    <label>이름</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="받는 분의 성함을 입력해주세요."
                                    />
                                </div>

                                <div>
                                    <label>전화 번호</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="받는 분의 전화번호를 입력해주세요."
                                    />
                                </div>

                                <div>
                                    <label>주소</label>
                                    <div className="address-row">
                                        <input
                                            type="text"
                                            name="postalCode"
                                            value={formData.postalCode}
                                            onChange={handleInputChange}
                                            placeholder="우편번호"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddressSearch}
                                            className="address-search-btn"
                                        >
                                            주소찾기
                                        </button>
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            placeholder="주소 (오른쪽 주소찾기를 이용해주세요)"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            name="detailedAddress"
                                            value={formData.detailedAddress}
                                            onChange={handleInputChange}
                                            placeholder="상세주소 : 직접 입력해주세요"
                                        />
                                    </div>
                                </div>

                                {/* 기본 배송지 저장 버튼 */}
                                <div className="save-address-btn-container">
                                    <button
                                        type="button"
                                        onClick={saveDefaultAddress}
                                        className="save-address-btn"
                                    >
                                        기본 배송지로 저장
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 2. 주문 상품 */}
                        <div className="section">
                            <h2 className="section-title">
                                2. 주문 상품
                            </h2>

                            <div className="order-items-container">
                                {cartItems.map((item, index) => (
                                    <div key={`${item.id}-${index}`} className="order-item">
                                        <div className="order-item-content">
                                            {/* 상품 이미지 */}
                                            <div className="order-item-image">
                                                {item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                    />
                                                ) : (
                                                    <div className="no-image">
                                                        이미지
                                                    </div>
                                                )}
                                            </div>

                                            {/* 상품 정보 */}
                                            <div className="order-item-details">
                                                <div className="order-item-category">
                                                    {(() => {
                                                        // 카테고리 이름 찾기
                                                        const getCategoryNameById = (catId) => {
                                                            if (!catId) return null;
                                                            const topLevel = (siteData?.categories || []).find(c => c.id === catId);
                                                            if (topLevel) return topLevel.name;
                                                            for (const cat of siteData?.categories || []) {
                                                                const sub = (cat.subcategories || []).find(sc => sc.id === catId);
                                                                if (sub) return sub.name;
                                                            }
                                                            return null;
                                                        };
                                                        return getCategoryNameById(item.categoryId) || "카테고리";
                                                    })()}
                                                </div>
                                                <div className="order-item-name">
                                                    {item.name}
                                                </div>
                                                {item.selectedOptions && Object.entries(item.selectedOptions).map(([key, value]) => (
                                                    <div key={key} className="order-item-option">
                                                        {key}: {value}
                                                    </div>
                                                ))}
                                                {item.selectedColor && (
                                                    <div className="order-item-option">
                                                        색상: {item.selectedColor.name}
                                                    </div>
                                                )}
                                                {item.options && Object.entries(item.options).map(([key, value]) => (
                                                    <div key={key} className="order-item-option">
                                                        {key}: {value}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* 수량 */}
                                            <div className="order-item-quantity">
                                                {item.quantity}
                                            </div>

                                            {/* 가격 */}
                                            <div className="order-item-price">
                                                {item.salePrice && item.salePrice < item.price ? (
                                                    <div>
                                                        <div className="order-item-original-price">
                                                            {item.price.toLocaleString()}원
                                                        </div>
                                                        <div className="order-item-sale-price">
                                                            {item.salePrice.toLocaleString()}원
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="order-item-sale-price">
                                                        {item.price.toLocaleString()}원
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. 쿠폰 / 포인트 사용 */}
                        <div className="section">
                            <h2 className="section-title">
                                3. 쿠폰 / 포인트 사용
                            </h2>

                            <div className="form-group">
                                <div>
                                    <label>적립금 사용</label>
                                    <div className="points-info">
                                        현재 적립금 : {currentUser ? "2,000원" : "0원"} (10원 단위로 사용 가능)
                                    </div>
                                    <input
                                        type="number"
                                        name="points"
                                        value={formData.points}
                                        onChange={handleInputChange}
                                        onBlur={handlePointsBlur}
                                        placeholder="10원 단위로 사용 가능합니다."
                                        min="0"
                                        max="2000"
                                        step="10"
                                    />
                                </div>

                                <div>
                                    <label>쿠폰 사용</label>
                                    <select
                                        name="coupon"
                                        value={formData.coupon}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">사용하실 쿠폰을 선택해주세요.</option>
                                        <option value="newuser">신규가입 배송비 무료 쿠폰</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 4. 결제 수단 선택 */}
                        <div className="section">
                            <h2 className="section-title">
                                4. 결제 수단 선택
                            </h2>

                            <div className="payment-methods">
                                <div className="payment-method-item">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="creditCard"
                                        checked={formData.paymentMethod === "creditCard"}
                                        onChange={handleInputChange}
                                    />
                                    <span className="payment-method-label">신용카드</span>
                                    <div className="card-select-container">
                                        <select
                                            name="selectedCard"
                                            value={formData.selectedCard}
                                            onChange={handleInputChange}
                                            className="card-select"
                                        >
                                            <option value="">카드를 선택해주세요.</option>
                                            <option value="kb">KB카드</option>
                                            <option value="hyundai">현대카드</option>
                                            <option value="nh">NH카드</option>
                                            <option value="samsung">삼성카드</option>
                                            <option value="lotte">롯데카드</option>
                                            <option value="shinhan">신한카드</option>
                                            <option value="bc">BC카드</option>
                                            <option value="hana">하나카드</option>
                                            <option value="woori">우리카드</option>
                                            <option value="kakaobank">카카오뱅크</option>
                                            <option value="citi">씨티카드</option>
                                            <option value="gwangju">광주비자</option>
                                            <option value="jeonbuk">전북카드</option>
                                            <option value="shinhyup">신협카드</option>
                                            <option value="suhyup">수협카드</option>
                                            <option value="jeju">제주카드</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="payment-method-row">
                                    <div className="payment-method-item">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="kakaoPay"
                                            checked={formData.paymentMethod === "kakaoPay"}
                                            onChange={handleInputChange}
                                        />
                                        <div className="payment-icon kakao-pay">
                                            pay
                                        </div>
                                        <span className="payment-method-label">카카오페이</span>
                                    </div>
                                    <div className="payment-method-item">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="mobile"
                                            checked={formData.paymentMethod === "mobile"}
                                            onChange={handleInputChange}
                                        />
                                        <span className="payment-method-label">휴대폰 결제</span>
                                    </div>
                                </div>

                                <div className="payment-method-row">
                                    <div className="payment-method-item">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="naverPay"
                                            checked={formData.paymentMethod === "naverPay"}
                                            onChange={handleInputChange}
                                        />
                                        <div className="payment-icon naver-pay">
                                            N pay
                                        </div>
                                        <span className="payment-method-label">네이버페이</span>
                                    </div>
                                    <div className="payment-method-item">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="bankTransfer"
                                            checked={formData.paymentMethod === "bankTransfer"}
                                            onChange={handleInputChange}
                                        />
                                        <span className="payment-method-label">계좌이체결제</span>
                                    </div>
                                </div>

                                <div className="payment-method-item">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="payco"
                                        checked={formData.paymentMethod === "payco"}
                                        onChange={handleInputChange}
                                    />
                                    <div className="payment-icon payco">
                                        PAYCO
                                    </div>
                                    <span className="payment-method-label">페이코</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽 요약 박스 */}
                    <div className="checkout-sidebar">
                        <div className="order-summary">
                            <div className="summary-title">
                                주문 요약
                            </div>

                            <div className="summary-totals">
                                <div className="total-row">
                                    <span className="label">총 상품 금액</span>
                                    <span className="amount">
                                        {totalProductAmount.toLocaleString()}원
                                    </span>
                                </div>

                                <div className="total-row">
                                    <span className="label">할인 금액</span>
                                    <span className="amount discount">
                                        -{discountAmount.toLocaleString()}원
                                    </span>
                                </div>

                                <div className="total-row">
                                    <span className="label">쿠폰 할인금액</span>
                                    <span className="amount discount">
                                        -{couponDiscount.toLocaleString()}원
                                    </span>
                                </div>

                                <div className="total-row">
                                    <span className="label">적립금 할인금액</span>
                                    <span className="amount discount">
                                        -{pointsDiscount.toLocaleString()}원
                                    </span>
                                </div>

                                <div className="total-row shipping-cost">
                                    <span className="label">배송비</span>
                                    <div className="shipping-amount">
                                        <span className="shipping-icon">+</span>
                                        <span className="shipping-value">
                                            {baseShippingCost.toLocaleString()}원
                                        </span>
                                    </div>
                                </div>

                                <div className="total-row final-total">
                                    <span className="label">결제예정금액</span>
                                    <span className="amount">
                                        {finalAmount.toLocaleString()}원
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handlePayment}
                                className="checkout-button"
                            >
                                결제하기
                            </button>
                        </div>
                    </div>
                </div>

                {/* 푸터 */}
                <Footer footerData={siteData.footer} />
            </div>
        </div>
    );
};

export default Checkout;
