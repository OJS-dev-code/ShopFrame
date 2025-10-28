import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

const Popup = ({ popupData, onClose, isMobile = false }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  console.log('Popup component rendered with:', popupData, 'isMobile:', isMobile);

  // 스와이퍼 팝업의 자동 슬라이드
  useEffect(() => {
    if (popupData.type === 'swiper' && popupData.contents.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % popupData.contents.length);
      }, 3000); // 3초마다 슬라이드 변경
      return () => clearInterval(interval);
    }
  }, [popupData.type, popupData.contents.length]);

  if (!popupData.enabled || !popupData.contents.length) {
    return null;
  }

  if (popupData.type === 'swiper') {
    return (
      <div style={{
        position: isMobile ? 'relative' : 'fixed',
        top: isMobile ? 'auto' : 0,
        left: 0,
        right: 0,
        zIndex: isMobile ? 1 : 9999,
        backgroundColor: popupData.backgroundColor || '#000000',
        padding: isMobile ? '8px 0' : '8px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: isMobile ? '32px' : '30px',
        color: popupData.textColor || '#ffffff',
        fontSize: isMobile ? '12px' : '14px',
        fontWeight: 'bold',
        marginBottom: isMobile ? '10px' : '0'
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      >
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1200px',
          height: '24px'
        }}
        onTouchStart={(e) => {
          if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
          }
        }}
        onTouchEnd={(e) => {
          if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
          }
        }}
        onMouseDown={(e) => {
          if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
          }
        }}
        onMouseUp={(e) => {
          if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
          }
        }}
        >
          <Swiper
            modules={[Navigation, Autoplay]}
            navigation={{
              nextEl: '.swiper-button-next-custom',
              prevEl: '.swiper-button-prev-custom',
            }}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            loop={true}
            style={{ height: '100%' }}
            onTouchStart={(_, ev) => { if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation(); }}
            onTouchEnd={(_, ev) => { if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation(); }}
            onMouseDown={(_, ev) => { if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation(); }}
            onMouseUp={(_, ev) => { if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation(); }}
          >
            {popupData.contents.map((content) => (
              <SwiperSlide key={content.id}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: isMobile ? '400' : '500',
                  color: popupData.textColor || '#ffffff',
                  textAlign: 'center',
                  padding: isMobile ? '0 20px' : '0 40px'
                }}>
                  {content.text}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          
          {/* 커스텀 네비게이션 버튼 */}
          <div className="swiper-button-prev-custom" style={{
            position: 'absolute',
            left: isMobile ? '3px' : '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: isMobile ? 'rgba(0,0,0,0.3)' : 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            width: isMobile ? '28px' : '32px',
            height: isMobile ? '28px' : '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            pointerEvents: 'auto',
            borderRadius: isMobile ? '50%' : '0'
          }}>
            <img 
              src={process.env.PUBLIC_URL + "/icons/chevron_left_24dp_D9D9D9_FILL0_wght400_GRAD0_opsz24.svg"} 
              alt="이전" 
              style={{ width: isMobile ? '18px' : '28px', height: isMobile ? '18px' : '28px' }}
            />
          </div>
          
          <div className="swiper-button-next-custom" style={{
            position: 'absolute',
            right: isMobile ? '3px' : '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: isMobile ? 'rgba(0,0,0,0.3)' : 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            width: isMobile ? '28px' : '32px',
            height: isMobile ? '28px' : '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            pointerEvents: 'auto',
            borderRadius: isMobile ? '50%' : '0'
          }}>
            <img 
              src={process.env.PUBLIC_URL + "/icons/chevron_right_24dp_D9D9D9_FILL0_wght400_GRAD0_opsz24.svg"} 
              alt="다음" 
              style={{ width: isMobile ? '18px' : '28px', height: isMobile ? '18px' : '28px' }}
            />
          </div>
        </div>
        
        {/* 닫기 버튼 - 모바일에서는 숨김 */}
        {!isMobile && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('X button clicked in Popup component');
              onClose();
            }}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0',
              width: '19px',
              height: '18px',
              zIndex: 20,
              pointerEvents: 'auto'
            }}
          >
            <img 
              src={process.env.PUBLIC_URL + "/icons/close_btn.png"} 
              alt="닫기" 
              style={{ width: '19px', height: '18px' }}
            />
          </button>
        )}
      </div>
    );
  }

  if (popupData.type === 'scrolling') {
    return (
      <div style={{
        position: isMobile ? 'relative' : 'fixed',
        top: isMobile ? 'auto' : 0,
        left: 0,
        right: 0,
        zIndex: isMobile ? 1 : 9999,
        backgroundColor: popupData.backgroundColor || '#ffffff',
        padding: isMobile ? '8px 0' : '8px 0',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        minHeight: isMobile ? '32px' : '24px',
        color: popupData.textColor || '#333333',
        fontSize: isMobile ? '12px' : '14px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        marginBottom: isMobile ? '10px' : '0'
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      >
         <div style={{
           display: 'inline-flex',
           animation: 'scroll 60s linear infinite',
           fontSize: isMobile ? '12px' : '14px',
           color: popupData.textColor || '#333333',
           whiteSpace: 'nowrap'
         }}
         onTouchStart={(e) => e.stopPropagation()}
         onTouchEnd={(e) => e.stopPropagation()}
         onMouseDown={(e) => e.stopPropagation()}
         onMouseUp={(e) => e.stopPropagation()}
         >
          {/* 끊김 없이 반복 노출을 위해 2세트 연속 배치 */}
          {[...Array(2)].map((_, repeatIndex) => (
            <span key={`set-${repeatIndex}`} style={{ display: 'inline-flex' }}>
              {popupData.contents.map((content) => (
                <span key={`${content.id}-r${repeatIndex}`} style={{ 
                  marginRight: '120px',
                  position: 'relative',
                  padding: '0 30px',
                  display: 'inline-block'
                }}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                >
                  {content.text}
                  <span style={{
                    position: 'absolute',
                    left: '-60px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '40px',
                    height: '1px',
                    backgroundColor: popupData.textColor || '#333333'
                  }}
                  ></span>
                </span>
              ))}
            </span>
          ))}
         </div>
        
        {/* 닫기 버튼 - 모바일에서는 숨김 */}
        {!isMobile && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('X button clicked in scrolling Popup component');
              onClose();
            }}
            style={{
              position: 'absolute',
              right: '5px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.1)',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              color: '#000000',
              padding: '4px',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              pointerEvents: 'auto'
            }}
          >
            ×
          </button>
        )}
        
        <style>
          {`
            @keyframes scroll {
              0% { transform: translateX(-50%); }
              100% { transform: translateX(0); }
            }
          `}
        </style>
      </div>
    );
  }

  return null;
};

export default Popup;
