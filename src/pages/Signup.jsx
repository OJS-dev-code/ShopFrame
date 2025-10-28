import React, { useContext, useMemo, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { SiteContext } from "../context/SiteContext";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import "./Signup.scss";

const Signup = () => {
  const { signUpWithEmail, currentUser } = useContext(SiteContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", confirm: "", name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) {
      setError("이메일과 비밀번호를 입력하세요.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    try {
      setLoading(true);
      const user = await signUpWithEmail(form.email, form.password);
      // 관리자 프로필 저장 (Firebase Firestore)
      const profile = { 
        email: form.email, 
        name: form.name,
        phone: form.phone,
        role: "admin",
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "adminUsers", user.uid), profile, { merge: true });
      
      // 회원가입 완료 후 로그인 페이지로 이동
      navigate("/", { state: { fromSignup: true } });
    } catch (err) {
      setError(err.message || "회원가입 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      navigate("/editor");
    }
  }, [currentUser, navigate]);

  return (
    <div className="admin-signup-container">
      <div className="admin-signup-wrapper">
        {/* 상단 제목 */}
        <div className="admin-title-section">
          <div className="admin-signup-header">
            관리자 회원가입
          </div>
        </div>

        {/* 회원가입 폼 */}
        <form onSubmit={handleSubmit} className="admin-signup-form">
          <div className="admin-form-group">
            <label className="admin-form-label">
              이메일
            </label>
            <input 
              name="email" 
              type="email" 
              value={form.email} 
              onChange={handleChange} 
              className="admin-form-input"
              placeholder="이메일을 입력하세요"
            />
          </div>
          
          <div className="admin-form-group">
            <label className="admin-form-label">
              이름
            </label>
            <input 
              name="name" 
              type="text" 
              value={form.name} 
              onChange={handleChange} 
              className="admin-form-input"
              placeholder="이름을 입력하세요"
            />
          </div>
          
          <div className="admin-form-group">
            <label className="admin-form-label">
              전화번호
            </label>
            <input 
              name="phone" 
              type="tel" 
              value={form.phone} 
              onChange={handleChange} 
              className="admin-form-input"
              placeholder="전화번호를 입력하세요"
            />
          </div>
          
          <div className="admin-form-group">
            <label className="admin-form-label">
              비밀번호
            </label>
            <input 
              name="password" 
              type="password" 
              value={form.password} 
              onChange={handleChange} 
              className="admin-form-input"
              placeholder="비밀번호를 입력하세요"
            />
          </div>
          
          <div className="admin-form-group">
            <label className="admin-form-label">
              비밀번호 확인
            </label>
            <input 
              name="confirm" 
              type="password" 
              value={form.confirm} 
              onChange={handleChange} 
              className="admin-form-input"
              placeholder="비밀번호를 다시 입력하세요"
            />
          </div>

          {error && (
            <div className="admin-error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="admin-submit-button"
          >
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>
        
        {/* 하단 링크 */}
        <div className="admin-bottom-section">
          <div className="admin-divider-line"></div>
          <div className="admin-bottom-links">
            <span className="admin-bottom-text">이미 계정이 있으신가요?</span>
            <button
              onClick={() => navigate('/')}
              className="admin-login-link"
            >
              관리자 로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;


