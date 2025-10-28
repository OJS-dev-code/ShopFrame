// src/App.js
import React, { useState, useEffect, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { SiteProvider, SiteContext } from "./context/SiteContext";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import AdminHeader from "./components/AdminHeader";
import UserCheck from "./pages/UserCheck";
import Editor from "./pages/Editor";
import ProductEditor from "./pages/ProductEditor";
import Preview from "./pages/Preview";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Mypage from "./pages/Mypage";
import Signup from "./pages/Signup";
import SiteLogin from "./pages/SiteLogin";
import SiteSignup from "./pages/SiteSignup";
import SignupStep1 from "./components/SignupStep1";
import SignupStep2 from "./components/SignupStep2";
import AccountDeletion from "./components/AccountDeletion";
import ProductDetailPage from "./pages/ProductDetailPage";
// import TutorialDialog from "./components/TutorialDialog";
// import Tutorial from "./components/Tutorial";
import VideoTutorial from "./components/VideoTutorial";
import KakaoAuth from "./components/KakaoAuth";
import AdminFooter from "./components/AdminFooter";
import { checkUserPermissions } from "./utils/authManager";

// 404 리다이렉트 컴포넌트
const NotFoundRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    // 메시지 표시
    alert('존재하지 않는 주소이므로 홈으로 다시 이동합니다.');
    
    // /site/ 경로인지 확인
    if (location.pathname.startsWith('/site/')) {
      // /site/sitename 형태로 분리
      const pathParts = location.pathname.split('/');
      if (pathParts.length >= 3) {
        const siteName = pathParts[2];
        navigate(`/site/${siteName}`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } else {
      // 관리자 페이지의 경우 루트로 리다이렉트
      navigate('/', { replace: true });
    }
  }, [location.pathname, navigate]);
  
  return null; // 리다이렉트 중이므로 아무것도 렌더링하지 않음
};

