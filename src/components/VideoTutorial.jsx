import React, { useState, useRef, useEffect } from "react";

const VideoTutorial = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // 컴포넌트가 마운트된 후 애니메이션을 위해 약간의 지연
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // 영상 자동재생
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log('자동재생 실패:', error);
      });
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: isVisible ? 1 : 0,
      transition: "opacity 0.3s ease"
    }}>
      {/* X 버튼 */}
      <button
        onClick={handleClose}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          width: "40px",
          height: "40px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          border: "none",
          borderRadius: "50%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          fontWeight: "bold",
          color: "#333",
          zIndex: 10000,
          transform: "rotate(45deg)",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)"
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "rgba(255, 255, 255, 1)";
          e.target.style.transform = "rotate(45deg) scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
          e.target.style.transform = "rotate(45deg) scale(1)";
        }}
      >
        +
      </button>

      {/* 영상 컨테이너 */}
      <div style={{
        position: "relative",
        maxWidth: "90vw",
        maxHeight: "90vh",
        transform: isVisible ? "scale(1)" : "scale(0.8)",
        transition: "transform 0.3s ease"
      }}>
        <video
          ref={videoRef}
          src="/videos/promote_video.mp4"
          controls
          style={{
            width: "100%",
            height: "auto",
            borderRadius: "8px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)"
          }}
          onEnded={handleClose}
        />
      </div>
    </div>
  );
};

export default VideoTutorial;
