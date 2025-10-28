import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminHeader.scss';

const AdminHeader = ({ 
  checkAuthAndRedirect, 
  currentUser, 
  siteData, 
  adminProfile, 
  handleRestartTutorial, 
  signOutUser 
}) => {
  const navigate = useNavigate();

  return (
    <nav className="admin-header">
      <div className="admin-header-inner">
        {/* 로고 이미지 */}
        <div className="admin-logo">
          <img 
            src="/icons/shop frame logo-02 1.png" 
            alt="ShopFrame 로고" 
          />
        </div>

        {/* 네비게이션 메뉴들 */}
        <div className="admin-nav">
          <button
            onClick={() => checkAuthAndRedirect(() => navigate('/editor'))}
            data-tutorial="editor-link"
            className="admin-nav-item"
          >
            웹사이트 에디터
          </button>
          
          <div className="admin-nav-separator"></div>
          
          <button
            onClick={() => checkAuthAndRedirect(() => navigate('/products'))}
            data-tutorial="products-link"
            className="admin-nav-item"
          >
            상품 에디터
          </button>

          {/* 로그인 상태일 때만 미리보기 메뉴 표시 */}
          {currentUser && (
            <>
              <div className="admin-nav-separator"></div>
              
              <button
                onClick={() => checkAuthAndRedirect(() => navigate('/preview'))}
                data-tutorial="preview-link"
                className="admin-nav-item"
              >
                미리보기
              </button>
            </>
          )}
        </div>

        {/* 우측 버튼들 */}
        <div className="admin-actions">
          {currentUser ? (
            <>
              <button
                onClick={() => {
                  checkAuthAndRedirect(() => {
                    console.log('Current siteData:', siteData);
                    console.log('siteEnglishName:', siteData?.siteEnglishName);
                    if (!siteData || !siteData.siteEnglishName) {
                      alert(`사이트 정보가 아직 로드되지 않았습니다. siteData: ${JSON.stringify(siteData)}`);
                      return;
                    }
                    const siteName = siteData.siteEnglishName;
                    console.log('Opening site:', `/site/${siteName}`);
                    window.open(`${window.location.origin}/site/${siteName}`, '_blank');
                  });
                }}
                className={`admin-action-btn ${siteData?.siteEnglishName ? 'primary' : 'disabled'}`}
                title={siteData?.siteEnglishName ? "만든 웹사이트 새 탭에서 열기" : "사이트 정보 로딩 중..."}
                disabled={!siteData?.siteEnglishName}
              >
                웹사이트 이동
              </button>
              
              <button
                onClick={handleRestartTutorial}
                className="admin-action-btn tutorial"
                title="튜토리얼 다시보기"
              >
                튜토리얼
              </button>
              
              <div className="admin-user-info">
                <span className="admin-welcome">
                  관리자 {adminProfile?.name || currentUser.displayName || currentUser.email}, 환영합니다.
                </span>
                <button
                  onClick={async () => {
                    await signOutUser();
                    navigate('/');
                  }}
                  className="admin-action-btn logout"
                >
                  로그아웃
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={handleRestartTutorial}
              className="admin-action-btn tutorial"
              title="튜토리얼 다시보기"
            >
              튜토리얼
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AdminHeader;