function AppContent() {
  // const [showTutorialDialog, setShowTutorialDialog] = useState(false);
  // const [showTutorial, setShowTutorial] = useState(false);
  const [showVideoTutorial, setShowVideoTutorial] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, signOutUser, siteData } = useContext(SiteContext);
  const [adminProfile, setAdminProfile] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);

  // /site/ 경로인지 확인
  const isSiteRoute = location.pathname.startsWith('/site/');
  
  // 관리자 페이지인지 확인 (사이트 라우트가 아니고, 특정 관리자 페이지들)
  const isAdminPage = !isSiteRoute && (
    location.pathname === '/' || 
    location.pathname === '/editor' || 
    location.pathname === '/products' || 
    location.pathname === '/signup'
  );

  // 사용자 권한 확인
  useEffect(() => {
    const checkPermissions = async () => {
      if (currentUser) {
        const permissions = await checkUserPermissions(currentUser);
        setUserPermissions(permissions);
        
        // 관리자 영역에서 사이트 사용자가 로그인한 경우
        if (!isSiteRoute && permissions.reason === 'not_admin') {
          alert('관리자 권한이 없습니다. 사이트별 웹사이트에서 로그인해주세요.');
          await signOutUser();
          navigate('/');
        }
      } else {
        setUserPermissions(null);
      }
    };

    checkPermissions();
  }, [currentUser, location.pathname, signOutUser, navigate, isSiteRoute]);

  // useEffect(() => {
  //   // 튜토리얼 표시 조건 확인
  //   const skipUntil = localStorage.getItem('tutorialSkipUntil');
  //   const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    
  //   // 사이트 라우트에서는 튜토리얼 표시하지 않음
  //   if (isSiteRoute) {
  //     return;
  //   }
    
  //   // 로그인하지 않은 상태에서는 튜토리얼 표시하지 않음
  //   if (!currentUser) {
  //     return;
  //   }
    
  //   // 관리자가 아닌 경우 튜토리얼 표시하지 않음
  //   if (userPermissions && userPermissions.reason === 'not_admin') {
  //     return;
  //   }
    
  //   if (skipUntil) {
  //     const skipDate = new Date(skipUntil);
  //     if (skipDate > new Date()) {
  //       // 아직 스킵 기간이 남아있음
  //       return;
  //     } else {
  //       // 스킵 기간이 만료됨
  //       localStorage.removeItem('tutorialSkipUntil');
  //     }
  //   }
    
  //   if (!hasSeenTutorial) {
  //     // 처음 방문하는 관리자 사용자
  //     setShowTutorialDialog(true);
  //   }
  // }, [currentUser, userPermissions, isSiteRoute]);

  useEffect(() => {
    // 관리자 프로필 로드 (Firebase Firestore)
    const loadAdminProfile = async () => {
      if (currentUser) {
        try {
          const profileDoc = await getDoc(doc(db, "adminUsers", currentUser.uid));
          if (profileDoc.exists()) {
            setAdminProfile(profileDoc.data());
          } else {
            setAdminProfile(null);
          }
        } catch (error) {
          console.error("프로필 로드 실패:", error);
          setAdminProfile(null);
        }
      } else {
        setAdminProfile(null);
      }
    };

    loadAdminProfile();
  }, [currentUser]);

  // const handleStartTutorial = () => {
  //   setShowTutorialDialog(false);
  //   setShowTutorial(true);
  //   localStorage.setItem('hasSeenTutorial', 'true');
  // };

  // const handleSkipTutorial = () => {
  //   setShowTutorialDialog(false);
  //   localStorage.setItem('hasSeenTutorial', 'true');
  // };

  // const handleSkipTutorialForMonth = () => {
  //   setShowTutorialDialog(false);
  //   localStorage.setItem('hasSeenTutorial', 'true');
    
  //   // 한 달 후 날짜 계산
  //   const skipDate = new Date();
  //   skipDate.setMonth(skipDate.getMonth() + 1);
  //   localStorage.setItem('tutorialSkipUntil', skipDate.toISOString());
  // };

  // const handleTutorialClose = () => {
  //   setShowTutorial(false);
  // };

  // 영상 튜토리얼 함수들
  const handleShowVideoTutorial = () => {
    setShowVideoTutorial(true);
  };

  const handleCloseVideoTutorial = () => {
    setShowVideoTutorial(false);
  };

  // 로그인 체크 함수
  const checkAuthAndRedirect = (callback) => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      navigate('/');
      return;
    }
    callback();
  };

  const handleRestartTutorial = () => {
    checkAuthAndRedirect(() => {
      // 웹사이트 에디터 페이지로 이동
      navigate('/editor');
      // 페이지 이동 후 영상 튜토리얼 시작
      setTimeout(() => {
        setShowVideoTutorial(true);
      }, 100);
    });
  };

  return (
    <>
      {/* /site/ 경로가 아닐 때만 상단 네비게이션 표시 */}
      {!isSiteRoute && (
        <AdminHeader 
          checkAuthAndRedirect={checkAuthAndRedirect}
          currentUser={currentUser}
          siteData={siteData}
          adminProfile={adminProfile}
          handleRestartTutorial={handleRestartTutorial}
          signOutUser={signOutUser}
        />
      )}
      <Routes>
        {/* 테스트용 ProductDetailPage 라우트를 맨 위로 이동 */}
        
        <Route path="/" element={<UserCheck />} />
        
        {/* 관리자 전용 라우트 (로그인 필요) */}
        <Route path="/editor" element={
          currentUser ? <Editor /> : <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            minHeight: 'calc(100vh - 200px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <h2>관리자 로그인이 필요합니다</h2>
            <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>로그인하기</Link>
          </div>
        } />
        <Route path="/products" element={
          currentUser ? <ProductEditor /> : <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            minHeight: 'calc(100vh - 200px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <h2>관리자 로그인이 필요합니다</h2>
            <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>로그인하기</Link>
          </div>
        } />
        <Route path="/preview" element={
          currentUser ? <Preview /> : <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            minHeight: 'calc(100vh - 200px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <h2>관리자 로그인이 필요합니다</h2>
            <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>로그인하기</Link>
          </div>
        } />
        
        {/* 사용자 접근 가능한 라우트 (로그인 불필요) */}
        <Route path="/site/:siteName" element={<Preview />} />
        <Route path="/site/:siteName/category/:categoryId" element={<Preview />} />
        <Route path="/site/:siteName/cart" element={<Cart />} />
        <Route path="/site/:siteName/checkout" element={<Checkout />} />
        <Route path="/site/:siteName/mypage/*" element={<Mypage />} />
        <Route path="/site/:siteName/login" element={<SiteLogin />} />
        <Route path="/site/:siteName/signup" element={<SiteSignup />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/mypage/*" element={<Mypage />} />
        <Route path="/category/:categoryId" element={<Preview />} />
        <Route path="/product/:productId" element={<ProductDetailPage />} />
        <Route path="/site/:siteName/product/:productId" element={<ProductDetailPage />} />
        {/* 관리자 인증 관련 라우트 (관리자 영역에서만 접근 가능) */}
        <Route path="/signup" element={
          !isSiteRoute ? <Signup /> : <div style={{ textAlign: 'center', padding: '50px' }}>
            <h2>잘못된 접근입니다</h2>
            <p>사이트별 웹사이트에서 회원가입해주세요.</p>
          </div>
        } />
        <Route path="/signup/step1" element={<SignupStep1 />} />
        <Route path="/signup/step2" element={<SignupStep2 />} />
        <Route path="/site/:siteName/signup/step1" element={<SignupStep1 />} />
        <Route path="/site/:siteName/signup/step2" element={<SignupStep2 />} />
        <Route path="/account-deletion" element={<AccountDeletion />} />
        <Route path="/site-login" element={<SiteLogin />} />
        <Route path="/site-signup" element={<SiteSignup />} />
        
        {/* 카카오 로그인 콜백 라우트 */}
        <Route path="/auth/kakao/callback" element={<KakaoAuth />} />
        
        {/* Catch-all 라우트 - 존재하지 않는 경로 처리 */}
        <Route path="*" element={<NotFoundRedirect />} />
      </Routes>
      
        {/* 튜토리얼 다이얼로그 - 주석처리 */}
        {/* {showTutorialDialog && (
          <TutorialDialog
            onStart={handleStartTutorial}
            onSkip={handleSkipTutorial}
            onSkipForMonth={handleSkipTutorialForMonth}
          />
        )} */}
        
        {/* 튜토리얼 - 주석처리 */}
        {/* {showTutorial && (
          <Tutorial
            onClose={handleTutorialClose}
          />
        )} */}
        
        {/* 영상 튜토리얼 */}
        {showVideoTutorial && (
          <VideoTutorial
            onClose={handleCloseVideoTutorial}
          />
        )}
        
        {/* 관리자 페이지 푸터 */}
        {isAdminPage && <AdminFooter />}
    </>
  );
}

function App() {
  return (
    <SiteProvider>
      <Router>
        <AppContent />
      </Router>
    </SiteProvider>
  );
}

export default App;