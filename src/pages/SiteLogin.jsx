import React, { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SiteContext } from "../context/SiteContext";
import UserCheck from "./UserCheck";

// 헤더 컴포넌트들
import MegaMenu from "../components/MegaMenu";
import DropdownMenu from "../components/DropdownMenu";
import MobileHeader from "../components/MobileHeader";
import Footer from "../components/Footer";
import "../components/HeaderResponsive.scss";

const SiteLogin = () => {
  const { currentUser, siteData } = useContext(SiteContext);
  const navigate = useNavigate();
  const location = useLocation();

  // 현재 경로에서 siteName 추출
  const isSiteRoute = location.pathname.startsWith('/site/');
  const siteName = isSiteRoute ? location.pathname.split('/')[2] : null;

  if (currentUser) {
    // 로그인된 사용자가 접근했을 때 적절한 페이지로 리다이렉트
    if (siteName) {
      navigate(`/site/${siteName}`);
    } else {
      navigate("/preview");
    }
    return null;
  }

  // 헤더 렌더링 함수
  const renderHeader = () => {
    const headerProps = {
      title: siteData.siteTitle || "",
      placeholder: siteData.searchPlaceholder || "상품을 검색해보세요",
      categories: siteData.categories || [],
      logoUrl: siteData.logoUrl || "",
      logoStyle: siteData.logoStyle || 'text',
      logoTextSize: siteData.logoTextSize,
      logoTextColor: siteData.logoTextColor,
      logoTextFont: siteData.logoTextFont,
      cartItemCount: 0,
      currentUser,
      onLoginClick: () => {},
      onSignupClick: () => {},
      onLogoutClick: () => {}
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

  const renderTemplate = () => {
    return <UserCheck />;
  };

  return (
    <div className="mobile-padding" style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      {/* 헤더 */}
      {renderHeader()}
      
      {/* 메인 콘텐츠 */}
      <div style={{ 
        minHeight: "60vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        padding: "40px 20px"
      }}>
        {renderTemplate()}
      </div>
      
      {/* 푸터 */}
      <Footer footerData={siteData.footer} />
    </div>
  );
};

export default SiteLogin;


