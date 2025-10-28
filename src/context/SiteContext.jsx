// src/context/SiteContext.jsx
import React, { createContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  orderBy 
} from "firebase/firestore";
import { 
  saveSiteCart, 
  getSiteCart, 
  addToSiteCart, 
  updateSiteCartQuantity, 
  removeFromSiteCart, 
  clearSiteCart, 
  getSiteCartItemCount 
} from "../utils/cartManager";

export const SiteContext = createContext();

export const SiteProvider = ({ children }) => {
  // URL에서 siteName 추출
  const getSiteNameFromUrl = () => {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/site/')) {
      const parts = pathname.split('/');
      return parts[2] || null;
    }
    return null;
  };
  
  const [siteName, setSiteName] = useState(getSiteNameFromUrl());
  
  // URL 변경 감지 (더 정확한 감지)
  useEffect(() => {
    const handleLocationChange = () => {
      const newSiteName = getSiteNameFromUrl();
      console.log('🔍 URL changed, new siteName:', newSiteName);
      setSiteName(newSiteName);
    };
    
    // 초기 로드 시
    handleLocationChange();
    
    // popstate 이벤트 리스너 (뒤로가기/앞으로가기)
    window.addEventListener('popstate', handleLocationChange);
    
    // pushstate/replacestate 감지를 위한 interval (React Router 사용 시)
    const interval = setInterval(() => {
      const currentSiteName = getSiteNameFromUrl();
      if (currentSiteName !== siteName) {
        console.log('🔍 SiteName changed via interval:', currentSiteName);
        setSiteName(currentSiteName);
      }
    }, 50); // 더 빠른 감지를 위해 50ms로 변경
    
    // pushstate/replacestate 이벤트 감지
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      setTimeout(handleLocationChange, 0);
    };
    
    window.history.replaceState = function(...args) {
      originalReplaceState.apply(window.history, args);
      setTimeout(handleLocationChange, 0);
    };
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(interval);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [siteName]);
  
  // undefined 값을 모두 제거하여 Firestore에 안전하게 저장
  const sanitizeForFirestore = (value) => {
    if (value === undefined) return undefined; // 상위에서 필터링됨
    if (value === null) return null;
    if (Array.isArray(value)) {
      return value
        .map((item) => sanitizeForFirestore(item))
        .filter((item) => item !== undefined);
    }
    if (typeof value === "object") {
      const result = {};
      Object.keys(value).forEach((key) => {
        const cleaned = sanitizeForFirestore(value[key]);
        if (cleaned !== undefined) {
          result[key] = cleaned;
        }
      });
      return result;
    }
    return value;
  };
  // Firebase에서 데이터 로드하는 함수
  const loadSiteData = async (userId, siteName = null) => {
    if (!userId) {
      console.log('No userId, returning null');
      return null;
    }
    
    try {
      console.log('Loading site data from Firebase for user:', userId, 'siteName:', siteName);
      
      // 사이트별 웹사이트인 경우 해당 사이트의 데이터를 로드
      if (siteName) {
        // 사이트별 데이터 로드
        const [siteDataDoc, sliderImagesDoc] = await Promise.all([
          getDoc(doc(db, "siteData", userId)), // 관리자 데이터에서 사이트 정보 가져오기
          getDoc(doc(db, "sliderImages", userId))
        ]);
        
        if (siteDataDoc.exists()) {
          const data = siteDataDoc.data();
          // 사이트 영어 이름이 일치하는지 확인
          if (data.siteEnglishName === siteName) {
            console.log('Site data loaded for site:', siteName);
            return await processSiteData(data, sliderImagesDoc);
          } else {
            console.log('Site name mismatch. Expected:', siteName, 'Found:', data.siteEnglishName);
            return null;
          }
        }
        return null;
      } else {
        // 관리자 데이터 로드
        const [siteDataDoc, sliderImagesDoc] = await Promise.all([
          getDoc(doc(db, "siteData", userId)),
          getDoc(doc(db, "sliderImages", userId))
        ]);
        
        if (siteDataDoc.exists()) {
          const data = siteDataDoc.data();
          console.log('Admin data loaded:', data);
          return await processSiteData(data, sliderImagesDoc);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error loading site data:', error);
      return null;
    }
  };

  // 사이트 데이터 처리 함수
  const processSiteData = async (data, sliderImagesDoc) => {
    try {
      console.log('Processing site data:', data);
        
        // 유틸: 다양한 필드명을 안전하게 표준 필드로 변환
        const normalizeSlides = (input = [], defaults = []) => {
          // 객체 형태로 { slides: [...] } 저장된 경우 지원
          let arr = input;
          if (!Array.isArray(arr) && arr && Array.isArray(arr.slides)) {
            arr = arr.slides;
          }
          if (!Array.isArray(arr) || arr.length === 0) return defaults;
          return arr
            .map((s, idx) => {
              if (s == null) return null;
              // 문자열만 있는 경우
              if (typeof s === 'string') {
                return {
                  id: idx + 1,
                  img: s,
                  alt: `슬라이드 ${idx + 1}`,
                  title: undefined,
                  navText: undefined,
                  link: undefined,
                  categoryId: null,
                };
              }
              // 다양한 키 지원
              const img = s.img || s.image || s.url || s.src || s.path || s.fileUrl || s.downloadURL || '';
              if (!img) return null;
              return {
                id: s.id || idx + 1,
                img,
                alt: s.alt || s.title || s.navText || `슬라이드 ${idx + 1}`,
                title: s.title,
                navText: s.navText,
                link: s.link,
                categoryId: s.categoryId ?? null,
              };
            })
            .filter(Boolean);
        };

        const defaultSliderImages = {
          BasicHeroCarousel: [
            { id: 1, img: "/images/kv1.jpg", alt: "슬라이드 1" },
            { id: 2, img: "/images/kv2.jpg", alt: "슬라이드 2" },
            { id: 3, img: "/images/kv3.png", alt: "슬라이드 3" }
          ],
          FadeHeroBanner: [
            { id: 1, img: "/images/kv1.jpg", alt: "슬라이드 1" },
            { id: 2, img: "/images/kv2.jpg", alt: "슬라이드 2" },
            { id: 3, img: "/images/kv3.png", alt: "슬라이드 3" }
          ],
          NumberedProgressSlider: [
            { id: 1, img: "/images/banner1.png", alt: "배너 1" },
            { id: 2, img: "/images/banner2.png", alt: "배너 2" },
            { id: 3, img: "/images/banner3.png", alt: "배너 3" }
          ]
        };

        // sliderImages를 별도 컬렉션에서 로드한 경우 병합/정규화
        let rawSliderImages = sliderImagesDoc && sliderImagesDoc.exists() ? sliderImagesDoc.data() : null;
        console.log('Raw slider data from Firebase:', rawSliderImages);
        const merged = rawSliderImages || {};
        data.sliderImages = {
          BasicHeroCarousel: normalizeSlides(merged.BasicHeroCarousel, defaultSliderImages.BasicHeroCarousel),
          FadeHeroBanner: normalizeSlides(merged.FadeHeroBanner, defaultSliderImages.FadeHeroBanner),
          NumberedProgressSlider: normalizeSlides(merged.NumberedProgressSlider, defaultSliderImages.NumberedProgressSlider)
        };
        console.log('Slider images normalized:', data.sliderImages);
        
        // productBadges가 배열이 아닐 때 기본값 설정
        if (!Array.isArray(data.productBadges)) {
          data.productBadges = [
            { id: "badge1", name: "BEST", color: "#e74c3c", isDefault: true },
            { id: "badge2", name: "자체제작", color: "#000000", isDefault: true },
            { id: "badge3", name: "NEW", color: "#000000", isDefault: true }
          ];
        }
        
        return data;
    } catch (error) {
      console.error('Failed to process site data:', error);
      return null;
    }
  };

  // 사이트별 데이터를 불러오는 함수 (로그인하지 않은 사용자용)
  const loadSiteDataByUrl = async (siteName) => {
    if (!siteName) {
      console.log('No siteName provided, returning null');
      return null;
    }
    
    try {
      console.log('Loading site data by URL for site:', siteName);
      
      // 모든 관리자의 siteData 컬렉션에서 해당 siteEnglishName을 가진 데이터 찾기
      const siteDataCollectionRef = collection(db, 'siteData');
      const q = query(siteDataCollectionRef, where('siteEnglishName', '==', siteName));
      const querySnapshot = await getDocs(q);
      
      console.log('Query snapshot results:', { 
        empty: querySnapshot.empty, 
        size: querySnapshot.size,
        searchingFor: siteName,
        docs: querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          siteEnglishName: doc.data().siteEnglishName,
          siteTitle: doc.data().siteTitle 
        }))
      });
      
      // 모든 사이트 목록도 출력해서 디버깅
      if (querySnapshot.empty) {
        console.log('🔍 No sites found. Let me check all available sites...');
        const allSitesQuery = query(siteDataCollectionRef);
        const allSitesSnapshot = await getDocs(allSitesQuery);
        console.log('🔍 All available sites:', allSitesSnapshot.docs.map(doc => ({
          id: doc.id,
          siteEnglishName: doc.data().siteEnglishName,
          siteTitle: doc.data().siteTitle
        })));
      }
      
      if (!querySnapshot.empty) {
        // 첫 번째 매칭되는 문서의 데이터 사용
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        const userId = doc.id; // 관리자 ID 가져오기
        
        console.log('Found site data:', { userId, siteEnglishName: data.siteEnglishName });
        
        // sliderImages도 별도로 로드
        let sliderImagesDoc = null;
        try {
          const sliderCollectionRef = collection(db, "sliderImages");
          const sliderQuery = query(sliderCollectionRef, where("__name__", "==", userId));
          const sliderSnapshot = await getDocs(sliderQuery);
          
          if (!sliderSnapshot.empty) {
            const sliderData = sliderSnapshot.docs[0].data();
            sliderImagesDoc = {
              exists: () => true,
              data: () => sliderData
            };
            console.log('Slider images doc exists:', true);
            console.log('Slider images data:', sliderData);
          } else {
            console.log('Slider images doc exists:', false);
          }
        } catch (sliderError) {
          console.error('Failed to load slider images:', sliderError);
          sliderImagesDoc = null;
        }
        
        // processSiteData 함수를 사용하여 데이터 처리
        const processedData = await processSiteData(data, sliderImagesDoc);
        
        console.log('Site data found for URL:', siteName, {
          originalData: data,
          processedData: processedData,
          siteEnglishName: processedData?.siteEnglishName,
          siteTitle: processedData?.siteTitle
        });
        return processedData;
      } else {
        console.log('No site data found for URL:', siteName);
        return null; // 존재하지 않는 사이트는 null 반환
      }
    } catch (error) {
      console.error('Failed to load site data by URL:', error);
      return null; // 오류 시에도 null 반환
    }
  };

  // 기본 데이터 반환 함수
  const getDefaultSiteData = () => {
    return {
      // UI 템플릿 선택
      headerType: "HeaderA",
      sliderType: "BasicHeroCarousel",
      productListType: "ExpandedList",
      productDetailType: "ProductDetail1",
      
      // 사이트 기본 정보
      siteTitle: "나의 쇼핑몰",
      siteEnglishName: "my-shop",
      searchPlaceholder: "상품을 검색해보세요",
      // 로고 표시 방식: 'text' | 'image'
      logoStyle: "text",
      logoUrl: "",
      
      // 팝업 설정
      popup: {
        enabled: false,
        type: "swiper", // "swiper" | "scrolling"
        contents: [
          { id: "popup1", text: "첫 번째 팝업 내용입니다." },
          { id: "popup2", text: "두 번째 팝업 내용입니다." },
          { id: "popup3", text: "세 번째 팝업 내용입니다." }
        ]
      },
      // Auth 필드 설정
      auth: {
        signupFields: ["name", "phone"], // 추가 수집 필드
      },
      
      // 푸터 설정
      footer: {
        // 기본 정보
        mallName: "",
        // 고객센터 정보
        customerPhone: "",
        operatingHours: "",
        holidays: "",
        showNoticeButton: false,
        showInquiryButton: false,
        showCustomerServiceButton: false,
        // 계좌 정보 (새로운 구조)
        accounts: [],
        accountHolder: "",
        // 반품 주소
        returnAddress: "",
        // 회사 정보
        companyName: "",
        representative: "",
        address: "",
        businessNumber: "",
        ecommerceReport: "",
        privacyManager: "",
        // SNS 링크
        instagram: "",
        facebook: "",
        youtube: "",
        kakao: "",
        twitter: "",
        naver: "",
        // SNS 버튼 표시 여부
        showFacebookButton: false,
        showKakaoButton: false,
        showTwitterButton: false,
        showYoutubeButton: false,
        showInstagramButton: false,
        showNaverButton: false
      },
      
      // 카테고리와 상품 데이터
      categories: [
        { id: "cat1", name: "카테고리 A", subcategories: [] },
        { id: "cat2", name: "카테고리 B", subcategories: [] },
      ],
      products: [
        { id: "p1", name: "상품 1", price: 10000, categoryId: "cat1", image: "/image/parcel.png", reviewCount: 335 },
        { id: "p2", name: "상품 2", price: 20000, categoryId: "cat2", image: "/image/parcel.png", reviewCount: 128 },
      ],
      
      // 상품 뱃지 설정
      productBadges: [
        { id: "badge1", name: "BEST", color: "#e74c3c", isDefault: true },
        { id: "badge2", name: "자체제작", color: "#000000", isDefault: true },
        { id: "badge3", name: "NEW", color: "#000000", isDefault: true }
      ],
    };
  };

  // 사이트 전체 설정을 관리하는 통합 상태
  const [siteData, setSiteData] = useState(() => {
    const defaultData = getDefaultSiteData();
    // sliderImages를 별도로 추가
    defaultData.sliderImages = {
      BasicHeroCarousel: [
        { id: 1, img: "/images/kv1.jpg", alt: "슬라이드 1" },
        { id: 2, img: "/images/kv2.jpg", alt: "슬라이드 2" },
        { id: 3, img: "/images/kv3.png", alt: "슬라이드 3" }
      ],
      FadeHeroBanner: [
        { id: 1, img: "/images/kv1.jpg", alt: "슬라이드 1" },
        { id: 2, img: "/images/kv2.jpg", alt: "슬라이드 2" },
        { id: 3, img: "/images/kv3.png", alt: "슬라이드 3" }
      ],
      NumberedProgressSlider: [
        { id: 1, img: "/images/banner1.png", alt: "배너 1" },
        { id: 2, img: "/images/banner2.png", alt: "배너 2" },
        { id: 3, img: "/images/banner3.png", alt: "배너 3" }
      ]
    };
    return defaultData;
  });
  const [isLoading, setIsLoading] = useState(true);

  // 검색 상태
  const [searchQuery, setSearchQuery] = useState("");
  
  // 찜한 상품 상태
  const [likedProducts, setLikedProducts] = useState(new Set(JSON.parse(localStorage.getItem('likedProducts') || '[]')));

  // 인증 상태 (Firebase 기반) - 먼저 선언
  const [currentUser, setCurrentUser] = useState(null);
  
  // 카카오 로그인 진행 상태
  const [isKakaoLoggingIn, setIsKakaoLoggingIn] = useState(false);

  // 🔹 Firebase에서 사용자별 데이터 로드
  useEffect(() => {
    const loadUserData = async () => {
      const currentPath = window.location.pathname;
      const isUserWebsite = currentPath.startsWith('/site/');
      
      console.log('🔍 loadUserData called:', {
        currentPath,
        isUserWebsite,
        siteName,
        currentUser: currentUser?.uid
      });
      
      if (currentUser) {
        console.log('Loading site data for user:', currentUser.uid, 'siteName:', siteName);
        setIsLoading(true);
        
        try {
          // 좋아요 데이터 로드
          const likesQuery = query(collection(db, 'likes'), where('userId', '==', currentUser.uid));
          const likesSnapshot = await getDocs(likesQuery);
          const likedProductIds = [];
          likesSnapshot.forEach((doc) => {
            likedProductIds.push(doc.data().productId);
          });
          setLikedProducts(new Set(likedProductIds));
          
          if (isUserWebsite && siteName) {
            // 사이트별 웹사이트: 무조건 URL의 siteName에 해당하는 사이트 데이터를 로드
            console.log('🔍 Loading site data by URL for logged-in user:', siteName);
            const siteData = await loadSiteDataByUrl(siteName);
            console.log('🔍 loadSiteDataByUrl result:', siteData);
            
            if (siteData) {
              setSiteData(siteData);
              console.log('✅ Site data loaded for website:', siteName, {
                siteEnglishName: siteData.siteEnglishName,
                siteTitle: siteData.siteTitle
              });
            } else {
              // 존재하지 않는 사이트
              console.log('❌ No site data found for site:', siteName);
              const userConfirmed = window.confirm(
                '잘못된 링크입니다. ShopFrame 서비스를 이용해보시겠습니까?'
              );
              if (userConfirmed) {
                window.location.href = '/';
              }
            }
          } else {
            // 관리자 영역: 로그인한 사용자의 데이터 로드
            const userData = await loadSiteData(currentUser.uid);
            if (userData) {
              setSiteData(userData);
              console.log('SiteData loaded from Firebase for user:', currentUser.uid, userData);
            } else {
              // 관리자 영역에서 데이터가 없는 경우
              const defaultData = getDefaultSiteData();
              setSiteData(defaultData);
              console.log('No data in Firebase, using default data:', defaultData);
            }
          }
        } catch (error) {
          console.error('Failed to load user data from Firebase:', error);
          if (isUserWebsite && siteName) {
            // 사이트별 웹사이트에서 오류 발생
            const userConfirmed = window.confirm(
              '사이트를 불러올 수 없습니다. ShopFrame 서비스를 이용해보시겠습니까?'
            );
            if (userConfirmed) {
              window.location.href = '/';
            }
          } else {
            // 관리자 영역에서 오류 발생
            const defaultData = getDefaultSiteData();
            setSiteData(defaultData);
            console.log('Error occurred, using default data:', defaultData);
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        // 로그인하지 않은 상태
        if (isUserWebsite && siteName) {
          // 사용자 웹사이트에서 로그인하지 않은 상태 - 사이트별 데이터 로드
          setIsLoading(true);
          try {
            const siteData = await loadSiteDataByUrl(siteName);
            if (siteData) {
              setSiteData(siteData);
              console.log('Loading site data for user website:', siteName, siteData);
            } else {
              // 존재하지 않는 사이트
              const userConfirmed = window.confirm(
                '잘못된 링크입니다. ShopFrame 서비스를 이용해보시겠습니까?'
              );
              if (userConfirmed) {
                window.location.href = '/';
              }
            }
          } catch (error) {
            console.error('Failed to load site data for user website:', error);
            const userConfirmed = window.confirm(
              '잘못된 링크입니다. ShopFrame 서비스를 이용해보시겠습니까?'
            );
            if (userConfirmed) {
              window.location.href = '/';
            }
          } finally {
            setIsLoading(false);
          }
        } else {
          // 관리자 페이지에서 로그아웃한 경우에만 데이터 리셋
          setSiteData(getDefaultSiteData());
          setIsLoading(false);
        }
      }
    };

    loadUserData();
  }, [currentUser, siteName]);

  // 🔹 사이트 이름 변경 감지 및 이전 데이터 삭제
  useEffect(() => {
    const handleSiteNameChange = async () => {
      if (currentUser && siteData.siteEnglishName) {
        // 이전 사이트 이름과 현재 사이트 이름 비교
        const previousSiteName = localStorage.getItem(`previousSiteName_${currentUser.uid}`);
        const currentSiteName = siteData.siteEnglishName;
        
        if (previousSiteName && previousSiteName !== currentSiteName) {
          console.log(`사이트 이름이 변경됨: ${previousSiteName} → ${currentSiteName}`);
          
          // 이전 사이트 데이터 삭제 (선택적)
          try {
            // 이전 사이트와 관련된 데이터 정리
            console.log(`이전 사이트 데이터 정리: ${previousSiteName}`);
            // 필요시 Firebase에서 이전 사이트 데이터 삭제 로직 추가
          } catch (error) {
            console.error('이전 사이트 데이터 삭제 실패:', error);
          }
        }
        
        // 현재 사이트 이름 저장
        localStorage.setItem(`previousSiteName_${currentUser.uid}`, currentSiteName);
      }
    };

    handleSiteNameChange();
  }, [siteData.siteEnglishName, currentUser]);

  // 🔹 수동 저장 함수 (자세한 오류 메시지 반환)
  const saveToFirebase = async () => {
    // 저장 전 유효성 검사로 정확한 필드 이슈 리포트
    const validate = () => {
      const isValidImageRef = (value) => {
        if (!value || !String(value).trim()) return false;
        const v = String(value).trim();
        const isHttp = /^https?:\/\//.test(v);
        const isData = /^data:image\/(png|jpeg|jpg);base64,/.test(v);
        const isRelative = /^(\/|\.\/|\.\.\/)/.test(v) || /^images\//.test(v) || /^\/images\//.test(v);
        return isHttp || isData || isRelative;
      };
      const issues = [];
      // 기본 필드
      if (!siteData.siteTitle || !String(siteData.siteTitle).trim()) {
        issues.push('siteTitle: 사이트 이름을 입력하세요.');
      }
      if (!['text', 'image'].includes(siteData.logoStyle)) {
        issues.push(`logoStyle: 'text' 또는 'image' 중 하나여야 합니다 (현재: ${siteData.logoStyle}).`);
      }
      if ((siteData.logoStyle === 'image')) {
        if (!siteData.logoUrl || !String(siteData.logoUrl).trim()) {
          issues.push('logoUrl: 로고 표시 방식이 이미지이므로 로고 이미지를 업로드하세요.');
        } else if (!isValidImageRef(siteData.logoUrl)) {
          issues.push('logoUrl: 올바른 이미지 경로/URL(Data URL, http, 또는 /images/상대경로)인지 확인하세요.');
        }
      }

      // 카테고리
      if (!Array.isArray(siteData.categories)) {
        issues.push('categories: 배열이어야 합니다.');
      } else {
        siteData.categories.forEach((cat, idx) => {
          if (!cat || typeof cat !== 'object') {
            issues.push(`categories[${idx}]: 객체가 아닙니다.`);
            return;
          }
          if (!cat.id) issues.push(`categories[${idx}].id: 누락됨.`);
          if (!cat.name || !String(cat.name).trim()) issues.push(`categories[${idx}].name: 누락됨.`);
          if (cat.subcategories && !Array.isArray(cat.subcategories)) {
            issues.push(`categories[${idx}].subcategories: 배열이어야 합니다.`);
          }
        });
      }

      // 상품
      if (!Array.isArray(siteData.products)) {
        issues.push('products: 배열이어야 합니다.');
      } else {
        siteData.products.forEach((p, idx) => {
          if (!p || typeof p !== 'object') {
            issues.push(`products[${idx}]: 객체가 아닙니다.`);
            return;
          }
          if (!p.id) issues.push(`products[${idx}].id: 누락됨.`);
          if (!p.name || !String(p.name).trim()) issues.push(`products[${idx}].name: 누락됨.`);
          if (typeof p.price !== 'number' || Number.isNaN(p.price)) {
            issues.push(`products[${idx}].price: 숫자여야 합니다 (현재: ${p.price}).`);
          }
          if (!p.categoryId) issues.push(`products[${idx}].categoryId: 누락됨.`);
        });
      }

      // 슬라이더 이미지(선택된 타입만 검증)
      const currentSlider = siteData.sliderType;
      const sliderImages = siteData.sliderImages && siteData.sliderImages[currentSlider];
      if (!Array.isArray(sliderImages) || sliderImages.length === 0) {
        issues.push(`sliderImages.${currentSlider}: 최소 1장의 이미지를 추가하세요.`);
      } else {
        sliderImages.forEach((img, idx) => {
          if (!img || typeof img !== 'object') {
            issues.push(`sliderImages.${currentSlider}[${idx}]: 객체가 아닙니다.`);
            return;
          }
          if (!img.img || !String(img.img).trim()) {
            issues.push(`sliderImages.${currentSlider}[${idx}].img: 이미지가 누락되었습니다.`);
          } else if (!isValidImageRef(img.img)) {
            issues.push(`sliderImages.${currentSlider}[${idx}].img: 올바른 이미지 경로/URL이 아닙니다. (/images 또는 http(s) 또는 Data URL)`);
          }
          // alt는 선택이지만, 비어있으면 경고성 메시지
          if (!img.alt || !String(img.alt).trim()) {
            issues.push(`sliderImages.${currentSlider}[${idx}].alt: 접근성을 위해 대체 텍스트를 입력하세요.`);
          }
        });
      }

      return issues;
    };

    const issues = validate();
    if (issues.length > 0) {
      return {
        success: false,
        message: `저장할 수 없습니다. 아래 항목을 확인하세요.\n- ${issues.join('\n- ')}`
      };
    }

    if (!currentUser) {
      console.error('No user logged in');
      return {
        success: false,
        message: '로그인이 필요합니다. 관리자 계정으로 로그인한 뒤 다시 저장하세요.'
      };
    }
    
    try {
      // sliderImages를 별도로 처리하여 Firestore 제한을 피함
      const { sliderImages, ...restSiteData } = siteData;
      const safeSiteData = sanitizeForFirestore(restSiteData);
      
      // sliderImages를 별도 컬렉션에 저장 (정규화/정제 후)
      if (sliderImages) {
        const normalizeForSave = (obj) => {
          const pick = (o) => ({
            id: o.id ?? undefined,
            img: typeof o.img === 'string' ? o.img : undefined,
            alt: typeof o.alt === 'string' ? o.alt : undefined,
            navText: typeof o.navText === 'string' ? o.navText : undefined,
            link: typeof o.link === 'string' ? o.link : undefined,
            categoryId: o.categoryId ?? undefined,
          });
          const mapArr = (arr) => Array.isArray(arr) ? arr.map(pick).filter(it => !!it.img) : [];
          const out = {};
          Object.keys(obj).forEach((key) => {
            out[key] = mapArr(obj[key]);
          });
          return sanitizeForFirestore(out);
        };
        const safeSliderImages = normalizeForSave(sliderImages);
        await setDoc(doc(db, "sliderImages", currentUser.uid), safeSliderImages, { merge: true });
      }
      
      await setDoc(doc(db, "siteData", currentUser.uid), safeSiteData, { merge: true });
      console.log('Data saved to Firebase successfully');
      return { success: true };
    } catch (error) {
      console.error('Failed to save data to Firebase:', error);
      // 친절한 가이드 메시지 생성
      let hint = '네트워크 상태를 확인하고 잠시 후 다시 시도하세요.';
      const raw = (error && (error.code || error.message || String(error))) || '';
      if (raw.includes('permission') || raw.includes('Permission')) {
        hint = '권한 오류입니다. Firestore 보안 규칙과 로그인 상태를 확인하세요.';
      } else if (raw.includes('deadline') || raw.includes('unavailable')) {
        hint = '일시적인 서버 오류입니다. 잠시 후 다시 시도하세요.';
      } else if (raw.includes('ResourceExhausted') || raw.includes('quota')) {
        hint = '쿼터 또는 용량 한도를 초과했습니다. 데이터 크기를 줄이거나 잠시 후 재시도하세요.';
      } else if (raw.includes('FAILED_PRECONDITION') || raw.includes('invalid-argument')) {
        hint = '저장 형식이 올바른지 확인하세요. (필수 필드 누락/데이터 타입 점검)';
      }
      return {
        success: false,
        message: `${raw || '저장 중 알 수 없는 오류가 발생했습니다.'}\n해결 방법: ${hint}`
      };
    }
  };

  // 🔹 슬라이더 이미지 관리 함수들
  const addSliderImage = (sliderType, imageData) => {
    const newImage = {
      id: Date.now(), // 간단한 ID 생성
      img: imageData.img,
      alt: imageData.alt || `슬라이드 ${(siteData.sliderImages?.[sliderType]?.length || 0) + 1}`
    };
    
    setSiteData(prev => ({
      ...prev,
      sliderImages: {
        ...prev.sliderImages,
        [sliderType]: [...(prev.sliderImages?.[sliderType] || []), newImage]
      }
    }));
  };

  const removeSliderImage = (sliderType, imageId) => {
    setSiteData(prev => ({
      ...prev,
      sliderImages: {
        ...prev.sliderImages,
        [sliderType]: (prev.sliderImages?.[sliderType] || []).filter(img => img.id !== imageId)
      }
    }));
  };

  const updateSliderImage = (sliderType, imageId, updatedData) => {
    setSiteData(prev => ({
      ...prev,
      sliderImages: {
        ...prev.sliderImages,
        [sliderType]: (prev.sliderImages?.[sliderType] || []).map(img => 
          img.id === imageId ? { ...img, ...updatedData } : img
        )
      }
    }));
  };

  const reorderSliderImages = (sliderType, dragIndex, dropIndex) => {
    setSiteData(prev => {
      const currentImages = prev.sliderImages?.[sliderType] || [];
      const newImages = [...currentImages];
      const draggedItem = newImages.splice(dragIndex, 1)[0];
      newImages.splice(dropIndex, 0, draggedItem);
      
      return {
        ...prev,
        sliderImages: {
          ...prev.sliderImages,
          [sliderType]: newImages
        }
      };
    });
  };

  // 카카오 사용자 상태 확인 함수
  const checkKakaoUserStatus = () => {
    const kakaoUserStr = localStorage.getItem('kakaoUser');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (kakaoUserStr && isLoggedIn === 'true') {
      try {
        const kakaoUser = JSON.parse(kakaoUserStr);
        return {
          uid: kakaoUser.uid,
          displayName: kakaoUser.displayName,
          email: kakaoUser.email,
          photoURL: kakaoUser.photoURL,
          provider: 'kakao'
        };
      } catch (error) {
        console.error('카카오 사용자 정보 파싱 실패:', error);
        localStorage.removeItem('kakaoUser');
        localStorage.removeItem('isLoggedIn');
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      // Firebase 사용자 또는 카카오 로그인 사용자 확인
      let finalUser = user;
      
      if (!user) {
        // Firebase 사용자가 없으면 카카오 로그인 사용자 확인
        const kakaoUser = checkKakaoUserStatus();
        if (kakaoUser) {
          finalUser = kakaoUser;
          console.log('카카오 로그인 사용자 인식:', finalUser);
        }
      }
      
      setCurrentUser(finalUser);
      
      // 로그인 시 localStorage 장바구니를 Firebase로 마이그레이션
      if (finalUser) {
        const currentPath = window.location.pathname;
        const isUserWebsite = currentPath.startsWith('/site/');
        const siteName = isUserWebsite ? currentPath.split('/')[2] : null;
        
        if (siteName && finalUser.provider !== 'kakao') {
          // Firebase 사용자만 장바구니 마이그레이션
          await migrateCartToFirebase(siteName, finalUser.uid);
        }
      }
    });

    // 카카오 사용자 상태 변경 감지를 위한 storage 이벤트 리스너
    const handleStorageChange = (e) => {
      if (e.key === 'kakaoUser' || e.key === 'isLoggedIn') {
        console.log('카카오 사용자 상태 변경 감지:', e.key);
        const kakaoUser = checkKakaoUserStatus();
        setCurrentUser(kakaoUser);
      }
    };

    // 카카오 로그인 진행 상태 초기화
    const initializeKakaoLoginState = () => {
      const kakaoLoggingIn = localStorage.getItem('kakaoLoggingIn');
      if (kakaoLoggingIn === 'true') {
        setIsKakaoLoggingIn(true);
      }
    };

    // 초기화 실행
    initializeKakaoLoginState();

    // storage 이벤트 리스너 등록
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsub();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 사이트 데이터 업데이트
  const updateSiteData = (updates) => {
    console.log('updateSiteData called with:', updates);
    setSiteData(prev => {
      // 중첩된 객체를 올바르게 병합
      const newData = { ...prev };
      Object.keys(updates).forEach(key => {
        if (typeof updates[key] === 'object' && updates[key] !== null && !Array.isArray(updates[key])) {
          newData[key] = { ...newData[key], ...updates[key] };
        } else {
          newData[key] = updates[key];
        }
      });
      console.log('New siteData:', newData);
      return newData;
    });
  };

  // 카테고리 추가
  const addCategory = (name) => {
    const newCat = { id: Date.now().toString(), name, subcategories: [] };
    
    setSiteData(prev => {
      const newData = {
        ...prev,
        categories: [...prev.categories, newCat]
      };
      return newData;
    });
  };

  // 서브카테고리 추가
  const addSubcategory = (categoryId, subcategoryName) => {
    setSiteData(prev => {
      const newData = {
        ...prev,
        categories: prev.categories.map(cat => 
          cat.id === categoryId 
            ? { ...cat, subcategories: [...cat.subcategories, { id: Date.now().toString(), name: subcategoryName }] }
            : cat
        )
      };
      return newData;
    });
  };

  // 서브카테고리 수정
  const updateSubcategory = (categoryId, subcategoryId, newName) => {
    setSiteData(prev => {
      const newData = {
        ...prev,
        categories: prev.categories.map(cat => 
          cat.id === categoryId 
            ? { 
                ...cat, 
                subcategories: cat.subcategories.map(sub => 
                  sub.id === subcategoryId ? { ...sub, name: newName } : sub
                )
              }
            : cat
        )
      };
      return newData;
    });
  };

  // 서브카테고리 삭제
  const deleteSubcategory = (categoryId, subcategoryId) => {
    setSiteData(prev => {
      const newData = {
        ...prev,
        categories: prev.categories.map(cat => 
          cat.id === categoryId 
            ? { ...cat, subcategories: cat.subcategories.filter(sub => sub.id !== subcategoryId) }
            : cat
        )
      };
      return newData;
    });
  };

  // 카테고리 수정
  const updateCategory = (id, newName) => {
    setSiteData(prev => {
      const newData = {
        ...prev,
        categories: prev.categories.map(cat => 
          cat.id === id ? { ...cat, name: newName } : cat
        )
      };
      return newData;
    });
  };

  // 카테고리 삭제
  const deleteCategory = (id) => {
    setSiteData(prev => {
      const newData = {
        ...prev,
        categories: prev.categories.filter(cat => cat.id !== id),
        products: prev.products.filter(prod => prod.categoryId !== id)
      };
      return newData;
    });
  };

  // 상품 추가
  const addProduct = (product) => {
    const newProd = { 
      id: Date.now().toString(), 
      ...product,
      image: product.image || "/image/parcel.png"
    };
    
    setSiteData(prev => {
      const newData = {
        ...prev,
        products: [...prev.products, newProd]
      };
      return newData;
    });
  };

  // 상품 수정
  const updateProduct = (id, updates) => {
    setSiteData(prev => {
      const newData = {
        ...prev,
        products: prev.products.map(prod => 
          prod.id === id ? { ...prod, ...updates } : prod
        )
      };
      return newData;
    });
  };

  // 상품 삭제
  const deleteProduct = (id) => {
    setSiteData(prev => {
      const newData = {
        ...prev,
        products: prev.products.filter(prod => prod.id !== id)
      };
      return newData;
    });
  };

  // 뱃지 추가
  const addBadge = (badge) => {
    setSiteData(prev => {
      const newData = {
        ...prev,
        productBadges: [...prev.productBadges, { ...badge, id: Date.now().toString() }]
      };
      return newData;
    });
  };

  // 뱃지 수정
  const updateBadge = (id, updates) => {
    setSiteData(prev => {
      const newData = {
        ...prev,
        productBadges: prev.productBadges.map(badge => 
          badge.id === id ? { ...badge, ...updates } : badge
        )
      };
      return newData;
    });
  };

  // 뱃지 삭제
  const deleteBadge = (id) => {
    setSiteData(prev => {
      const newData = {
        ...prev,
        productBadges: prev.productBadges.filter(badge => badge.id !== id)
      };
      return newData;
    });
  };


  // 찜하기 토글
  const toggleLike = async (productId) => {
    if (!currentUser) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }

    try {
      const likesQuery = query(collection(db, 'likes'), 
        where('userId', '==', currentUser.uid), 
        where('productId', '==', productId)
      );
      const querySnapshot = await getDocs(likesQuery);
      
      if (querySnapshot.empty) {
        // 좋아요 추가
        await addDoc(collection(db, 'likes'), {
          userId: currentUser.uid,
          productId: productId,
          createdAt: new Date()
        });
      } else {
        // 좋아요 제거
        const likeDoc = querySnapshot.docs[0];
        await deleteDoc(doc(db, 'likes', likeDoc.id));
      }
      
      // 로컬 상태도 업데이트
      const currentLiked = Array.from(likedProducts);
      const isLiked = currentLiked.includes(productId);
      
      let updatedLiked;
      if (isLiked) {
        updatedLiked = currentLiked.filter(id => id !== productId);
      } else {
        updatedLiked = [...currentLiked, productId];
      }
      
      setLikedProducts(new Set(updatedLiked));
      
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
      alert('좋아요 처리에 실패했습니다.');
    }
  };


  // 후기 추가
  const addReview = (productId, review) => {
    const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    const newReview = {
      id: Date.now().toString(),
      productId,
      ...review,
      createdAt: new Date().toISOString()
    };
    reviews.push(newReview);
    localStorage.setItem('reviews', JSON.stringify(reviews));
  };

  // 상품별 후기 가져오기
  const getProductReviews = (productId) => {
    const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    return reviews.filter(review => review.productId === productId);
  };

  // 후기 평점 계산
  const getProductRating = (productId) => {
    const reviews = getProductReviews(productId);
    if (reviews.length === 0) return { average: 0, count: 0 };
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const average = totalRating / reviews.length;
    
    return {
      average: Math.round(average * 10) / 10,
      count: reviews.length
    };
  };

  // 후기 삭제
  const deleteReview = (reviewId) => {
    const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    const updatedReviews = reviews.filter(review => review.id !== reviewId);
    localStorage.setItem('reviews', JSON.stringify(updatedReviews));
  };

  // 인증 API (Firebase 기반)
  const signUpWithEmail = async (email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  const signInWithEmail = async (email, password, siteName = null) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    
    // 사이트별 웹사이트에서 로그인한 경우 해당 사이트 데이터 확인
    if (siteName) {
      // 현재 로그인한 사용자의 관리자 데이터에서 사이트 정보 확인
      const adminData = await loadSiteData(cred.user.uid, siteName);
      if (!adminData || adminData.siteEnglishName !== siteName) {
        await signOut(auth);
        throw new Error("해당 사이트에 접근 권한이 없습니다.");
      }
    }
    
    return cred.user;
  };

  const signOutUser = async () => {
    // 카카오 로그인 사용자인 경우 로컬 스토리지 정리
    if (currentUser && currentUser.provider === 'kakao') {
      localStorage.removeItem('kakaoUser');
      localStorage.removeItem('isLoggedIn');
      // 카카오 사용자 상태 즉시 업데이트
      setCurrentUser(null);
      console.log('카카오 로그인 사용자 로그아웃');
    } else {
      // Firebase 사용자인 경우
      await signOut(auth);
    }
  };

  // 사이트별 장바구니 관리 함수들
  const addToCart = async (product, quantity = 1, options = {}) => {
    const currentPath = window.location.pathname;
    const isUserWebsite = currentPath.startsWith('/site/');
    const siteName = isUserWebsite ? currentPath.split('/')[2] : null;

    if (!siteName) {
      alert('사이트 정보를 찾을 수 없습니다.');
      return;
    }

    if (currentUser) {
      // 로그인한 사용자: Firebase에 저장
      try {
        await addToSiteCart(siteName, currentUser.uid, product, quantity, options);
        console.log('상품이 장바구니에 추가되었습니다.');
      } catch (error) {
        console.error('장바구니 추가 실패:', error);
        alert('장바구니 추가에 실패했습니다.');
      }
    } else {
      // 로그인하지 않은 사용자: localStorage에 저장
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

      const existingCart = JSON.parse(localStorage.getItem(`cart_${siteName}`) || '[]');
      const existingItemIndex = existingCart.findIndex(item => 
        item.id === cartItem.id && 
        JSON.stringify(item.options) === JSON.stringify(cartItem.options)
      );

      let updatedItems;
      if (existingItemIndex > -1) {
        updatedItems = [...existingCart];
        updatedItems[existingItemIndex].quantity += quantity;
      } else {
        updatedItems = [...existingCart, cartItem];
      }
      
      localStorage.setItem(`cart_${siteName}`, JSON.stringify(updatedItems));
      console.log('상품이 임시 장바구니에 추가되었습니다.');
    }
  };

  const getCartItems = async () => {
    const currentPath = window.location.pathname;
    const isUserWebsite = currentPath.startsWith('/site/');
    const siteName = isUserWebsite ? currentPath.split('/')[2] : null;

    if (!siteName) {
      return [];
    }

    if (currentUser) {
      // 로그인한 사용자: Firebase에서 조회
      try {
        return await getSiteCart(siteName, currentUser.uid);
      } catch (error) {
        console.error('장바구니 조회 실패:', error);
        return [];
      }
    } else {
      // 로그인하지 않은 사용자: localStorage에서 조회
      const savedCart = localStorage.getItem(`cart_${siteName}`);
      return savedCart ? JSON.parse(savedCart) : [];
    }
  };

  const updateCartQuantity = async (productId, options, newQuantity) => {
    const currentPath = window.location.pathname;
    const isUserWebsite = currentPath.startsWith('/site/');
    const siteName = isUserWebsite ? currentPath.split('/')[2] : null;

    if (!siteName) {
      return;
    }

    if (currentUser) {
      // 로그인한 사용자: Firebase 업데이트
      try {
        await updateSiteCartQuantity(siteName, currentUser.uid, productId, options, newQuantity);
      } catch (error) {
        console.error('장바구니 수량 업데이트 실패:', error);
      }
    } else {
      // 로그인하지 않은 사용자: localStorage 업데이트
      const existingCart = JSON.parse(localStorage.getItem(`cart_${siteName}`) || '[]');
      const updatedItems = existingCart.map(item => {
        const currentItemId = `${item.id}-${JSON.stringify(item.options || {})}`;
        const targetItemId = `${productId}-${JSON.stringify(options || {})}`;
        
        if (currentItemId === targetItemId) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      
      localStorage.setItem(`cart_${siteName}`, JSON.stringify(updatedItems));
    }
  };

  const removeFromCart = async (productId, options) => {
    const currentPath = window.location.pathname;
    const isUserWebsite = currentPath.startsWith('/site/');
    const siteName = isUserWebsite ? currentPath.split('/')[2] : null;

    if (!siteName) {
      return;
    }

    if (currentUser) {
      // 로그인한 사용자: Firebase에서 삭제
      try {
        await removeFromSiteCart(siteName, currentUser.uid, productId, options);
      } catch (error) {
        console.error('장바구니 삭제 실패:', error);
      }
    } else {
      // 로그인하지 않은 사용자: localStorage에서 삭제
      const existingCart = JSON.parse(localStorage.getItem(`cart_${siteName}`) || '[]');
      const updatedItems = existingCart.filter(item => {
        const currentItemId = `${item.id}-${JSON.stringify(item.options || {})}`;
        const targetItemId = `${productId}-${JSON.stringify(options || {})}`;
        
        return currentItemId !== targetItemId;
      });
      
      localStorage.setItem(`cart_${siteName}`, JSON.stringify(updatedItems));
    }
  };

  const clearCart = async () => {
    const currentPath = window.location.pathname;
    const isUserWebsite = currentPath.startsWith('/site/');
    const siteName = isUserWebsite ? currentPath.split('/')[2] : null;

    if (!siteName) {
      return;
    }

    if (currentUser) {
      // 로그인한 사용자: Firebase에서 비우기
      try {
        await clearSiteCart(siteName, currentUser.uid);
      } catch (error) {
        console.error('장바구니 비우기 실패:', error);
      }
    } else {
      // 로그인하지 않은 사용자: localStorage에서 비우기
      localStorage.setItem(`cart_${siteName}`, JSON.stringify([]));
    }
  };

  const getCartItemCount = async () => {
    const currentPath = window.location.pathname;
    const isUserWebsite = currentPath.startsWith('/site/');
    const siteName = isUserWebsite ? currentPath.split('/')[2] : null;

    if (!siteName) {
      return 0;
    }

    if (currentUser) {
      // 로그인한 사용자: Firebase에서 조회
      try {
        return await getSiteCartItemCount(siteName, currentUser.uid);
      } catch (error) {
        console.error('장바구니 개수 조회 실패:', error);
        return 0;
      }
    } else {
      // 로그인하지 않은 사용자: localStorage에서 조회
      const savedCart = localStorage.getItem(`cart_${siteName}`);
      if (savedCart) {
        const items = JSON.parse(savedCart);
        return items.reduce((sum, item) => sum + item.quantity, 0);
      }
      return 0;
    }
  };

  // 로그인 시 localStorage 장바구니를 Firebase로 마이그레이션
  const migrateCartToFirebase = async (siteName, userId) => {
    try {
      const localCart = localStorage.getItem(`cart_${siteName}`);
      if (localCart) {
        const localItems = JSON.parse(localCart);
        if (localItems.length > 0) {
          // Firebase에 저장
          await saveSiteCart(siteName, userId, localItems);
          console.log('로컬 장바구니가 Firebase로 마이그레이션되었습니다.');
          
          // localStorage에서 제거
          localStorage.removeItem(`cart_${siteName}`);
        }
      }
    } catch (error) {
      console.error('장바구니 마이그레이션 실패:', error);
    }
  };

  // 사용자 인증 관련 함수들 (사이트 사용자용)
  const signUpSiteUser = async (email, password, additionalFields = {}) => {
    // 사용자 데이터를 별도 컬렉션에 저장
    const userData = {
      email,
      additionalFields,
      createdAt: new Date().toISOString(),
      isSiteUser: true // 관리자와 구분하기 위한 플래그
    };
    
    // Firebase Auth로 사용자 생성
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    
    // 사용자 데이터를 siteUsers 컬렉션에 저장
    await setDoc(doc(db, "siteUsers", cred.user.uid), userData);
    
    return cred.user;
  };

  const signInSiteUser = async (email, password, siteName = null) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    
    // 사용자가 관리자인지 확인
    const userDoc = await getDoc(doc(db, "siteUsers", cred.user.uid));
    if (userDoc.exists() && userDoc.data().isSiteUser) {
      // 사이트별 웹사이트에서 로그인한 경우 해당 사이트 데이터 확인
      if (siteName) {
        // 현재 로그인한 사용자의 관리자 데이터에서 사이트 정보 확인
        const adminData = await loadSiteData(cred.user.uid, siteName);
        if (!adminData || adminData.siteEnglishName !== siteName) {
          await signOut(auth);
          throw new Error("해당 사이트에 접근 권한이 없습니다.");
        }
      }
      return cred.user;
    } else {
      // 관리자 계정으로 로그인 시도한 경우
      await signOut(auth);
      throw new Error("관리자 계정입니다. 관리자 로그인을 사용해주세요.");
    }
  };

  return (
    <SiteContext.Provider
      value={{ 
        siteData, 
        updateSiteData,
        categories: siteData.categories,
        products: siteData.products,
        // UI 템플릿
        headerType: siteData.headerType,
        sliderType: siteData.sliderType,
        productListType: siteData.productListType,
        productDetailType: siteData.productDetailType,
        // 사이트 정보
        siteTitle: siteData.siteTitle,
        siteEnglishName: siteData.siteEnglishName,
        searchPlaceholder: siteData.searchPlaceholder,
        logoUrl: siteData.logoUrl,
        // 팝업 설정
        popup: siteData.popup,
        // 검색
        searchQuery,
        setSearchQuery,
        // 인증
        currentUser,
        signUpWithEmail,
        signInWithEmail,
        signOutUser,
        // 사용자 인증
        signUpSiteUser,
        signInSiteUser,
        // 사이트별 장바구니 관리
        addToCart,
        getCartItems,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        getCartItemCount,
        // 카테고리 관리
        addCategory,
        updateCategory,
        deleteCategory,
        addSubcategory,
        updateSubcategory,
        deleteSubcategory,
        // 상품 관리
        addProduct,
        updateProduct,
        deleteProduct,
        // 뱃지 관리
        productBadges: siteData.productBadges || [],
        addBadge,
        updateBadge,
        deleteBadge,
        // 찜하기
        toggleLike,
        likedProducts,
        // 후기 관리
        addReview,
        getProductReviews,
        getProductRating,
        deleteReview,
        // 저장 함수
        saveToFirebase,
        // 슬라이더 이미지 관리
        addSliderImage,
        removeSliderImage,
        updateSliderImage,
        reorderSliderImages,
        // 로딩 상태
        isLoading,
        // 카카오 로그인 상태
        isKakaoLoggingIn,
        setIsKakaoLoggingIn
      }}
    >
      {children}
    </SiteContext.Provider>
  );
};
