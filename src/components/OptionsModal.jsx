import React, { useEffect, useMemo, useState } from "react";

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  zIndex: 1000,
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};

const modalStyle = {
  backgroundColor: "#fff",
  padding: "24px",
  borderRadius: "12px",
  width: "92%",
  maxWidth: "520px",
  maxHeight: "80vh",
  overflow: "auto",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 16
};

const sectionStyle = { marginBottom: 16 };

const labelStyle = { display: "block", fontWeight: 600, marginBottom: 8 };

const selectStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ddd",
  borderRadius: 8,
  background: "#fff"
};

const qtyWrapStyle = { display: "flex", alignItems: "center", gap: 8 };

const qtyBtnStyle = {
  width: 36,
  height: 36,
  borderRadius: 8,
  border: "1px solid #ddd",
  background: "#f8f9fa",
  cursor: "pointer",
  fontSize: 18,
  lineHeight: "34px",
  textAlign: "center"
};

const qtyInputStyle = {
  width: 70,
  textAlign: "center",
  padding: "8px 10px",
  border: "1px solid #ddd",
  borderRadius: 8
};

const footerStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 12
};

const primaryBtnStyle = {
  background: "#000EA9",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: 600
};

const secondaryBtnStyle = {
  background: "#6c757d",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: 500
};

function OptionsModal({ product, onConfirm, onCancel }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    setQuantity(1);
    setSelectedOptions({});
    setSelectedColorId(null);
  }, [product?.id]);

  const requiresColor = Boolean(product?.showColorOptions && product?.colorOptions?.length);
  // 일반 옵션에서 '색상/컬러/color/colour'로 해석되는 옵션은 색상 모달이 있을 때 숨김
  const colorKeywordRegex = /^(색상|컬러|color|colour)$/i;
  const displayedOptions = useMemo(() => {
    const opts = Array.isArray(product?.options) ? product.options : [];
    if (!requiresColor) return opts;
    return opts.filter((opt) => !colorKeywordRegex.test(String(opt?.name || '').trim()))
  }, [product?.options, requiresColor]);
  const requiresOptions = Boolean(displayedOptions && displayedOptions.length);

  const allSelected = useMemo(() => {
    if (!product) return false;
    if (requiresColor && !selectedColorId) return false;
    if (requiresOptions) {
      return displayedOptions.every((opt) => !!selectedOptions[opt.name]);
    }
    return true;
  }, [product, requiresColor, requiresOptions, selectedColorId, selectedOptions, displayedOptions]);

  const handleIncrease = () => setQuantity((q) => Math.max(1, q + 1));
  const handleDecrease = () => setQuantity((q) => Math.max(1, q - 1));

  const handleSelectChange = (name, value) => {
    setSelectedOptions((prev) => ({ ...prev, [name]: value }));
    setValidationError("");
  };

  const handleConfirm = () => {
    if (!allSelected) {
      setValidationError("모든 옵션을 선택해주세요.");
      return;
    }
    const options = { ...selectedOptions };
    if (requiresColor) {
      const colorObj = product.colorOptions.find((c) => c.id === selectedColorId);
      if (colorObj) options.color = colorObj.name || colorObj.id;
    }
    onConfirm({ quantity, options });
  };

  if (!product) return null;

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: 18 }}>{product.name}</h3>
          <button onClick={onCancel} style={{ background: "transparent", border: 0, fontSize: 20, cursor: "pointer" }}>×</button>
        </div>

        {requiresColor && (
          <div style={sectionStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>색상</label>
              <span style={{ fontSize: 13, color: "#555" }}>
                {selectedColorId
                  ? (product.colorOptions.find((c) => c.id === selectedColorId)?.name || "")
                  : "미선택"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {product.colorOptions.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedColorId(c.id)}
                  title={c.name}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    border: selectedColorId === c.id ? "2px solid #000EA9" : "1px solid #ccc",
                    background: c.color,
                    cursor: "pointer"
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {requiresOptions && (
          <div style={sectionStyle}>
            {displayedOptions.map((opt, idx) => (
              <div key={idx} style={{ marginBottom: 12 }}>
                <label style={labelStyle}>{opt.name}</label>
                <select
                  value={selectedOptions[opt.name] || ""}
                  onChange={(e) => handleSelectChange(opt.name, e.target.value)}
                  style={selectStyle}
                >
                  <option value="">선택하세요</option>
                  {opt.values.map((v, i) => (
                    <option key={i} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        <div style={sectionStyle}>
          <label style={labelStyle}>수량</label>
          <div style={qtyWrapStyle}>
            <button type="button" onClick={handleDecrease} style={qtyBtnStyle}>-</button>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              style={qtyInputStyle}
            />
            <button type="button" onClick={handleIncrease} style={qtyBtnStyle}>+</button>
          </div>
        </div>

        {validationError && (
          <div style={{ color: "#dc3545", fontSize: 13, margin: "4px 0 8px", textAlign: "right" }}>
            {validationError}
          </div>
        )}

        <div style={footerStyle}>
          <button onClick={onCancel} style={secondaryBtnStyle}>취소</button>
          <button onClick={handleConfirm} style={primaryBtnStyle}>
            장바구니 담기
          </button>
        </div>
      </div>
    </div>
  );
}

export default OptionsModal;


