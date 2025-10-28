// src/pages/ProductEditor.jsx
import React, { useContext, useState, useEffect } from "react";
import { SiteContext } from "../context/SiteContext";
import { db } from "../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from "firebase/firestore";
import storageManager from "../utils/storageManager";
import { handleImageUpload, ImagePreview } from "../utils/imageUpload";
import "./ProductEditor.scss";

const ProductEditor = () => {
  const {
    categories,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    productBadges,
    currentUser,
    saveToFirebase
  } = useContext(SiteContext);

  const [form, setForm] = useState({
    name: "",
    price: "",
    categoryId: "",
    subcategoryId: "",
    description: "",
    image: "",
    subImages: [],
    detailImages: [],
    discountPercent: "",
    salePrice: "",
    options: [],
    badges: [],
    showColorOptions: false,
    colorOptions: [],
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [newOption, setNewOption] = useState({ name: "", values: "" });
  const [newSubImage, setNewSubImage] = useState("");
  const [newDetailImage, setNewDetailImage] = useState("");
  const [newMainImageUrl, setNewMainImageUrl] = useState("");
  const [newColorOption, setNewColorOption] = useState({ name: "", color: "#000000" });
  const [storageConfig, setStorageConfig] = useState(storageManager.getStorageConfig());
  const [saveResults, setSaveResults] = useState([]);

  // 상품 필터링 및 검색 상태
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddProductExpanded, setIsAddProductExpanded] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // currentPage 변경 디버깅
  useEffect(() => {
    console.log('Current page changed to:', currentPage);
  }, [currentPage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let next = { ...form, [name]: value };
    // 자동 계산 로직
    const basePrice = Number(name === 'price' ? value : form.price);
    const percent = Number(name === 'discountPercent' ? value : form.discountPercent);
    const sale = Number(name === 'salePrice' ? value : form.salePrice);
    if (name === 'discountPercent' && basePrice) {
      const computed = Math.round(basePrice * (1 - (Number(value) || 0) / 100));
      next.salePrice = String(computed || "");
    } else if (name === 'salePrice' && basePrice) {
      const computed = basePrice ? Math.round((1 - (Number(value) || 0) / basePrice) * 100) : 0;
      next.discountPercent = String(computed || "");
    } else if (name === 'price') {
      if (form.discountPercent) {
        const computed = Math.round(Number(value) * (1 - Number(form.discountPercent) / 100));
        next.salePrice = String(computed || "");
      } else if (form.salePrice) {
        const computed = Number(value) ? Math.round((1 - Number(form.salePrice) / Number(value)) * 100) : 0;
        next.discountPercent = String(computed || "");
      }
    }
    setForm(next);
  };

  const addOption = () => {
    if (!newOption.name || !newOption.values) return;
    const values = newOption.values.split(',').map(v => v.trim()).filter(v => v);
    if (values.length === 0) return;

    setForm(prev => ({
      ...prev,
      options: [...prev.options, { name: newOption.name, values }]
    }));
    setNewOption({ name: "", values: "" });
  };

  const handleSave = async () => {
    const success = await saveToFirebase();
    if (success) {
      alert("저장 완료!");
    } else {
      alert("저장 실패!");
    }
  };

  const removeOption = (index) => {
    setForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const addSubImage = () => {
    if (!newSubImage.trim()) return;
    setForm(prev => {
      if ((prev.subImages?.length || 0) >= 5) {
        alert("서브 이미지는 최대 5개까지 추가할 수 있습니다.");
        return prev;
      }
      return {
        ...prev,
        subImages: [...prev.subImages, newSubImage.trim()]
      };
    });
    setNewSubImage("");
  };

  const removeSubImage = (index) => {
    setForm(prev => ({
      ...prev,
      subImages: prev.subImages.filter((_, i) => i !== index)
    }));
  };

  const addDetailImage = () => {
    if (!newDetailImage.trim()) return;
    setForm(prev => ({
      ...prev,
      detailImages: [...prev.detailImages, newDetailImage.trim()]
    }));
    setNewDetailImage("");
  };

  const removeDetailImage = (index) => {
    setForm(prev => ({
      ...prev,
      detailImages: prev.detailImages.filter((_, i) => i !== index)
    }));
  };

  const handleAdd = async () => {
    if (!currentUser) {
      alert("로그인 후 상품을 추가할 수 있습니다. 우측 상단에서 로그인해주세요.");
      return;
    }
    if (!form.name || !form.price || !form.categoryId) {
      alert("상품명, 가격, 카테고리를 모두 입력해주세요.");
      return;
    }

    const productData = {
      ...form,
      price: Number(form.price),
      discountPercent: form.discountPercent ? Number(form.discountPercent) : undefined,
      salePrice: form.salePrice ? Number(form.salePrice) : undefined,
      image: form.image || "/image/parcel.png",
      // 소카테고리를 선택했다면 categoryId를 소카테고리 ID로 설정
      categoryId: form.subcategoryId || form.categoryId
    };


    // 로컬 상태에 추가 (이것이 Firebase에 자동 저장됨)
    addProduct(productData);

    // 폼 초기화
    setForm({ name: "", price: "", categoryId: "", subcategoryId: "", description: "", image: "", subImages: [], detailImages: [], discountPercent: "", salePrice: "", options: [], badges: [], showColorOptions: false, colorOptions: [] });

    alert("상품이 성공적으로 추가되었습니다!");
  };

  // 뱃지 체크박스 핸들러
  const handleBadgeChange = (badgeId, checked) => {
    if (checked) {
      setForm(prev => ({
        ...prev,
        badges: [...prev.badges, badgeId]
      }));
    } else {
      setForm(prev => ({
        ...prev,
        badges: prev.badges.filter(id => id !== badgeId)
      }));
    }
  };

  // 색상 옵션 추가
  const addColorOption = () => {
    if (!newColorOption.name.trim()) {
      alert("색상 옵션명을 입력해주세요.");
      return;
    }

    setForm(prev => ({
      ...prev,
      colorOptions: [...prev.colorOptions, { ...newColorOption, id: Date.now().toString() }]
    }));

    setNewColorOption({ name: "", color: "#000000" });
  };

  // 색상 옵션 삭제
  const removeColorOption = (index) => {
    setForm(prev => ({
      ...prev,
      colorOptions: prev.colorOptions.filter((_, i) => i !== index)
    }));
  };

  const handleEdit = (product) => {
    setEditingProduct(product);

    // categoryId가 소카테고리 ID인지 확인
    let parentCategoryId = product.categoryId;
    let subcategoryId = "";

    // 먼저 대카테고리에서 찾기
    const parentCategory = categories.find(cat => cat.id === product.categoryId);

    // 대카테고리에서 찾지 못했다면 소카테고리에서 찾기
    if (!parentCategory) {
      for (const category of categories) {
        if (category.subcategories) {
          const subcategory = category.subcategories.find(sub => sub.id === product.categoryId);
          if (subcategory) {
            parentCategoryId = category.id;
            subcategoryId = product.categoryId;
            break;
          }
        }
      }
    }

    setForm({
      name: product.name,
      price: product.price.toString(),
      categoryId: parentCategoryId,
      subcategoryId: subcategoryId,
      description: product.description || "",
      image: product.image || "",
      subImages: product.subImages || [],
      detailImages: product.detailImages || [],
      discountPercent: product.discountPercent ? product.discountPercent.toString() : "",
      salePrice: product.salePrice ? product.salePrice.toString() : "",
      options: product.options || [],
      badges: product.badges || [],
      showColorOptions: product.showColorOptions || false,
      colorOptions: product.colorOptions || [],
    });
  };

  const handleUpdate = async () => {
    if (!currentUser) {
      alert("로그인 후 상품을 수정할 수 있습니다. 우측 상단에서 로그인해주세요.");
      return;
    }
    if (!editingProduct) return;

    // 카테고리 정보 처리
    let finalCategoryId;

    // 소카테고리를 선택했다면 소카테고리 ID 사용
    if (form.subcategoryId) {
      finalCategoryId = form.subcategoryId;
    }
    // 소카테고리를 선택하지 않았다면 대카테고리 ID 사용
    else if (form.categoryId) {
      finalCategoryId = form.categoryId;
    }
    // 둘 다 없다면 원래 상품의 categoryId 유지
    else {
      finalCategoryId = editingProduct.categoryId;
    }

    const productData = {
      ...form,
      price: Number(form.price),
      discountPercent: form.discountPercent ? Number(form.discountPercent) : undefined,
      salePrice: form.salePrice ? Number(form.salePrice) : undefined,
      image: form.image || "/image/parcel.png",
      categoryId: finalCategoryId
    };

    // 로컬 상태 업데이트 (이것이 Firebase에 자동 저장됨)
    updateProduct(editingProduct.id, productData);

    setEditingProduct(null);
    setForm({ name: "", price: "", categoryId: "", subcategoryId: "", description: "", image: "", subImages: [], detailImages: [], discountPercent: "", salePrice: "", options: [], badges: [] });

    alert("상품이 성공적으로 수정되었습니다!");
  };

  const handleDelete = async (productId) => {
    if (!currentUser) {
      alert("로그인 후 상품을 삭제할 수 있습니다. 우측 상단에서 로그인해주세요.");
      return;
    }
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    // 로컬 상태에서 삭제 (이것이 Firebase에 자동 저장됨)
    deleteProduct(productId);

    alert("상품이 성공적으로 삭제되었습니다!");
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setForm({ name: "", price: "", categoryId: "", subcategoryId: "", description: "", image: "", subImages: [], detailImages: [], discountPercent: "", salePrice: "", options: [], badges: [], showColorOptions: false, colorOptions: [] });
  };

  // 저장소 설정 업데이트
  const updateStorageConfig = (newConfig) => {
    setStorageConfig(newConfig);
    storageManager.setStorageConfig(newConfig);
  };

  // 데이터 동기화
  const handleSyncData = async () => {
    try {
      const results = await storageManager.syncData();
      alert("데이터 동기화가 완료되었습니다.");
      console.log("Sync results:", results);
    } catch (error) {
      alert("동기화 중 오류가 발생했습니다: " + error.message);
    }
  };

  // JSON 파일 가져오기
  const handleImportJSON = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const data = await storageManager.importFromJSON(file);
      alert(`JSON 파일에서 ${data.length}개의 상품을 가져왔습니다.`);
      // 가져온 데이터를 로컬 상태에 추가하는 로직을 여기에 구현할 수 있습니다.
    } catch (error) {
      alert("JSON 파일 가져오기 실패: " + error.message);
    }
  };

  return (
    <>
      <div className="product-editor-wrapper">
        <div className="product-editor-container">
          <h1 className="product-editor-title">상품입력</h1>
        </div>

      {/* 새 상품 추가 섹션 */}
      <div data-tutorial="product-basic-info" className="product-form-section">
        <div className="product-form-header" onClick={() => setIsAddProductExpanded(!isAddProductExpanded)}>
          <h2 className="product-form-title">{editingProduct ? "상품 수정" : "새 상품 추가"}</h2>
          <img 
            src="/icons/right-arrow.png" 
            alt="토글" 
            className={`toggle-icon ${isAddProductExpanded ? 'expanded' : 'collapsed'}`}
          />
        </div>

        {isAddProductExpanded && (
          <>
            {/* 1. 상품명 */}
            <div className="form-group">
              <label className="form-label">
                상품명
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="상품명을 입력하세요"
                className="form-input"
              />
            </div>

            {/* 2. 카테고리 선택 */}
            <div className="form-group">
              <h3 className="section-title">Category</h3>
              <div className="product-category-grid">
                <div>
                  <label className="form-label">
                    대카테고리
                  </label>
                  <select
                    name="categoryId"
                    value={form.categoryId}
                    onChange={(e) => {
                      handleChange(e);
                      setForm(prev => ({ ...prev, subcategoryId: "" })); // 대카테고리 변경 시 소카테고리 초기화
                    }}
                    className="category-select"
                  >
                    <option value="">카테고리를 선택하세요.</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">
                    소카테고리
                  </label>
                  <select
                    name="subcategoryId"
                    value={form.subcategoryId}
                    onChange={handleChange}
                    className="category-select"
                    disabled={!form.categoryId}
                  >
                    <option value="">카테고리를 선택하세요.</option>
                    {form.categoryId && categories.find(c => c.id === form.categoryId)?.subcategories?.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. 상품 옵션 */}
            <div data-tutorial="product-options" className="form-group">
              <h3 className="section-title">Option</h3>
              <div style={{ marginBottom: "10px" }}>
                <label className="form-label">
                  상품 옵션 (색상, 사이즈, 패턴 등)
                </label>
                <div className="option-inputs">
                  <input
                    type="text"
                    placeholder="옵션명 (ex: 색상)"
                    value={newOption.name}
                    onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
                    className="option-name-input"
                  />
                  <input
                    type="text"
                    placeholder="옵션값들 (쉼표로 구분, ex: 빨강,파랑,노랑)"
                    value={newOption.values}
                    onChange={(e) => setNewOption({ ...newOption, values: e.target.value })}
                    className="option-values-input"
                  />
                  <button
                    type="button"
                    onClick={addOption}
                    className="btn-primary"
                  >
                    추가
                  </button>
                </div>
              </div>

              {/* 기존 옵션들 표시 */}
              <div className="existing-options">
                {form.options.map((option, index) => (
                  <div key={index} className="option-item">
                    <span className="option-name">{option.name}:</span>
                    <span className="option-values">{option.values.join(", ")}</span>
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="btn-danger"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 3.5. 색상 옵션 설정 */}
            <div className="form-group">
              <h3 className="section-title">Color Option</h3>

              {/* 색상 옵션 표시 여부 토글 */}
              <div style={{ marginBottom: "15px" }}>
                <label className="color-option-checkbox">
                  <input
                    type="checkbox"
                    checked={form.showColorOptions}
                    onChange={(e) => setForm({ ...form, showColorOptions: e.target.checked })}
                    style={{ margin: 0 }}
                  />
                  <span className="color-option-text">색상옵션 추가하고 상품 카드에 표시하기</span>
                </label>
              </div>

              {/* 색상 옵션 입력 (showColorOptions가 true일 때만 표시) */}
              {form.showColorOptions && (
                <div>
                  <div className="color-option-inputs">
                    <input
                      type="text"
                      placeholder="색상 이름 (ex: 빨강, 파랑, 검정)"
                      value={newColorOption.name}
                      onChange={(e) => setNewColorOption({ ...newColorOption, name: e.target.value })}
                      className="color-name-input"
                    />
                    <input
                      type="text"
                      value={newColorOption.color}
                      onChange={(e) => {
                        let v = e.target.value.trim();
                        if (!v.startsWith('#')) v = `#${v}`;
                        // Allow partial typing; basic sanitize to valid hex chars only
                        v = `#${v.slice(1).replace(/[^0-9a-fA-F]/g, '')}`;
                        setNewColorOption({ ...newColorOption, color: v });
                      }}
                      placeholder="16진수 색상코드를 입력해주십시오."
                      className="color-hex-input"
                      title="HEX 코드 입력"
                    />
                    <input
                      type="color"
                      value={newColorOption.color}
                      onChange={(e) => setNewColorOption({ ...newColorOption, color: e.target.value })}
                      className="color-picker"
                      title="색상 선택"
                    />
                    <button
                      type="button"
                      onClick={addColorOption}
                      className="btn-primary"
                    >
                      추가
                    </button>
                  </div>

                  {/* 기존 색상 옵션들 표시 */}
                  {form.colorOptions.map((colorOption, index) => (
                    <div key={index} className="color-option-item">
                      <div
                        className="color-preview"
                        style={{ backgroundColor: colorOption.color }}
                      ></div>
                      <span className="color-name">{colorOption.name}</span>
                      <span style={{ color: "#666", fontSize: "12px" }}>{colorOption.color}</span>
                      <button
                        type="button"
                        onClick={() => removeColorOption(index)}
                        className="btn-danger"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. 가격 설정 */}
            <div className="form-group">
              <h3 className="section-title">Price</h3>
              <div className="price-grid">
                <div>
                  <label className="form-label">
                    가격
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="가격을 입력하세요"
                    className="price-input"
                  />
                </div>

                <div>
                  <label className="form-label">
                    할인율 (%)
                  </label>
                  <input
                    type="number"
                    name="discountPercent"
                    value={form.discountPercent}
                    onChange={handleChange}
                    placeholder="할인율을 입력하세요"
                    className="price-input"
                  />
                </div>

                <div>
                  <label className="form-label">
                    할인가
                  </label>
                  <input
                    type="number"
                    name="salePrice"
                    value={form.salePrice}
                    onChange={handleChange}
                    placeholder="할인가격을 입력하세요"
                    className="price-input"
                  />
                </div>
              </div>
            </div>

            {/* 5. 상품 설명 */}
            <div className="form-group">
              <h3 className="section-title">상품 설명</h3>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="상품에 대한 자세한 설명을 입력해주세요"
                rows="4"
                className="form-textarea"
              />
            </div>

            {/* 6. 상품 뱃지 선택 */}
            <div className="form-group">
              <h3 className="section-title">상품 뱃지</h3>
              <div className="badge-container">
                {(productBadges || []).map(badge => (
                  <label
                    key={badge.id}
                    className={`badge-item ${form.badges.includes(badge.id) ? 'selected' : ''}`}
                    style={{ borderColor: badge.color, color: badge.color }}
                  >
                    <input
                      type="checkbox"
                      checked={form.badges.includes(badge.id)}
                      onChange={(e) => handleBadgeChange(badge.id, e.target.checked)}
                      className="badge-checkbox"
                    />
                    <span className="badge-text">{badge.name}</span>
                    {badge.isDefault && (
                      <span className="badge-default">(기본)</span>
                    )}
                  </label>
                ))}
                {(productBadges || []).length === 0 && (
                  <p style={{ color: "#666", margin: 0 }}>
                    사용 가능한 뱃지가 없습니다. 웹사이트 에디터에서 뱃지를 먼저 생성해주세요.
                  </p>
                )}
              </div>
            </div>

            {/* 7. 이미지 설정 */}
            <div className="form-group">
              <h3 className="section-title">Image</h3>

              {/* 대표 이미지 */}
              <div style={{ marginBottom: "15px" }}>
                <label className="form-label">
                  대표이미지 (썸네일)
                </label>
                <div className="image-upload-container">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleImageUpload(file, (imageUrl) => {
                          setForm({ ...form, image: imageUrl });
                        });
                      }
                    }}
                    style={{ padding: "8px" }}
                  />
                  <span className="image-upload-divider">또는</span>
                  <input
                    type="text"
                    placeholder="대표이미지 URL을 입력하세요."
                    value={newMainImageUrl}
                    onChange={(e) => setNewMainImageUrl(e.target.value)}
                    className="image-url-input"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newMainImageUrl.trim()) {
                        setForm({ ...form, image: newMainImageUrl.trim() });
                        setNewMainImageUrl("");
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newMainImageUrl.trim()) {
                        setForm({ ...form, image: newMainImageUrl.trim() });
                        setNewMainImageUrl("");
                      }
                    }}
                    className="btn-apply"
                  >
                    적용
                  </button>
                  {form.image && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image: "" })}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      제거
                    </button>
                  )}
                </div>
                {form.image && (
                  <div className="image-preview-container">
                    <ImagePreview
                      src={form.image}
                      alt="대표 이미지 미리보기"
                      className="image-preview"
                    />
                  </div>
                )}
              </div>

              {/* 서브 이미지 관리 (최대 5개) */}
              <div>

                {/* 기존 서브 이미지들 */}
                {form.subImages.map((imageUrl, index) => (
                  <div key={index} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "10px",
                    padding: "10px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "4px"
                  }}>
                    <ImagePreview
                      src={imageUrl}
                      alt={`Sub image ${index + 1}`}
                      style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px" }}
                    />
                    <div style={{
                      display: 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '50px',
                      height: '50px',
                      backgroundColor: '#f8f9fa',
                      color: '#6c757d',
                      fontSize: '20px',
                      borderRadius: '4px'
                    }}>
                      🖼️
                    </div>
                    <span style={{ flex: 1, fontSize: "12px", color: "#6c757d", wordBreak: "break-all" }}>
                      {imageUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubImage(index)}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      삭제
                    </button>
                  </div>
                ))}

                {/* 새 서브 이미지 추가 */}
                <div className="sub-image-section">
                  <label className="sub-image-label">
                    추가이미지 (서브)
                  </label>
                  <div className="sub-image-container">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleImageUpload(file, (imageUrl) => {
                            setForm(prev => {
                              if ((prev.subImages?.length || 0) >= 5) {
                                alert("서브 이미지는 최대 5개까지 추가할 수 있습니다.");
                                return prev;
                              }
                              return { ...prev, subImages: [...prev.subImages, imageUrl] };
                            });
                          });
                        }
                      }}
                      style={{ padding: "8px" }}
                    />
                    <span className="image-upload-divider">
                      또는
                    </span>
                    <input
                      type="text"
                      placeholder="추가이미지 URL을 입력하세요."
                      value={newSubImage}
                      onChange={(e) => setNewSubImage(e.target.value)}
                      className="image-url-input"
                      onKeyPress={(e) => e.key === 'Enter' && addSubImage()}
                    />
                    <button
                      type="button"
                      onClick={addSubImage}
                      className="btn-add"
                    >
                      추가
                    </button>
                    <span className="sub-image-limit">
                      (최대 5개)
                    </span>
                  </div>
                </div>

                {/* 상세설명 이미지 관리 */}
                <div className="detail-image-section">
                  <label className="detail-image-label">
                    상세페이지 이미지
                  </label>
                  {/* 기존 상세설명 이미지들 */}
                  {form.detailImages.map((imageUrl, index) => (
                    <div key={index} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "10px",
                      padding: "10px",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "4px"
                    }}>
                      <ImagePreview
                        src={imageUrl}
                        alt={`Detail image ${index + 1}`}
                        style={{ width: "80px", height: "60px", objectFit: "cover", borderRadius: "4px" }}
                      />
                      <div style={{
                        display: 'none',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '80px',
                        height: '60px',
                        backgroundColor: '#f8f9fa',
                        color: '#6c757d',
                        fontSize: '20px',
                        borderRadius: '4px'
                      }}>
                        🖼️
                      </div>
                      <span style={{ flex: 1, fontSize: "12px", color: "#6c757d", wordBreak: "break-all" }}>
                        {imageUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDetailImage(index)}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "3px",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  ))}

                  {/* 새 상세설명 이미지 추가 */}
                  <div className="detail-image-container">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleImageUpload(file, {
                            pathPrefix: `products/${currentUser?.uid || 'public'}`,
                            compress: true,
                            targetMaxKB: 800,
                            maxWidth: 2000,
                            maxHeight: 2000,
                            jpegQuality: 0.85
                          }, (imageUrl) => {
                            setForm(prev => ({
                              ...prev,
                              detailImages: [...prev.detailImages, imageUrl]
                            }));
                          });
                        }
                      }}
                      style={{ padding: "8px" }}
                    />
                    <span className="image-upload-divider">
                      또는
                    </span>
                    <input
                      type="text"
                      placeholder="상세페이지 이미지 URL을 입력하세요."
                      value={newDetailImage}
                      onChange={(e) => setNewDetailImage(e.target.value)}
                      className="image-url-input"
                      onKeyPress={(e) => e.key === 'Enter' && addDetailImage()}
                    />
                    <button
                      type="button"
                      onClick={addDetailImage}
                      className="btn-add"
                    >
                      추가
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {isAddProductExpanded && (
          <div style={{ marginTop: "15px" }}>
            {editingProduct ? (
              <>
                <button
                  onClick={handleUpdate}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    marginRight: "10px"
                  }}
                >
                  수정 완료
                </button>
                <button
                  onClick={cancelEdit}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  취소
                </button>
              </>
            ) : (
              <button
                onClick={handleAdd}
                className="btn-submit"
              >
                추가
              </button>
            )}
          </div>
        )}
      </div>

        {/* 상품 관리 섹션 */}
        <h1 className="product-management-main-title">상품 관리</h1>
        
        <div
          data-tutorial="product-management"
          className="product-management-section"
        >
        <h2 className="product-management-subtitle">등록상품 관리 ({products.length}개)</h2>

        {/* 필터링 및 검색 */}
        <div className="pe-filter-container">
          {/* 검색창 */}
          <div className="pe-search-container">
            <input
              type="text"
              placeholder="상품명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pe-search-input"
            />
          </div>

          {/* 카테고리 필터 */}
          <div className="pe-filter-select-container">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory(""); // 카테고리 변경 시 소카테고리 초기화
              }}
              className="pe-filter-select"
            >
              <option value="">전체 카테고리</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* 소카테고리 필터 */}
          <div className="pe-filter-select-container">
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              disabled={!selectedCategory}
              className={`pe-filter-select ${!selectedCategory ? 'pe-disabled' : ''}`}
            >
              <option value="">전체</option>
              {selectedCategory && categories
                .find(c => c.id === selectedCategory)
                ?.subcategories?.map(subcategory => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
            </select>
          </div>

          {/* 필터 초기화 */}
          <button
            onClick={() => {
              setSelectedCategory("");
              setSelectedSubcategory("");
              setSearchQuery("");
            }}
            className="pe-reset-button"
          >
            초기화
          </button>
        </div>

        {(() => {
          // 필터링된 상품 목록 계산
          let filteredProducts = products || [];

          console.log('Products:', products);
          console.log('Categories:', categories);
          console.log('Selected Category:', selectedCategory);
          console.log('Selected Subcategory:', selectedSubcategory);
          console.log('Search Query:', searchQuery);
          console.log('Current Page:', currentPage);

          // 검색어 필터링
          if (searchQuery.trim()) {
            filteredProducts = filteredProducts.filter(product =>
              product.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }

          // 필터링이 변경될 때 페이지를 1로 리셋
          if (searchQuery || selectedCategory || selectedSubcategory) {
            if (currentPage !== 1) {
              setCurrentPage(1);
            }
          }

          // 카테고리 필터링
          if (selectedCategory) {
            filteredProducts = filteredProducts.filter(product => {
              // product.categoryId가 대카테고리 ID인지 소카테고리 ID인지 확인
              const isMainCategory = categories.some(cat => cat.id === product.categoryId);
              const isSubCategory = categories.some(cat => 
                cat.subcategories && cat.subcategories.some(sub => sub.id === product.categoryId)
              );
              
              if (isMainCategory) {
                // product.categoryId가 대카테고리 ID인 경우
                return product.categoryId === selectedCategory;
              } else if (isSubCategory) {
                // product.categoryId가 소카테고리 ID인 경우, 부모 카테고리 확인
                const parentCategory = categories.find(cat => 
                  cat.subcategories && cat.subcategories.some(sub => sub.id === product.categoryId)
                );
                return parentCategory && parentCategory.id === selectedCategory;
              }
              return false;
            });
          }

          // 소카테고리 필터링
          if (selectedSubcategory) {
            filteredProducts = filteredProducts.filter(product =>
              product.categoryId === selectedSubcategory
            );
          }

          console.log('Filtered Products:', filteredProducts);

          return filteredProducts.length === 0 ? (
            <p className="pe-no-products-message">
              {products.length === 0
                ? "등록된 상품이 없습니다. 위에서 상품을 추가해보세요."
                : "검색 조건에 맞는 상품이 없습니다."
              }
            </p>
          ) : (
            <div>
              {/* 필터링 결과 정보 */}
              <div className="pe-filter-info">
                총 {filteredProducts.length}개의 상품이 표시됩니다
                {(searchQuery || selectedCategory || selectedSubcategory) &&
                  ` (전체 ${products.length}개 중)`
                }
              </div>

              <div className="pe-products-grid">
                {filteredProducts
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((product) => {
                    const category = categories.find(c => c.id === product.categoryId);
                    return (
                      <div key={product.id} className="pe-product-card">
                        <div className="pe-product-header">
                          <h3 className="pe-product-title">{product.name}</h3>
                          <div className="pe-product-actions">
                            <button
                              onClick={() => handleEdit(product)}
                              className="pe-edit-button"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="pe-delete-button"
                            >
                              삭제
                            </button>
                          </div>
                        </div>

                        <div className="pe-product-price">
                          <p className="pe-original-price">
                            원가: {product.price.toLocaleString()}원
                          </p>
                          {product.discountPercent && product.discountPercent > 0 && (
                            <p className="pe-discount-percent">
                              할인율: {product.discountPercent}%
                            </p>
                          )}
                          {product.salePrice && product.salePrice > 0 && (
                            <p className="pe-sale-price">
                              할인가: {product.salePrice.toLocaleString()}원
                            </p>
                          )}
                        </div>

                        <p className="pe-product-category">
                          {(() => {
                            // categoryId가 소카테고리 ID인지 확인
                            let parentCategory = category;
                            let subcategory = null;

                            // 먼저 대카테고리에서 찾기
                            if (category && category.id === product.categoryId) {
                              // 대카테고리인 경우
                              return `카테고리: ${category.name} > -`;
                            } else {
                              // 소카테고리인지 확인
                              for (const cat of categories) {
                                if (cat.subcategories) {
                                  const sub = cat.subcategories.find(sub => sub.id === product.categoryId);
                                  if (sub) {
                                    parentCategory = cat;
                                    subcategory = sub;
                                    break;
                                  }
                                }
                              }

                              if (subcategory) {
                                return `카테고리: ${parentCategory.name} > ${subcategory.name}`;
                              } else {
                                return `카테고리: ${category?.name || "미분류"} > -`;
                              }
                            }
                          })()}
                        </p>

                        {product.description && (
                          <p className="pe-product-description">
                            {product.description}
                          </p>
                        )}

                        {product.image && (
                          <div className="pe-product-image-container">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="pe-product-image"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* 페이지네이션 */}
              {filteredProducts.length > itemsPerPage && (
                <div className="pe-pagination">
                  <button
                    onClick={() => {
                      const newPage = Math.max(currentPage - 1, 1);
                      console.log('Previous button clicked, new page:', newPage);
                      setCurrentPage(newPage);
                    }}
                    disabled={currentPage === 1}
                    className={`pe-pagination-button ${currentPage === 1 ? 'pe-disabled' : ''}`}
                  >
                    이전
                  </button>

                  {Array.from({ length: Math.ceil(filteredProducts.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => {
                        console.log('Page button clicked, page:', page);
                        setCurrentPage(page);
                      }}
                      className={`pe-pagination-button ${currentPage === page ? 'pe-active' : ''}`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      const maxPage = Math.ceil(filteredProducts.length / itemsPerPage);
                      const newPage = Math.min(currentPage + 1, maxPage);
                      console.log('Next button clicked, new page:', newPage, 'max page:', maxPage);
                      setCurrentPage(newPage);
                    }}
                    disabled={currentPage === Math.ceil(filteredProducts.length / itemsPerPage)}
                    className={`pe-pagination-button ${currentPage === Math.ceil(filteredProducts.length / itemsPerPage) ? 'pe-disabled' : ''}`}
                  >
                    다음
                  </button>
                </div>
              )}
            </div>
          );
        })()}

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
          💾 저장하기
        </button>
      </div>
      </div>

      {/* 저장소 설정 */}
      <div data-tutorial="storage-options" className="storage-section" style={{ display: 'none' }}>
        <h3 className="storage-title">저장소 설정</h3>
        <div className="storage-grid">
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>주 저장소:</label>
            <select
              value={storageConfig.primary}
              onChange={(e) => updateStorageConfig({ ...storageConfig, primary: e.target.value })}
              className="storage-select"
            >
              <option value="firebase">Firebase Firestore</option>
              <option value="local">Local Storage</option>
              <option value="json">JSON 파일</option>
              <option value="memory">메모리 (임시)</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>백업 저장소:</label>
            <select
              value={storageConfig.backup || ""}
              onChange={(e) => updateStorageConfig({ ...storageConfig, backup: e.target.value || null })}
              className="storage-select"
            >
              <option value="">백업 없음</option>
              <option value="firebase">Firebase Firestore</option>
              <option value="local">Local Storage</option>
              <option value="json">JSON 파일</option>
              <option value="memory">메모리 (임시)</option>
            </select>
          </div>
        </div>
        <div className="storage-buttons">
          <button
            onClick={handleSyncData}
            className="btn-sync"
          >
            데이터 동기화
          </button>
          <label className="btn-import">
            JSON 가져오기
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              style={{ display: "none" }}
            />
          </label>
        </div>

  {/* 저장 결과 표시 */ }
  {
    saveResults.length > 0 && (
      <div className="storage-results">
        <strong>최근 저장 결과:</strong>
        {saveResults.map((result, index) => (
          <div key={index} className={`storage-result-item ${result.success ? 'success' : 'error'}`}>
            {storageManager.storageTypes[result.storage]}: {result.success ? "성공" : result.error}
          </div>
        ))}
      </div>
    )
  }
      </div>

        {/* 하단 여백 */}
        <div className="bottom-spacer"></div>
      </div>
    </>
  );
};

export default ProductEditor;
