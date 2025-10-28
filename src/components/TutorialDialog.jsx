import React, { useState } from "react";

const TutorialDialog = ({ onStart, onSkip, onSkipForMonth }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleStart = () => {
    setIsVisible(false);
    onStart();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  const handleSkipForMonth = () => {
    setIsVisible(false);
    onSkipForMonth();
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 9998,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      animation: "fadeIn 0.3s ease"
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "32px",
        maxWidth: "500px",
        width: "90%",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
        textAlign: "center",
        animation: "slideUp 0.3s ease"
      }}>
        <div style={{
          fontSize: "48px",
          marginBottom: "16px"
        }}>
          🎉
        </div>
        
        <h2 style={{
          fontSize: "28px",
          fontWeight: "bold",
          color: "#333",
          margin: "0 0 16px 0"
        }}>
          웹사이트 빌더에 오신 것을 환영합니다!
        </h2>
        
        <p style={{
          fontSize: "16px",
          color: "#666",
          lineHeight: "1.6",
          margin: "0 0 24px 0"
        }}>
          이 도구를 사용하여 나만의 쇼핑몰을 쉽게 만들 수 있습니다.<br/>
          간단한 튜토리얼을 통해 주요 기능들을 알아보시겠습니까?
        </p>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          marginBottom: "24px"
        }}>
          <button
            onClick={handleStart}
            style={{
              padding: "14px 28px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background-color 0.2s",
              boxShadow: "0 4px 12px rgba(0, 123, 255, 0.3)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#0056b3";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#007bff";
            }}
          >
            네, 튜토리얼을 시작하겠습니다
          </button>
          
          <button
            onClick={handleSkip}
            style={{
              padding: "12px 24px",
              backgroundColor: "transparent",
              color: "#666",
              border: "1px solid #dee2e6",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f8f9fa";
              e.currentTarget.style.borderColor = "#adb5bd";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "#dee2e6";
            }}
          >
            아니오, 나중에 하겠습니다
          </button>
        </div>

        <div style={{
          padding: "16px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #e9ecef"
        }}>
          <label style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: "pointer",
            fontSize: "14px",
            color: "#666"
          }}>
            <input
              type="checkbox"
              onChange={(e) => {
                if (e.target.checked) {
                  handleSkipForMonth();
                }
              }}
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer"
              }}
            />
            한 달 동안 이 메시지를 보지 않기
          </label>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default TutorialDialog;

