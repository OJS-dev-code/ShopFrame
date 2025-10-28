import React, { useContext, useState } from "react";
import { SiteContext } from "../context/SiteContext";
import { db } from "../firebase";
import {
  collection,
  setDoc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
// import Tutorial from "../components/Tutorial";
import VideoTutorial from "../components/VideoTutorial";
import { handleImageUpload, ImagePreview } from "../utils/imageUpload";
import { validateAndCheckUrlName } from "../utils/urlManager";
import "./Editor.scss";

const Editor = () => {
  const navigate = useNavigate();
  const { 
    siteData, 
    updateSiteData, 
    categories, 
    addCategory, 
    updateCategory, 
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    addSliderImage,
    removeSliderImage,
    updateSliderImage,
    reorderSliderImages,
    productBadges,
    addBadge,
    updateBadge,
    deleteBadge,
    saveToFirebase,
    currentUser
  } = useContext(SiteContext);
  
  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState({ categoryId: "", name: "" });
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  // const [showTutorial, setShowTutorial] = useState(false);
  const [showVideoTutorial, setShowVideoTutorial] = useState(false);
  // 섹션 접기/펼치기 상태 (사이트 기본 설정 제외)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('editor_collapsed');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const toggleSection = (key) => {
    setCollapsed((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem('editor_collapsed', JSON.stringify(next)); } catch {}
      return next;
    });
  };
  
  // 뱃지 관련 state
  const [newBadge, setNewBadge] = useState({ name: "", color: "#3498db" });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);
  const [editingText, setEditingText] = useState(null);
  const [editingColor, setEditingColor] = useState(null);

  const updateField = (field, value) => {
    console.log('Updating field:', field, 'with value:', value);
    
    // 중첩된 객체 경로 처리 (예: "popup.enabled")
    if (field.includes('.')) {
      const keys = field.split('.');
      const newData = { ...siteData };
      let current = newData;
      
      // 마지막 키를 제외한 모든 키로 중첩 객체 생성
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      // 마지막 키에 값 설정
      current[keys[keys.length - 1]] = value;
      
      updateSiteData(newData);
    } else {
      updateSiteData({ [field]: value });
    }
    
    // 강제 리렌더링을 위한 작은 지연
    setTimeout(() => {
      console.log('State updated, forcing re-render');
    }, 100);
  };


  // 뱃지 관련 함수들
  const handleAddBadge = () => {
    if (newBadge.name.trim()) {
      addBadge({ ...newBadge, isDefault: false });
      setNewBadge({ name: "", color: "#3498db" });
    }
  };

  const handleUpdateBadge = (id, updates) => {
    updateBadge(id, updates);
    setEditingBadge(null);
  };

  const handleDeleteBadge = (id) => {
    const badge = productBadges.find(b => b.id === id);
    if (badge && !badge.isDefault) {
      deleteBadge(id);
    }
  };

  const startEditingBadge = (badge) => {
    setEditingBadge({ ...badge });
  };

  const startEditingText = (badge) => {
    setEditingText({ ...badge });
  };

  const startEditingColor = (badge) => {
    setEditingColor({ ...badge });
  };

  const handleUpdateText = (id, updates) => {
    updateBadge(id, updates);
    setEditingText(null);
  };

  const handleUpdateColor = (id, updates) => {
    updateBadge(id, updates);
    setEditingColor(null);
  };

  const handleSave = async () => {
    const result = await saveToFirebase();
    if (result?.success) {
      alert("저장 완료!");
    } else {
      const reason = result?.message || "저장 실패!";
      alert(reason);
    }
  };

  // 🔹 카테고리 추가 (Create)
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    // 로컬 상태에 추가
    addCategory(newCategory);
    
    // Firebase에도 저장
    await addDoc(collection(db, "categories"), {
      name: newCategory,
      createdAt: new Date(),
    });
    
    setNewCategory("");
  };

  // 🔹 서브카테고리 추가
  const handleAddSubcategory = async () => {
    if (!newSubcategory.categoryId || !newSubcategory.name.trim()) return;
    
    addSubcategory(newSubcategory.categoryId, newSubcategory.name);
    setNewSubcategory({ categoryId: "", name: "" });
  };

  // 🔹 서브카테고리 수정
  const handleUpdateSubcategory = (categoryId, subcategoryId, newName) => {
    updateSubcategory(categoryId, subcategoryId, newName);
    setEditingSubcategory(null);
  };

  // 🔹 서브카테고리 삭제
  const handleDeleteSubcategory = (categoryId, subcategoryId) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      deleteSubcategory(categoryId, subcategoryId);
    }
  };

  // 🔹 카테고리 수정 (Update)
  const handleUpdateCategory = async (id, newName) => {
    if (!newName.trim()) return;
    
    // 로컬 상태 업데이트
    updateCategory(id, newName);
    
    // Firebase 업데이트
    const categoryRef = doc(db, "categories", id);
    await updateDoc(categoryRef, { name: newName });
  };

  // 🔹 카테고리 삭제 (Delete)
  const handleDeleteCategory = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    
    // 로컬 상태에서 삭제
    deleteCategory(id);
    
    // Firebase에서 삭제
    await deleteDoc(doc(db, "categories", id));
  };

  // 카테고리 순서 관리 (siteData.categoryOrder)
  const currentCategoryOrder = React.useMemo(() => {
    const fallback = (categories || []).map((c) => c.id);
    const order = siteData?.categoryOrder && Array.isArray(siteData.categoryOrder)
      ? siteData.categoryOrder.filter((id) => fallback.includes(id))
      : [];
    const missing = fallback.filter((id) => !order.includes(id));
    return [...order, ...missing];
  }, [siteData?.categoryOrder, categories]);

  const reorderCategories = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    const next = [...currentCategoryOrder];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    updateField('categoryOrder', next);
  };

  return (
    <div className="editor-wrapper">
      <div className="editor-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 className="editor-main-title">사이트 정보입력</h1>
          <button
            onClick={() => setShowVideoTutorial(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            📹 튜토리얼
          </button>
        </div>

      {/* 사이트 기본 설정 */}
      <div data-tutorial="site-basic-settings" className="editor-section">
        <h2 className="editor-section-title">사이트 기본 설정</h2>
        {/* 로고 표시 방식 - 최상단 */}
        <div style={{ marginBottom: "15px" }}>
          <label className="editor-label">
            로고 표시 설정
          </label>
          <select
            value={siteData.logoStyle || 'text'}
            onChange={(e) => updateField("logoStyle", e.target.value)}
            className="editor-select"
            style={{ width: "300px" }}
          >
            <option value="text">텍스트</option>
            <option value="image">이미지</option>
          </select>
        </div>

        {/* 로고 이미지 업로드 (이미지 스타일일 때: 로고 방식 바로 아래) */}
        {(siteData.logoStyle || 'text') === 'image' && (
          <div style={{ marginBottom: "15px" }}>
            <label className="editor-label">
              로고 이미지 업로드
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleImageUpload(
                    file,
                    { 
                      pathPrefix: `logos/${currentUser?.uid || 'public'}`, 
                      compress: false 
                    },
                    (imageUrl) => {
                      const cbUrl = imageUrl.includes('?') ? `${imageUrl}&cb=${Date.now()}` : `${imageUrl}?cb=${Date.now()}`;
                      updateField("logoUrl", cbUrl);
                    }
                  );
                }
              }}
              style={{ padding: "8px" }}
            />
          </div>
        )}

        {/* 사이트 이름 */}
        <div style={{ marginBottom: "15px" }}>
          <label className="editor-label">
            사이트 이름
          </label>
          <input
            type="text"
            value={siteData.siteTitle}
            onChange={(e) => updateField("siteTitle", e.target.value)}
            style={{ width: "300px", padding: "8px", border: "1px solid #e5e5e5", borderRadius: "0" }}
          />
        </div>

        {/* 로고 텍스트 스타일 (텍스트 방식일 때만) */}
        {(siteData.logoStyle || 'text') === 'text' && (
          <div style={{ marginBottom: "15px" }}>
            <label className="editor-label">로고 텍스트 스타일</label>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: '#666', fontSize: 14, marginBottom: 6 }}>크기(px)</div>
                <input
                  type="number"
                  min={10}
                  max={96}
                  value={siteData.logoTextSize || 24}
                  onChange={(e) => updateField('logoTextSize', Number(e.target.value) || 24)}
                  className="editor-input"
                  style={{ width: 100 }}
                />
              </div>
              <div>
                <div style={{ color: '#666', fontSize: 14, marginBottom: 6 }}>색상</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="color"
                    value={siteData.logoTextColor || '#333333'}
                    onChange={(e) => updateField('logoTextColor', e.target.value)}
                    style={{ width: 40, height: 28, border: '1px solid #ddd', padding: 0 }}
                  />
                  <input
                    type="text"
                    value={siteData.logoTextColor || '#333333'}
                    onChange={(e) => updateField('logoTextColor', e.target.value)}
                    className="editor-input"
                    style={{ width: 120 }}
                  />
                </div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: 14, marginBottom: 6 }}>폰트</div>
                <select
                  value={siteData.logoTextFont || 'inherit'}
                  onChange={(e) => updateField('logoTextFont', e.target.value)}
                  className="editor-select"
                  style={{ width: 220 }}
                >
                  <option value="inherit">기본 폰트</option>
                  <option value="'Noto Sans KR', sans-serif">Noto Sans KR</option>
                  <option value="'Roboto', sans-serif">Roboto</option>
                  <option value="'Nanum Gothic', sans-serif">나눔고딕</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: "15px" }}>
          <label className="editor-label">
            사이트 영어 이름 (URL용)
          </label>
          <input
            type="text"
            value={siteData.siteEnglishName}
            onChange={(e) => {
              updateField("siteEnglishName", e.target.value);
            }}
            onBlur={async (e) => {
              const newUrlName = e.target.value;
              
              // URL명이 변경되었을 때만 중복 확인
              if (newUrlName && newUrlName !== siteData.siteEnglishName) {
                const validation = await validateAndCheckUrlName(newUrlName, currentUser?.uid);
                if (!validation.isValid) {
                  alert(validation.message);
                  // 원래 값으로 되돌리기
                  updateField("siteEnglishName", siteData.siteEnglishName);
                }
              }
            }}
            placeholder="예: my-shop, fashion-store"
            style={{ width: "300px", padding: "8px", border: "1px solid #e5e5e5", borderRadius: "0" }}
          />
          <div style={{ fontSize: "16px", color: "#666", marginTop: "5px" }}>
            URL: /{siteData.siteEnglishName || "my-shop"}/
          </div>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label className="editor-label">
            검색창 Placeholder
          </label>
          <input
            type="text"
            value={siteData.searchPlaceholder}
            onChange={(e) => updateField("searchPlaceholder", e.target.value)}
            style={{ width: "300px", padding: "8px", border: "1px solid #e5e5e5", borderRadius: "0" }}
          />
        </div>



        {/* 로고 미리보기 */}
        <div style={{ marginBottom: "15px" }}>
          <label className="editor-label">
            로고 미리보기
          </label>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            padding: "15px", 
            border: "1px solid #ddd", 
            borderRadius: "8px",
            backgroundColor: "#f8f9fa",
            minHeight: "60px"
          }}>
            {siteData.logoUrl && !siteData.siteTitle ? (
              // 이미지만 있고 제목이 없을 때 - 큰 이미지로 표시
              <ImagePreview 
                src={siteData.logoUrl} 
                alt="logo preview" 
                style={{ 
                  height: 60, 
                  objectFit: "contain", 
                  borderRadius: 8,
                  maxWidth: "200px"
                }}
              />
            ) : siteData.logoUrl && siteData.siteTitle ? (
              // 이미지와 제목이 모두 있을 때 - 작은 아이콘으로 표시
              <ImagePreview 
                src={siteData.logoUrl} 
                alt="logo preview" 
                style={{ 
                  width: 36, 
                  height: 36, 
                  objectFit: "contain", 
                  borderRadius: 6, 
                  background: "rgba(255,255,255,0.2)" 
                }}
              />
            ) : null}
            {siteData.siteTitle && siteData.siteTitle.trim() && (
              <div>
                <h3 style={{ margin: "0", fontSize: `${siteData.logoTextSize || 24}px`, fontWeight: "bold", color: siteData.logoTextColor || "#333", fontFamily: siteData.logoTextFont || 'inherit' }}>
                  {siteData.siteTitle}
                </h3>
                <p style={{ margin: "5px 0 0 0", opacity: "0.7", color: "#666" }}>
                  사이트 제목
                </p>
              </div>
            )}
            {!siteData.logoUrl && (!siteData.siteTitle || !siteData.siteTitle.trim()) && (
              <div style={{ color: "#999", fontStyle: "italic" }}>
                로고 이미지 URL 또는 사이트 제목을 입력하세요
              </div>
            )}
          </div>
        </div>
      </div>

      {/* UI 템플릿 선택 */}
      {/* 사이트 스타일 설정 (collapsible step 1) */}
      <div className="editor-section">
        <h2 className="editor-section-title" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>사이트 스타일 설정</span>
          <img 
            src="/icons/right-arrow.png" alt=">" 
            style={{ width:12, height:20, transform: collapsed.style ? 'rotate(-90deg)' : 'rotate(90deg)', cursor:'pointer' }}
            onClick={() => toggleSection('style')}
          />
        </h2>
        {!collapsed.style && (
        
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* 헤더 스타일 */}
          <div>
            <label className="editor-label">
              헤더 스타일
            </label>
        <select
          value={siteData.headerType}
          onChange={(e) => updateField("headerType", e.target.value)}
              className="editor-select"
              style={{ width: "100%" }}
        >
              <option value="HeaderA">Mega Menu (메가 메뉴)</option>
              <option value="HeaderB">Dropdown Menu (드롭다운 메뉴)</option>
        </select>
          </div>

          {/* 메가메뉴 검색창 광고이미지 설정 */}
          {(siteData.headerType === "HeaderA" || !siteData.headerType) && (
            <div style={{ 
              marginTop: "20px", 
              padding: "20px", 
              border: "1px solid #ddd", 
              borderRadius: "8px",
              backgroundColor: "#f9f9f9"
            }}>
              <h3 className="editor-label" style={{ margin: "0 0 15px 0", fontSize: "18px", color: "#000000", fontWeight: "600" }}>검색창 광고 이미지 설정</h3>
              <div>
                <label className="editor-label" style={{ marginBottom: "5px" }}>
                  광고이미지
      </label>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleImageUpload(
                          file,
                          {
                            pathPrefix: `searchAds/${currentUser?.uid || 'public'}`,
                            compress: true,
                            targetMaxKB: 300,
                            maxWidth: 1600,
                            maxHeight: 900,
                            jpegQuality: 0.82
                          },
                          (imageUrl) => {
                            updateField("searchAdImage", imageUrl);
                          }
                        );
                      }
                    }}
                    style={{
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      flex: "1"
                    }}
                  />
                  {siteData.searchAdImage && (
                    <button
                      onClick={() => updateField("searchAdImage", "")}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      이미지 삭제
                    </button>
                  )}
                </div>
                {siteData.searchAdImage && (
                  <div style={{ marginTop: "10px" }}>
                    <img 
                      src={siteData.searchAdImage} 
                      alt="검색창 광고 이미지" 
                      style={{ 
                        maxWidth: "200px", 
                        maxHeight: "100px", 
                        objectFit: "cover", 
                        borderRadius: "4px",
                        border: "1px solid #ddd"
                      }} 
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 메인 슬라이더 */}
          <div>
            <label className="editor-label">
              메인 슬라이더
            </label>
        <select
          value={siteData.sliderType}
          onChange={(e) => updateField("sliderType", e.target.value)}
              style={{ width: "100%", padding: "8px", border: "1px solid #e5e5e5", borderRadius: "0" }}
        >
              <option value="BasicHeroCarousel">Basic Hero Carousel (베이직 슬라이더 - 오른쪽 왼쪽 버튼, 점으로 위치 표시)</option>
              <option value="FadeHeroBanner">Fade Hero Banner (각 슬라이드에 대한 이름 지정, 이름으로 표시하고 클릭해 넘기기)</option>
              <option value="NumberedProgressSlider">Numbered Progress Slider (세로형 슬라이드, 막대바와 숫자 표시)</option>
        </select>
          </div>

          {/* 슬라이더 이미지 관리 */}
          {siteData.sliderType && (
            <div style={{ 
              marginTop: "20px", 
              padding: "20px", 
              border: "1px solid #ddd", 
              borderRadius: "8px",
              backgroundColor: "#f9f9f9"
            }}>
              <h3 style={{ margin: "0 0 15px 0", fontSize: "18px", fontWeight: "bold" }}>
                슬라이더 이미지 관리
              </h3>
              <p style={{ margin: "0 0 15px 0", fontSize: "16px", color: "#666" }}>
                이미지를 드래그하여 순서를 변경할 수 있습니다.
              </p>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginBottom: "20px" }}>
                {(siteData.sliderImages?.[siteData.sliderType] || []).map((image, index) => (
                  <div 
                    key={image.id} 
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", index.toString());
                      e.target.style.opacity = "0.5";
                    }}
                    onDragEnd={(e) => {
                      e.target.style.opacity = "1";
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
                      const dropIndex = index;
                      
                      if (dragIndex !== dropIndex) {
                        reorderSliderImages(siteData.sliderType, dragIndex, dropIndex);
                      }
                    }}
                    style={{ 
                      position: "relative",
                      border: "1px solid #ddd", 
                      borderRadius: "8px", 
                      padding: "10px",
                      backgroundColor: "#fff",
                      minWidth: "200px",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <img 
                        src={image.img} 
                        alt={image.alt}
                        style={{ 
                          width: "100%", 
                          height: "120px", 
                          objectFit: "cover", 
                          borderRadius: "4px",
                          marginBottom: "10px"
                        }}
                      />
                      <div style={{
                        position: "absolute",
                        top: "5px",
                        left: "5px",
                        background: "rgba(0,0,0,0.7)",
                        color: "white",
                        padding: "2px 6px",
                        borderRadius: "10px",
                        fontSize: "16px",
                        fontWeight: "bold"
                      }}>
                        {index + 1}
                      </div>
                    </div>
                    <div style={{ marginBottom: "10px" }}>
                      <label style={{ display: "block", fontSize: "16px", color: "#666666", textAlign: "left", marginBottom: "5px" }}>
                        이미지 업로드
      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleImageUpload(
                              file,
                              {
                                pathPrefix: `sliders/${currentUser?.uid || 'public'}`,
                                compress: true,
                                targetMaxKB: 600,
                                maxWidth: 2000,
                                maxHeight: 2000,
                                jpegQuality: 0.82
                              },
                              (imageUrl) => {
                                updateSliderImage(siteData.sliderType, image.id, { img: imageUrl });
                              }
                            );
                          }
                        }}
                        style={{ 
                          width: "100%", 
                          padding: "5px", 
                          border: "1px solid #ddd", 
                          borderRadius: "4px",
                          fontSize: "16px"
                        }}
                      />
                      <div style={{ marginTop: "5px", fontSize: "16px", color: "#666" }}>
                        또는 직접 URL 입력:
                      </div>
        <input
          type="text"
                        value={image.img}
                        onChange={(e) => updateSliderImage(siteData.sliderType, image.id, { img: e.target.value })}
                        style={{ 
                          width: "100%", 
                          padding: "5px", 
                          border: "1px solid #ddd", 
                          borderRadius: "4px",
                          fontSize: "16px",
                          marginTop: "3px"
                        }}
                        placeholder="이미지 URL을 입력하세요"
                      />
                    </div>
                    <div style={{ marginBottom: "10px" }}>
                      <label style={{ display: "block", fontSize: "16px", color: "#666666", textAlign: "left", marginBottom: "5px" }}>
                        대체 텍스트
      </label>
        <input
          type="text"
                        value={image.alt}
                        onChange={(e) => updateSliderImage(siteData.sliderType, image.id, { alt: e.target.value })}
                        style={{ 
                          width: "100%", 
                          padding: "5px", 
                          border: "1px solid #ddd", 
                          borderRadius: "4px",
                          fontSize: "16px"
                        }}
                        placeholder="이미지 설명을 입력하세요"
                      />
                    </div>
                    
                    {/* FadeHeroBanner용 텍스트 네비게이션 설정 */}
                    {siteData.sliderType === "FadeHeroBanner" && (
                      <div style={{ marginBottom: "10px" }}>
                        <label style={{ display: "block", fontSize: "16px", color: "#666666", textAlign: "left", marginBottom: "5px" }}>
                          텍스트 네비게이션
                        </label>
        <input
          type="text"
                          value={image.navText || ""}
                          onChange={(e) => updateSliderImage(siteData.sliderType, image.id, { navText: e.target.value })}
                          style={{ 
                            width: "100%", 
                            padding: "5px", 
                            border: "1px solid #ddd", 
                            borderRadius: "4px",
                            fontSize: "16px"
                          }}
                          placeholder="PROMOTION 01, PROMOTION 02 등"
                        />
                      </div>
                    )}
                    
                    {/* 모든 슬라이더용 카테고리 선택 */}
                    <div style={{ marginBottom: "10px" }}>
                      <label style={{ display: "block", fontSize: "16px", color: "#666666", textAlign: "left", marginBottom: "5px" }}>
                        연결할 카테고리
                      </label>
                      <select
                        value={image.categoryId || ""}
                        onChange={(e) => updateSliderImage(siteData.sliderType, image.id, { categoryId: e.target.value })}
                        style={{ 
                          width: "100%", 
                          padding: "5px", 
                          border: "1px solid #ddd", 
                          borderRadius: "4px",
                          fontSize: "16px"
                        }}
                      >
                        <option value="">카테고리 선택</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => removeSliderImage(siteData.sliderType, image.id)}
                      style={{
                        position: "absolute",
                        top: "5px",
                        right: "5px",
                        background: "#ff4444",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "24px",
                        height: "24px",
                        cursor: "pointer",
                        fontSize: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      title="이미지 삭제"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  onClick={() => addSliderImage(siteData.sliderType, { 
                    img: "/images/default-slide.jpg", 
                    alt: `슬라이드 ${(siteData.sliderImages?.[siteData.sliderType]?.length || 0) + 1}` 
                  })}
                  className="editor-button"
                  style={{
                    background: "#7F85CD",
                    padding: "10px 20px",
                    fontSize: "16px",
                    fontWeight: "bold"
                  }}
                >
                  + 슬라이드 추가
                </button>
                
                <div style={{ position: "relative" }}>
        <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleImageUpload(
                          file,
                          {
                            pathPrefix: `sliders/${currentUser?.uid || 'public'}`,
                            compress: true,
                            targetMaxKB: 600,
                            maxWidth: 2000,
                            maxHeight: 2000,
                            jpegQuality: 0.82
                          },
                          (imageUrl) => {
                            addSliderImage(siteData.sliderType, { 
                              img: imageUrl, 
                              alt: `슬라이드 ${(siteData.sliderImages?.[siteData.sliderType]?.length || 0) + 1}` 
                            });
                          }
                        );
                      }
                    }}
                    style={{ display: "none" }}
                    id="slider-image-upload"
                  />
                  <label
                    htmlFor="slider-image-upload"
                    className="editor-button"
                    style={{
                      background: "#000000",
                      padding: "10px 20px",
                      fontSize: "16px",
                      fontWeight: "bold",
                      display: "inline-block"
                    }}
                  >
                    이미지로 추가
                  </label>
      </div>
              </div>
            </div>
          )}


          {/* 상품 목록 스타일 */}
      <div>
            <label className="editor-label">
              상품 목록 스타일
            </label>
            <select
              value={siteData.productListType}
              onChange={(e) => updateField("productListType", e.target.value)}
              style={{ width: "100%", padding: "8px", border: "1px solid #e5e5e5", borderRadius: "0" }}
            >
              <option value="ExpandedList">확장형 리스트 (more버튼)</option>
              <option value="PagedList">페이지형 리스트 (페이지네이션)</option>
            </select>
          </div>

          {/* 상품 상세 페이지 */}
          <div>
            <label className="editor-label">
              상품 상세 페이지
            </label>
            <select
              value={siteData.productDetailType}
              onChange={(e) => updateField("productDetailType", e.target.value)}
              style={{ width: "100%", padding: "8px", border: "1px solid #e5e5e5", borderRadius: "0" }}
            >
              <option value="ProductDetail1">ProductDetail 1 (기본 레이아웃)</option>
            </select>
          </div>

        </div>
        )}
      </div>

      {/* 상단 팝업 설정 (collapsible step 2) */}
      <div className="editor-section">
        <h2 className="editor-section-title" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>상단 팝업 설정</span>
          <img 
            src="/icons/right-arrow.png" alt=">" 
            style={{ width:12, height:20, transform: collapsed.popup ? 'rotate(-90deg)' : 'rotate(90deg)', cursor:'pointer' }}
            onClick={() => toggleSection('popup')}
          />
        </h2>
        {!collapsed.popup && (
        <>
        
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
        <input
              type="checkbox"
              checked={siteData.popup?.enabled || false}
              onChange={(e) => updateField("popup.enabled", e.target.checked)}
              style={{ transform: "scale(1.2)" }}
            />
            <span style={{ fontWeight: "bold", fontSize: "16px" }}>상단 배너 활성화</span>
          </label>
      </div>

        {siteData.popup?.enabled && (
          <>
            <div style={{ marginBottom: "20px" }}>
              <label className="editor-label">
                팝업 타입
      </label>
              <select
                value={siteData.popup?.type || "swiper"}
                onChange={(e) => {
                  const val = e.target.value;
                  updateField("popup.type", val);
                  // 타입 변경 시 기본 색상 세팅
                  if (val === 'swiper') {
                    updateField("popup.backgroundColor", "#000000");
                    updateField("popup.textColor", "#ffffff");
                  } else if (val === 'scrolling') {
                    updateField("popup.backgroundColor", "#ffffff");
                    updateField("popup.textColor", "#333333");
                  }
                }}
                className="editor-select"
                style={{ width: "300px" }}
              >
                <option value="swiper">슬라이더 배너 (슬라이드 형태)</option>
                <option value="scrolling">스트리밍 배너 (흘러가는 형태)</option>
              </select>
            </div>

      <div>
              <label className="editor-label" style={{ marginBottom: "10px" }}>팝업 내용</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {(siteData.popup?.contents || []).map((content, index) => (
                  <div key={content.id} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <input
          type="text"
                      value={content.text}
                      onChange={(e) => {
                        const newContents = [...(siteData.popup?.contents || [])];
                        newContents[index] = { ...content, text: e.target.value };
                        updateField("popup.contents", newContents);
                      }}
                      placeholder={`팝업 내용 ${index + 1}`}
                      className="editor-input"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newContents = (siteData.popup?.contents || []).filter((_, i) => i !== index);
                        updateField("popup.contents", newContents);
                      }}
                      className="editor-delete-button"
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#000000",
                        color: "white"
                      }}
                    >
                      삭제
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newContents = [...(siteData.popup?.contents || [])];
                    newContents.push({
                      id: `popup${Date.now()}`,
                      text: `새 팝업 내용 ${newContents.length + 1}`
                    });
                    updateField("popup.contents", newContents);
                  }}
                  className="editor-button"
                  style={{
                    padding: "10px",
                    backgroundColor: "#4049B0",
                    width: "fit-content"
                  }}
                >
                  팝업 내용 추가
                </button>
              </div>
        </div>
        {/* 팝업 색상 설정 */}
        <div style={{ display: "flex", gap: "20px", marginTop: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <label className="editor-label" style={{ display: "block", marginBottom: 6 }}>배경색</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="color"
                value={siteData.popup?.backgroundColor || (siteData.popup?.type === 'swiper' ? '#000000' : '#ffffff')}
                onChange={(e) => updateField('popup.backgroundColor', e.target.value)}
                style={{ width: 40, height: 28, border: '1px solid #ddd', padding: 0 }}
              />
              <input
                type="text"
                value={siteData.popup?.backgroundColor || (siteData.popup?.type === 'swiper' ? '#000000' : '#ffffff')}
                onChange={(e) => updateField('popup.backgroundColor', e.target.value)}
                placeholder="#000000"
                className="editor-input"
                style={{ width: 120 }}
              />
            </div>
          </div>
          <div>
            <label className="editor-label" style={{ display: "block", marginBottom: 6 }}>텍스트 색</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="color"
                value={siteData.popup?.textColor || (siteData.popup?.type === 'swiper' ? '#ffffff' : '#333333')}
                onChange={(e) => updateField('popup.textColor', e.target.value)}
                style={{ width: 40, height: 28, border: '1px solid #ddd', padding: 0 }}
              />
              <input
                type="text"
                value={siteData.popup?.textColor || (siteData.popup?.type === 'swiper' ? '#ffffff' : '#333333')}
                onChange={(e) => updateField('popup.textColor', e.target.value)}
                placeholder="#ffffff"
                className="editor-input"
                style={{ width: 120 }}
              />
            </div>
          </div>
        </div>
          </>
        )}
        </>
        )}
      </div>

      {/* 사용자 가입 설정 */}
      <div data-tutorial="auth-settings" className="editor-section">
        <h2 className="editor-section-title">사용자 가입 설정</h2>

        <div style={{ marginTop: "15px" }}>
          <label className="editor-label" style={{ marginBottom: "8px" }}>
            회원가입 추가 필드
          </label>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {[
              { key: "name", label: "이름" },
              { key: "phone", label: "전화번호" },
              { key: "address", label: "주소" },
            ].map((f) => (
              <label key={f.key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
                  type="checkbox"
                  checked={siteData.auth?.signupFields?.includes(f.key)}
                  onChange={(e) => {
                    const fields = new Set(siteData.auth?.signupFields || []);
                    if (e.target.checked) fields.add(f.key); else fields.delete(f.key);
                    updateField("auth", { ...siteData.auth, signupFields: Array.from(fields) });
                  }}
                /> {f.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Category (collapsible + reorder) */}
      <div data-tutorial="category-management" className="editor-section">
        <h2 className="editor-section-title" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>Category</span>
          <img 
            src="/icons/right-arrow.png" alt=">" 
            style={{ width:12, height:20, transform: collapsed.category ? 'rotate(-90deg)' : 'rotate(90deg)', cursor:'pointer' }}
            onClick={() => toggleSection('category')}
          />
        </h2>
        {!collapsed.category && (
        <>

        {/* 카테고리 추가 폼 */}
        <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
            placeholder="새 카테고리명을 입력하세요"
            className="editor-input"
            style={{ 
              width: "300px", 
              marginRight: "10px"
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <button 
            onClick={handleAddCategory}
            className="editor-button"
            style={{
              padding: "8px 16px",
              backgroundColor: "#4049B0"
            }}
          >
            카테고리 추가
          </button>
        </div>

        {/* 서브카테고리 추가 폼 */}
        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#e9ecef", borderRadius: "6px" }}>
          <h3 style={{ marginTop: 0, marginBottom: "10px" }}>서브카테고리 추가</h3>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "nowrap" }}>
            <select
              value={newSubcategory.categoryId}
              onChange={(e) => setNewSubcategory({ ...newSubcategory, categoryId: e.target.value })}
              className="editor-select"
              style={{ width: "200px", border: "1px solid #e5e5e5", color: "#888888" }}
            >
              <option value="">대 카테고리 선택</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={newSubcategory.name}
              onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
              placeholder="서브 카테고리명 (예: 아우터, 나시, 티셔츠)"
              className="editor-input"
              style={{ width: "300px", border: "1px solid #e5e5e5", color: "#888888", fontSize: "14px" }}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSubcategory()}
            />
            <button 
              onClick={handleAddSubcategory}
              className="editor-button"
              style={{
                padding: "8px 16px",
                backgroundColor: "#34A95D"
              }}
            >
              서브카테고리 추가
            </button>
          </div>
        </div>

        {/* 카테고리 목록 (드래그로 순서변경) */}
        <p style={{ margin: "0 0 15px 0", fontSize: "16px", color: "#666" }}>
          카테고리를 드래그하여 순서를 변경할 수 있습니다.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "15px" }}>
          {currentCategoryOrder.map((catId, index) => {
            const cat = categories.find(c => c.id === catId);
            if (!cat) return null;
            return (
            <div key={cat.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', String(index))}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData('text/plain')); if(!Number.isNaN(from)) reorderCategories(from, index); }}
              style={{ 
              background: "white", 
              padding: "15px", 
              border: "1px solid #ddd", 
              borderRadius: "4px",
              cursor:'pointer'
            }}>
              {/* 대카테고리 헤더 */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: cat.subcategories?.length > 0 ? "10px" : "0"
              }}>
                <span style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{
                    display:'inline-flex', alignItems:'center', justifyContent:'center',
                    width:'22px', height:'22px', borderRadius:'50%',
                    background:'#f0f0f0', color:'#666', fontSize:'12px',
                    border:'1px solid #e0e0e0'
                  }}>{index + 1}</span>
                  <b style={{ fontSize:'16px' }}>{cat.name}</b>
                </span>
                <div>
                  <button 
                    onClick={() => {
                      const newName = prompt("새 카테고리명:", cat.name);
                      if (newName) handleUpdateCategory(cat.id, newName);
                    }}
                    className="editor-button"
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#7F85CD",
                      marginRight: "5px",
                      fontSize: "16px"
                    }}
                  >
                수정
              </button>
                  <button 
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="editor-button"
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#000000",
                      fontSize: "16px"
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>

              {/* 팝업 색상 설정 */}
              <div style={{ display: 'flex', gap: '20px', marginTop: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <label className="editor-label" style={{ display: 'block', marginBottom: 6 }}>배경색</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="color"
                      value={siteData.popup?.backgroundColor || (siteData.popup?.type === 'swiper' ? '#000000' : '#ffffff')}
                      onChange={(e) => updateField('popup.backgroundColor', e.target.value)}
                      style={{ width: 40, height: 28, border: '1px solid #ddd', padding: 0 }}
                    />
                    <input
                      type="text"
                      value={siteData.popup?.backgroundColor || (siteData.popup?.type === 'swiper' ? '#000000' : '#ffffff')}
                      onChange={(e) => updateField('popup.backgroundColor', e.target.value)}
                      placeholder="#000000"
                      className="editor-input"
                      style={{ width: 120 }}
                    />
                  </div>
                </div>
                <div>
                  <label className="editor-label" style={{ display: 'block', marginBottom: 6 }}>텍스트 색</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="color"
                      value={siteData.popup?.textColor || (siteData.popup?.type === 'swiper' ? '#ffffff' : '#333333')}
                      onChange={(e) => updateField('popup.textColor', e.target.value)}
                      style={{ width: 40, height: 28, border: '1px solid #ddd', padding: 0 }}
                    />
                    <input
                      type="text"
                      value={siteData.popup?.textColor || (siteData.popup?.type === 'swiper' ? '#ffffff' : '#333333')}
                      onChange={(e) => updateField('popup.textColor', e.target.value)}
                      placeholder="#ffffff"
                      className="editor-input"
                      style={{ width: 120 }}
                    />
                  </div>
                </div>
              </div>

              {/* 서브카테고리 목록 */}
              {cat.subcategories && cat.subcategories.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <div style={{ fontSize: "16px", color: "#6c757d", marginBottom: "8px" }}>서브카테고리:</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {cat.subcategories.map((sub) => (
                      <div key={sub.id} style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        backgroundColor: "transparent",
                        padding: "6px 12px",
                        border: "1px solid #E5E5E5",
                        fontSize: "16px",
                        minHeight: "36px"
                      }}>
                        {editingSubcategory?.id === sub.id ? (
                          <input
                            type="text"
                            defaultValue={sub.name}
                            onBlur={(e) => handleUpdateSubcategory(cat.id, sub.id, e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateSubcategory(cat.id, sub.id, e.target.value);
                              }
                            }}
                            style={{ 
                              border: "none", 
                              background: "transparent", 
                              fontSize: "16px",
                              outline: "none"
                            }}
                            autoFocus
                          />
                        ) : (
                          <>
                            <span>{sub.name}</span>
                            <div style={{ display: "flex", gap: "4px" }}>
                              <button
                                onClick={() => setEditingSubcategory(sub)}
                                style={{
                                  fontSize: "16px",
                                  backgroundColor: "transparent",
                                  color: "#7B00FF",
                                  padding: "4px 8px",
                                  border: "none",
                                  cursor: "pointer"
                                }}
                              >
                수정
              </button>
                              <button
                                onClick={() => handleDeleteSubcategory(cat.id, sub.id)}
                                style={{
                                  fontSize: "16px",
                                  backgroundColor: "transparent",
                                  color: "#FF5F6E",
                                  padding: "4px 6px",
                                  border: "none",
                                  cursor: "pointer"
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )})}
        </div>
        </>
        )}
      </div>


      {/* 상품 뱃지 설정 (collapsible) */}
      <div className="editor-section">
        <h2 className="editor-section-title" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>상품 뱃지 설정</span>
          <img 
            src="/icons/right-arrow.png" alt=">" 
            style={{ width:12, height:20, transform: collapsed.badges ? 'rotate(-90deg)' : 'rotate(90deg)', cursor:'pointer' }}
            onClick={() => toggleSection('badges')}
          />
        </h2>
        {!collapsed.badges && (
        <>
        
        {/* 새 뱃지 추가 */}
        <div style={{ marginBottom: "20px" }}>
          <h3 className="editor-label" style={{ marginBottom: "10px", fontSize: "18px" }}>새 뱃지 추가</h3>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              value={newBadge.name}
              onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
              placeholder="뱃지명 (예: 신상품, 할인)"
              style={{ padding: "8px", border: "1px solid #e5e5e5", borderRadius: "0", minWidth: "200px" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <input
                type="color"
                value={newBadge.color}
                onChange={(e) => setNewBadge({ ...newBadge, color: e.target.value })}
                style={{ width: "40px", height: "36px", border: "1px solid #e5e5e5", borderRadius: "0" }}
              />
              <span className="editor-label" style={{ fontSize: "16px" }}>색상</span>
            </div>
            <button 
              onClick={handleAddBadge}
              style={{
                padding: "8px 16px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              추가
            </button>
          </div>
        </div>

        {/* 기존 뱃지 목록 */}
        <div>
          <h3 className="editor-label" style={{ marginBottom: "15px", fontSize: "18px" }}>기존 뱃지</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {(productBadges || []).map(badge => (
              <div key={badge.id} style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                backgroundColor: "#fff",
                borderRadius: "20px",
                fontSize: "16px",
                color: editingColor && editingColor.id === badge.id ? editingColor.color : badge.color
              }}>
                {editingText && editingText.id === badge.id ? (
                  <>
                    <input
                      type="text"
                      value={editingText.name}
                      onChange={(e) => setEditingText({ ...editingText, name: e.target.value })}
                      style={{ 
                        border: "1px solid #ddd", 
                        background: "#fff", 
                        fontSize: "16px",
                        width: "100px",
                        outline: "none",
                        padding: "4px 8px",
                        borderRadius: "4px"
                      }}
                      onBlur={() => handleUpdateText(badge.id, editingText)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateText(badge.id, editingText);
                        }
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateText(badge.id, editingText)}
                      style={{
                        background: "#007bff",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "16px",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        marginLeft: "8px"
                      }}
                    >
                      완료
                    </button>
                    <button
                      onClick={() => setEditingText(null)}
                      style={{
                        background: "#6c757d",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "16px",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        marginLeft: "5px"
                      }}
                    >
                      취소
                    </button>
                  </>
                ) : editingColor && editingColor.id === badge.id ? (
                  <>
                    <span>{badge.name}</span>
                    <input
                      type="color"
                      value={editingColor.color}
                      onChange={(e) => setEditingColor({ ...editingColor, color: e.target.value })}
                      style={{ 
                        width: "30px", 
                        height: "30px", 
                        border: "1px solid #ddd", 
                        borderRadius: "50%",
                        marginLeft: "5px",
                        cursor: "pointer"
                      }}
                      title="색상 선택"
                    />
                    <button
                      onClick={() => handleUpdateColor(badge.id, editingColor)}
                      style={{
                        background: "#007bff",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "16px",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        marginLeft: "8px"
                      }}
                    >
                      완료
                    </button>
                    <button
                      onClick={() => setEditingColor(null)}
                      style={{
                        background: "#6c757d",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "16px",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        marginLeft: "5px"
                      }}
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <span>{badge.name}</span>
                    {badge.isDefault && (
                      <span style={{ fontSize: "16px", color: "#999" }}>(기본)</span>
                    )}
                    <button
                      onClick={() => startEditingText(badge)}
                      style={{
                        background: "#28a745",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "16px",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        marginLeft: "8px"
                      }}
                    >
                      텍스트
                    </button>
                    <button
                      onClick={() => startEditingColor(badge)}
                      style={{
                        background: "#17a2b8",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "16px",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        marginLeft: "5px"
                      }}
                    >
                      색상
                    </button>
                    <button
                      onClick={() => handleDeleteBadge(badge.id)}
                      style={{
                        background: "#dc3545",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "16px",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        marginLeft: "5px"
                      }}
                    >
                      삭제
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        </>
        )}
      </div>

      
      {/* 튜토리얼 - 주석처리 */}
      {/* {showTutorial && (
        <Tutorial
          onClose={() => setShowTutorial(false)}
        />
      )} */}
      
      {/* 영상 튜토리얼 */}
      {showVideoTutorial && (
        <VideoTutorial
          onClose={() => setShowVideoTutorial(false)}
        />
      )}

      {/* Footer 설정 (collapsible) */}
      <div className="editor-section">
        <h2 className="editor-section-title" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>Footer 설정</span>
          <img 
            src="/icons/right-arrow.png" alt=">" 
            style={{ width:12, height:20, transform: collapsed.footer ? 'rotate(-90deg)' : 'rotate(90deg)', cursor:'pointer' }}
            onClick={() => toggleSection('footer')}
          />
        </h2>
        {!collapsed.footer && (
        <>

        {/* 기본 정보 */}
        <div style={{ marginBottom: "15px" }}>
          <div style={{ marginBottom: "10px" }}>
            <label className="editor-label" style={{ marginBottom: "3px", fontSize: "18px", color: "#333333" }}>
              Footer 이름 표시 방식
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize: 16 }}>
                <input
                  type="radio"
                  checked={(siteData.footer?.logoStyle || 'text') === 'text'}
                  onChange={() => updateField('footer.logoStyle', 'text')}
                />
                텍스트
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize: 16 }}>
                <input
                  type="radio"
                  checked={(siteData.footer?.logoStyle || 'text') === 'image'}
                  onChange={() => updateField('footer.logoStyle', 'image')}
                />
                이미지
              </label>
            </div>

            {(siteData.footer?.logoStyle || 'text') === 'text' ? (
              <div>
                <label className="editor-label" style={{ marginBottom: "3px", color: "#666666", fontSize: 16 }}>Footer 표시할 이름</label>
                <input
                  type="text"
                  value={siteData.footer?.mallName || ""}
                  onChange={(e) => updateField("footer.mallName", e.target.value)}
                  placeholder="이름을 입력해주세요."
                  style={{ width: "300px", padding: "8px 6px", border: "1px solid #e5e5e5", borderRadius: "0", fontSize: 16, color: "#666666" }}
                />
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div>
                    <label className="editor-label" style={{ marginBottom: "3px", color: "#666666", fontSize: 16 }}>Footer 로고 이미지 업로드</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files && e.target.files[0];
                        if (!file) return;
                        handleImageUpload(
                          file,
                          {
                            pathPrefix: `footer/${currentUser?.uid || 'public'}`,
                            compress: true,
                            targetMaxKB: 400,
                            maxWidth: 1200,
                            maxHeight: 400,
                            jpegQuality: 0.85
                          },
                          (url) => updateField('footer.logoUrl', url)
                        );
                      }}
                      style={{ width: '320px', padding: '6px', border: '1px solid #e5e5e5', borderRadius: 0, fontSize: 16 }}
                    />
                  </div>
                  <div>
                    <label className="editor-label" style={{ marginBottom: "3px", color: "#666666", fontSize: 16 }}>Footer 로고 이미지 URL</label>
                    <input
                      type="text"
                      value={siteData.footer?.logoUrl || ""}
                      onChange={(e) => updateField("footer.logoUrl", e.target.value)}
                      placeholder="이미지 URL을 입력해주세요."
                      style={{ width: "420px", padding: "8px 6px", border: "1px solid #e5e5e5", borderRadius: "0", fontSize: "16px" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 고객센터 정보 */}
        <div style={{ marginBottom: "15px" }}>
          <h3 className="editor-label" style={{ fontSize: "18px", marginBottom: "8px", color: "#333333" }}>고객센터 정보</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "10px" }}>
            <div>
              <label className="editor-label" style={{ marginBottom: "3px", fontSize: "16px" }}>
                전화번호
              </label>
              <input
                type="text"
                value={siteData.footer?.customerPhone || ""}
                onChange={(e) => updateField("footer.customerPhone", e.target.value)}
                placeholder="예: 1599-2219"
                style={{ width: "100%", padding: "8px 6px", border: "1px solid #e5e5e5", borderRadius: "0", fontSize: "16px" }}
              />
            </div>
            <div>
              <label className="editor-label" style={{ marginBottom: "3px", fontSize: "16px" }}>
                운영시간
              </label>
              <input
                type="text"
                value={siteData.footer?.operatingHours || ""}
                onChange={(e) => updateField("footer.operatingHours", e.target.value)}
                placeholder="예: 10:00-17:00"
                style={{ width: "100%", padding: "8px 6px", border: "1px solid #e5e5e5", borderRadius: "0", fontSize: "16px" }}
              />
            </div>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label className="editor-label" style={{ marginBottom: "3px", fontSize: "16px" }}>
              휴무일 표시 메시지
            </label>
            <input
              type="text"
              value={siteData.footer?.holidays || ""}
              onChange={(e) => updateField("footer.holidays", e.target.value)}
              placeholder="예: 토/일/공휴일 휴무"
              style={{ width: "400px", padding: "8px 6px", border: "1px solid #e5e5e5", borderRadius: "0", fontSize: "16px" }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label className="editor-label" style={{ marginBottom: "5px", fontSize: "16px" }}>
              고객센터 버튼 표시
            </label>
            <div style={{ display: "flex", gap: "15px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "16px" }}>
                <input
                  type="checkbox"
                  checked={siteData.footer?.showNoticeButton || false}
                  onChange={(e) => updateField("footer.showNoticeButton", e.target.checked)}
                />
                공지사항
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "16px" }}>
                <input
                  type="checkbox"
                  checked={siteData.footer?.showInquiryButton || false}
                  onChange={(e) => updateField("footer.showInquiryButton", e.target.checked)}
                />
                상품문의
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "16px" }}>
                <input
                  type="checkbox"
                  checked={siteData.footer?.showCustomerServiceButton || false}
                  onChange={(e) => updateField("footer.showCustomerServiceButton", e.target.checked)}
                />
                고객센터
              </label>
            </div>
          </div>
        </div>

        {/* 계좌 정보 */}
        <div style={{ marginBottom: "15px" }}>
          <h3 className="editor-label" style={{ fontSize: "18px", marginBottom: "8px", color: "#333333" }}>계좌 정보</h3>
          
          {/* 예금주 정보 */}
          <div style={{ marginBottom: "10px" }}>
            <label className="editor-label" style={{ marginBottom: "3px", fontSize: "16px" }}>
              예금주
            </label>
            <input
              type="text"
              value={siteData.footer?.accountHolder || ""}
              onChange={(e) => updateField("footer.accountHolder", e.target.value)}
              placeholder="예: 홍길동"
              style={{ width: "200px", padding: "8px 6px", border: "1px solid #e5e5e5", borderRadius: "0", fontSize: "16px" }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <button
              onClick={() => {
                const currentAccounts = siteData.footer?.accounts || [];
                const newAccount = {
                  id: Date.now(),
                  bank: "국민",
                  number: ""
                };
                updateField("footer.accounts", [...currentAccounts, newAccount]);
              }}
              className="editor-button"
              style={{
                padding: "6px 12px",
                backgroundColor: "#4049B0",
                fontSize: "16px"
              }}
            >
              계좌 추가
            </button>
          </div>
          {(siteData.footer?.accounts || []).map((account, index) => (
            <div key={account.id || index} style={{ 
              marginBottom: "10px", 
              padding: "10px", 
              backgroundColor: "#f8f9fa", 
              borderRadius: "6px",
              border: "1px solid #dee2e6"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h4 style={{ margin: "0", fontSize: "16px", fontWeight: "bold" }}>계좌 {index + 1}</h4>
                <button
                  onClick={() => {
                    const currentAccounts = siteData.footer?.accounts || [];
                    const updatedAccounts = currentAccounts.filter((_, i) => i !== index);
                    updateField("footer.accounts", updatedAccounts);
                  }}
                  style={{
                    padding: "3px 6px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "16px"
                  }}
                >
                  삭제
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <select
                    value={account.bank || "국민"}
                    onChange={(e) => {
                      const currentAccounts = siteData.footer?.accounts || [];
                      const updatedAccounts = [...currentAccounts];
                      updatedAccounts[index] = { ...updatedAccounts[index], bank: e.target.value };
                      updateField("footer.accounts", updatedAccounts);
                    }}
                    style={{ width: "100%", padding: "8px 6px", border: "1px solid #e5e5e5", borderRadius: "0", fontSize: "16px" }}
                  >
                    <option value="국민">국민은행</option>
                    <option value="신한">신한은행</option>
                    <option value="하나">하나은행</option>
                    <option value="우리">우리은행</option>
                    <option value="iM뱅크">iM뱅크</option>
                    <option value="카카오뱅크">카카오뱅크</option>
                    <option value="케이뱅크">케이뱅크</option>
                    <option value="토스뱅크">토스뱅크</option>
                    <option value="농협">농협</option>
                    <option value="수협">수협</option>
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    value={account.number || ""}
                    onChange={(e) => {
                      const currentAccounts = siteData.footer?.accounts || [];
                      const updatedAccounts = [...currentAccounts];
                      updatedAccounts[index] = { ...updatedAccounts[index], number: e.target.value };
                      updateField("footer.accounts", updatedAccounts);
                    }}
                    placeholder="-를 포함한 계좌번호를 입력해주세요"
                    style={{ width: "100%", padding: "8px 6px", border: "1px solid #e5e5e5", borderRadius: "0", fontSize: "16px" }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 반품 주소 */}
        <div style={{ marginBottom: "15px" }}>
          <h3 className="editor-label" style={{ fontSize: "18px", marginBottom: "8px", color: "#333333" }}>반품 주소</h3>
          <div style={{ marginBottom: "10px" }}>
            <label className="editor-label" style={{ marginBottom: "3px", fontSize: "16px" }}>
              반품 주소
            </label>
            <input
              type="text"
              value={siteData.footer?.returnAddress || ""}
              onChange={(e) => updateField("footer.returnAddress", e.target.value)}
              placeholder="예: 서울특별시 광진구 강변역로2 C동 3층"
              style={{ width: "400px", padding: "8px 6px", border: "1px solid #e5e5e5", borderRadius: "0", fontSize: "16px" }}
            />
          </div>
        </div>

        {/* 회사 정보 */}
        <div style={{ marginBottom: "15px" }}>
          <h3 className="editor-label" style={{ fontSize: "18px", marginBottom: "8px", color: "#333333" }}>회사 정보</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "10px" }}>
            <div>
              <label className="editor-label" style={{ marginBottom: "3px", fontSize: "16px" }}>
                법인명
              </label>
              <input
                type="text"
                value={siteData.footer?.companyName || ""}
                onChange={(e) => updateField("footer.companyName", e.target.value)}
                placeholder="예: 스마트테크(주)"
                style={{ width: "100%", padding: "8px 6px", border: "1px solid #e5e5e5", borderRadius: "0", fontSize: "16px" }}
              />
            </div>
            <div>
              <label className="editor-label" style={{ marginBottom: "3px", fontSize: "16px" }}>
                대표자
              </label>
              <input
                type="text"
                value={siteData.footer?.representative || ""}
                onChange={(e) => updateField("footer.representative", e.target.value)}
                placeholder="예: 김철수"
                style={{ width: "100%", padding: "8px 6px", border: "1px solid #e5e5e5", borderRadius: "0", fontSize: "16px" }}
              />
            </div>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label className="editor-label" style={{ marginBottom: "3px", fontSize: "16px" }}>
              주소
            </label>
            <textarea
              value={siteData.footer?.address || ""}
              onChange={(e) => updateField("footer.address", e.target.value)}
              placeholder="예: 서울특별시 강남구 테헤란로 123번지 스마트빌딩 5층"
              style={{ width: "500px", padding: "8px 6px", border: "1px solid #e5e5e5", borderRadius: "0", minHeight: "50px", resize: "vertical", fontSize: "16px" }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "10px" }}>
            <div>
              <label className="editor-label" style={{ marginBottom: "3px", fontSize: "16px" }}>
                사업자등록번호
              </label>
              <input
                type="text"
                value={siteData.footer?.businessNumber || ""}
                onChange={(e) => updateField("footer.businessNumber", e.target.value)}
                placeholder="예: 123-45-67890"
                style={{ width: "100%", padding: "8px 6px", border: "1px solid #e5e5e5", borderRadius: "0", fontSize: "16px" }}
              />
            </div>
            <div>
              <label className="editor-label" style={{ marginBottom: "3px", fontSize: "16px" }}>
                통신판매신고
              </label>
              <input
                type="text"
                value={siteData.footer?.ecommerceReport || ""}
                onChange={(e) => updateField("footer.ecommerceReport", e.target.value)}
                placeholder="예: 제2024-서울강남-0123호"
                style={{ width: "100%", padding: "8px 6px", border: "1px solid #e5e5e5", borderRadius: "0", fontSize: "16px" }}
              />
            </div>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label className="editor-label" style={{ marginBottom: "3px", fontSize: "16px" }}>
              개인정보보호책임자
            </label>
            <input
              type="text"
              value={siteData.footer?.privacyManager || ""}
              onChange={(e) => updateField("footer.privacyManager", e.target.value)}
              placeholder="예: 개인정보팀 (privacy@smarttech.co.kr)"
              style={{ width: "400px", padding: "8px 6px", border: "1px solid #e5e5e5", borderRadius: "0", fontSize: "16px" }}
            />
          </div>
        </div>

        {/* SNS 링크 */}
        <div style={{ marginBottom: "15px" }}>
          <h3 className="editor-label" style={{ fontSize: "18px", marginBottom: "8px", color: "#333333" }}>SNS 링크</h3>
          <div style={{ marginBottom: "10px" }}>
            <label className="editor-label" style={{ marginBottom: "5px", fontSize: "16px" }}>
              표시할 SNS 선택
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginBottom: "10px" }}>
              {[
                { key: 'facebook', label: '페이스북' },
                { key: 'kakao', label: '카카오톡' },
                { key: 'twitter', label: 'X' },
                { key: 'youtube', label: '유튜브' },
                { key: 'instagram', label: '인스타그램' },
                { key: 'naver', label: '네이버블로그' }
              ].map((sns) => (
                <label key={sns.key} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "16px" }}>
                  <input
                    type="checkbox"
                    checked={siteData.footer?.[`show${sns.key.charAt(0).toUpperCase() + sns.key.slice(1)}Button`] || false}
                    onChange={(e) => updateField(`footer.show${sns.key.charAt(0).toUpperCase() + sns.key.slice(1)}Button`, e.target.checked)}
                  />
                  {sns.label}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            {siteData.footer?.showFacebookButton && (
              <div>
                <label className="editor-label" style={{ marginBottom: "3px", fontSize: "16px" }}>
                  페이스북 URL
                </label>
                <input
                  type="url"
                  value={siteData.footer?.facebook || ""}
                  onChange={(e) => updateField("footer.facebook", e.target.value)}
                  placeholder="https://facebook.com/..."
                  style={{ width: "100%", padding: "8px 6px", border: "1px solid #e5e5e5", borderRadius: "0", fontSize: "16px" }}
                />
              </div>
            )}
            {siteData.footer?.showKakaoButton && (
              <div>
                <label className="editor-label" style={{ marginBottom: "3px", fontSize: "16px" }}>
                  카카오톡 URL
                </label>
                <input
                  type="url"
                  value={siteData.footer?.kakao || ""}
                  onChange={(e) => updateField("footer.kakao", e.target.value)}
                  placeholder="https://open.kakao.com/..."
                  style={{ width: "100%", padding: "8px 6px", border: "1px solid #e5e5e5", borderRadius: "0", fontSize: "16px" }}
                />
              </div>
            )}
            {siteData.footer?.showTwitterButton && (
              <div>
                <label className="editor-label" style={{ marginBottom: "3px", fontSize: "16px" }}>
                  X URL
                </label>
                <input
                  type="url"
                  value={siteData.footer?.twitter || ""}
                  onChange={(e) => updateField("footer.twitter", e.target.value)}
                  placeholder="https://x.com/..."
                  style={{ width: "100%", padding: "8px 6px", border: "1px solid #e5e5e5", borderRadius: "0", fontSize: "16px" }}
                />
              </div>
            )}
            {siteData.footer?.showYoutubeButton && (
              <div>
                <label className="editor-label" style={{ marginBottom: "3px", fontSize: "16px" }}>
                  유튜브 URL
                </label>
                <input
                  type="url"
                  value={siteData.footer?.youtube || ""}
                  onChange={(e) => updateField("footer.youtube", e.target.value)}
                  placeholder="https://youtube.com/..."
                  style={{ width: "100%", padding: "8px 6px", border: "1px solid #e5e5e5", borderRadius: "0", fontSize: "16px" }}
                />
              </div>
            )}
            {siteData.footer?.showInstagramButton && (
              <div>
                <label className="editor-label" style={{ marginBottom: "3px", fontSize: "16px" }}>
                  인스타그램 URL
                </label>
                <input
                  type="url"
                  value={siteData.footer?.instagram || ""}
                  onChange={(e) => updateField("footer.instagram", e.target.value)}
                  placeholder="https://instagram.com/..."
                  style={{ width: "100%", padding: "8px 6px", border: "1px solid #e5e5e5", borderRadius: "0", fontSize: "16px" }}
                />
              </div>
            )}
            {siteData.footer?.showNaverButton && (
              <div>
                <label className="editor-label" style={{ marginBottom: "3px", fontSize: "16px" }}>
                  네이버블로그 URL
                </label>
                <input
                  type="url"
                  value={siteData.footer?.naver || ""}
                  onChange={(e) => updateField("footer.naver", e.target.value)}
                  placeholder="https://blog.naver.com/..."
                  style={{ width: "100%", padding: "8px 6px", border: "1px solid #e5e5e5", borderRadius: "0", fontSize: "16px" }}
                />
              </div>
            )}
          </div>
        </div>
        </>
        )}
      </div>
      
      
      {/* 저장 버튼 - 페이지 하단 */}
      <div style={{ 
        position: "fixed", 
        bottom: "20px", 
        right: "20px", 
        zIndex: 1000 
      }}>
        <button
          onClick={handleSave}
          style={{
            padding: "15px 30px",
            backgroundColor: "#FFEE00",
            color: "black",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            transition: "box-shadow 0.3s ease"
          }}
          onMouseOver={(e) => {
            e.target.style.boxShadow = "0 6px 12px rgba(0,0,0,0.3)";
          }}
          onMouseOut={(e) => {
            e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
          }}
        >
          저장하기
        </button>
        
      </div>
      </div>
    </div>
  );
};

export default Editor;
