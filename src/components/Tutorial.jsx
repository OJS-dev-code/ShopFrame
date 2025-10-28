import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Tutorial = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  // 튜토리얼 시작 시 웹에디터 페이지로 이동 (제거됨 - 페이지 이동을 방해함)
  // useEffect(() => {
  //   const currentPath = window.location.pathname;
  //   if (currentPath !== '/') {
  //     navigate('/');
  //   }
  // }, [navigate]);

  useEffect(() => {
    // 컴포넌트가 마운트된 후 애니메이션을 위해 약간의 지연
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const steps = [
    {
      title: "웹사이트 빌더에 오신 것을 환영합니다! 🎉",
      content: "이 도구를 사용하여 나만의 쇼핑몰을 쉽게 만들 수 있습니다. 단계별로 주요 기능을 알아보겠습니다.",
      position: "center",
      target: null,
      action: null
    },
    {
      title: "1단계: 웹사이트 에디터 - 사이트 기본 설정",
      content: "사이트 제목, 로고, 검색창 플레이스홀더를 설정하고 헤더와 슬라이더 디자인을 선택할 수 있습니다.",
      position: "top-left",
      target: "site-basic-settings",
      action: null
    },
    {
      title: "2단계: 웹사이트 에디터 - 인증 페이지 설정",
      content: "로그인과 회원가입 페이지의 디자인을 선택하고, 회원가입 시 필요한 추가 정보를 설정할 수 있습니다.",
      position: "top-left",
      target: "auth-settings",
      action: null
    },
    {
      title: "3단계: 웹사이트 에디터 - 카테고리 관리",
      content: "상품을 분류할 카테고리를 추가하고, 각 카테고리 하위에 소분류를 만들 수 있습니다.",
      position: "top-left",
      target: "category-management",
      action: null
    },
    {
      title: "4단계: 상품 관리 - 상품 추가",
      content: "상품명, 가격, 이미지, 설명을 입력하고 할인율이나 할인가를 설정할 수 있습니다.",
      position: "top-left",
      target: "product-basic-info",
      action: "products"
    },
    {
      title: "5단계: 상품 관리 - 상품 옵션 설정",
      content: "색상, 사이즈, 패턴 등 다양한 옵션을 추가하여 고객이 선택할 수 있게 할 수 있습니다.",
      position: "top-left",
      target: "product-options",
      action: "products"
    },
    {
      title: "6단계: 상품 관리 - 저장 옵션",
      content: "상품 데이터를 Firebase, Local Storage, JSON 파일 등 다양한 방식으로 저장할 수 있습니다.",
      position: "top-left",
      target: "storage-options",
      action: "products"
    },
    {
      title: "7단계: 상품 관리 - 상품 수정/삭제",
      content: "추가한 상품은 '상품 관리' 섹션에서 수정하거나 삭제할 수 있습니다. 각 상품의 편집 버튼을 클릭하여 정보를 변경하거나 삭제 버튼으로 제거할 수 있습니다.",
      position: "top-left",
      target: "product-management",
      action: "products"
    },
    {
      title: "8단계: 미리보기 - 결과 확인",
      content: "관리자가 설정한 모든 내용(헤더, 슬라이더, 상품, 카테고리 등)을 미리보기 페이지에서 확인할 수 있습니다.",
      position: "top-left",
      target: "preview-content",
      action: "preview"
    },
    {
      title: "완료! 🎊",
      content: "이제 나만의 쇼핑몰을 자유롭게 꾸며보세요! 언제든지 이 튜토리얼을 다시 볼 수 있습니다.",
      position: "center",
      target: null,
      action: null
    }
  ];

  const currentStepData = steps[currentStep];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const nextStepData = steps[currentStep + 1];
      
      console.log('Next step data:', nextStepData);
      console.log('Current step:', currentStep);
      console.log('Action:', nextStepData.action);
      
      // 페이지 이동이 필요한 경우
      if (nextStepData.action) {
        console.log('Navigating to:', `/${nextStepData.action}`);
        navigate(`/${nextStepData.action}`);
        // 페이지 이동 후 약간의 지연을 두고 다음 단계로
        setTimeout(() => {
          console.log('Setting current step to:', currentStep + 1);
          setCurrentStep(currentStep + 1);
          // 페이지 이동 후 스크롤 처리
          setTimeout(() => {
            const target = document.querySelector(`[data-tutorial="${nextStepData.target}"]`);
            if (target) {
              // 8단계(미리보기)와 9단계(완료)는 페이지 상단으로
              if (currentStep + 1 === 8 || currentStep + 1 === 9) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                // 다른 단계는 타겟 요소 중앙으로
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }, 500);
        }, 800);
      } else {
        console.log('No action, staying on current page');
        setCurrentStep(currentStep + 1);
        // 현재 페이지에서 스크롤 처리
        setTimeout(() => {
          const target = document.querySelector(`[data-tutorial="${nextStepData.target}"]`);
          if (target) {
            // 8단계(미리보기)와 9단계(완료)는 페이지 상단으로
            if (currentStep + 1 === 7 || currentStep + 1 === 8) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              // 다른 단계는 타겟 요소 중앙으로
              target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 200);
      }
    } else {
      // 하이라이트 제거
      const targets = document.querySelectorAll('.tutorial-highlight');
      targets.forEach(el => el.classList.remove('tutorial-highlight'));
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepData = steps[currentStep - 1];
      
      // 이전 단계가 다른 페이지에 있는 경우
      if (prevStepData.action) {
        console.log('Previous step action:', prevStepData.action);
        navigate(`/${prevStepData.action}`);
        setTimeout(() => {
          setCurrentStep(currentStep - 1);
          // 페이지 이동 후 타겟 요소로 스크롤
          setTimeout(() => {
            const target = document.querySelector(`[data-tutorial="${prevStepData.target}"]`);
            if (target) {
              // 8단계(미리보기)와 9단계(완료)는 페이지 상단으로
              if (currentStep - 1 === 7 || currentStep - 1 === 8) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                // 다른 단계는 타겟 요소 중앙으로
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }, 500);
        }, 800);
      } else if (prevStepData.action === null) {
        // 웹사이트 에디터로 이동하는 경우
        console.log('Navigating to website editor');
        navigate('/');
        setTimeout(() => {
          setCurrentStep(currentStep - 1);
          // 웹사이트 에디터는 로딩 시간이 더 필요하므로 긴 지연
          setTimeout(() => {
            const target = document.querySelector(`[data-tutorial="${prevStepData.target}"]`);
            if (target) {
              // 8단계(미리보기)와 9단계(완료)는 페이지 상단으로
              if (currentStep - 1 === 7 || currentStep - 1 === 8) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                // 다른 단계는 타겟 요소 중앙으로
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }, 1000);
        }, 800);
      } else {
        setCurrentStep(currentStep - 1);
        // 현재 페이지에서 타겟 요소로 스크롤
        setTimeout(() => {
          const target = document.querySelector(`[data-tutorial="${prevStepData.target}"]`);
          if (target) {
            // 8단계(미리보기)와 9단계(완료)는 페이지 상단으로
            if (currentStep - 1 === 7 || currentStep - 1 === 8) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              // 다른 단계는 타겟 요소 중앙으로
              target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 200);
      }
    }
  };

  const skipTutorial = () => {
    // 하이라이트 제거
    const targets = document.querySelectorAll('.tutorial-highlight');
    targets.forEach(el => el.classList.remove('tutorial-highlight'));
    onClose();
  };


  const getTooltipPosition = () => {
    const target = currentStepData.target ? document.querySelector(`[data-tutorial="${currentStepData.target}"]`) : null;
    
    // 이전 타겟에서 하이라이트 제거
    const prevTargets = document.querySelectorAll('.tutorial-highlight');
    prevTargets.forEach(el => el.classList.remove('tutorial-highlight'));

    // 현재 타겟에 하이라이트 추가
    if (target) {
      target.classList.add('tutorial-highlight');
    }

    // 모든 툴팁을 화면 중앙에 고정 배치
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    };
  };

  const position = getTooltipPosition();

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.1)",
      zIndex: 99998,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: isVisible ? 1 : 0,
      transition: "opacity 0.3s ease",
      pointerEvents: "none" // 배경 클릭 방지
    }}>
      <div style={{
        position: "absolute",
        ...position,
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "24px",
        maxWidth: "500px",
        width: "500px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
        zIndex: 99999,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? position.transform : `${position.transform} scale(0.9)`,
        transition: "all 0.3s ease",
        pointerEvents: "auto" // 툴팁은 클릭 가능
      }}>
        <div style={{
          fontSize: "20px",
          fontWeight: "bold",
          marginBottom: "12px",
          color: "#333"
        }}>
          {currentStepData.title}
        </div>
        <div style={{
          fontSize: "16px",
          color: "#666",
          lineHeight: "1.5",
          marginBottom: "20px"
        }}>
          {currentStepData.content}
        </div>
        
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px"
        }}>
          <div style={{
            fontSize: "14px",
            color: "#999"
          }}>
            {currentStep + 1} / {steps.length}
          </div>
          <div style={{
            display: "flex",
            gap: "8px"
          }}>
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f8f9fa",
                  color: "#666",
                  border: "1px solid #dee2e6",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                이전
              </button>
            )}
            <button
              onClick={nextStep}
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              {currentStep === steps.length - 1 ? "완료" : "다음"}
            </button>
          </div>
        </div>

        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px"
        }}>
          <button
            onClick={skipTutorial}
            style={{
              padding: "6px 12px",
              backgroundColor: "transparent",
              color: "#666",
              border: "1px solid #dee2e6",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            건너뛰기
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
