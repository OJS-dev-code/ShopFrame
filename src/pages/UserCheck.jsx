import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { SiteContext } from '../context/SiteContext';
import KakaoLogin from '../components/KakaoLogin';

const UserCheck = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, signOutUser, signInWithEmail, isKakaoLoggingIn } = useContext(SiteContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [secureConnection, setSecureConnection] = useState(true);

  // 현재 경로가 사이트별 웹사이트인지 확인
  const isSiteRoute = location.pathname.startsWith('/site/');
  const siteName = isSiteRoute ? location.pathname.split('/')[2] : null;

  useEffect(() => {
    // 페이지 로드 시 잠시 로딩 표시
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) {
      setError("아이디와 패스워드를 입력하세요.");
      return;
    }
    try {
      setLoading(true);
      await signInWithEmail(form.email, form.password, siteName);
      
      // 사이트별 웹사이트에서 로그인한 경우 해당 사이트로, 관리자 로그인인 경우 에디터로 이동
      if (isSiteRoute && siteName) {
        navigate(`/site/${siteName}`);
      } else {
        navigate("/editor"); // 관리자 로그인 후 에디터로 이동
      }
    } catch (err) {
      setError(err.message || "로그인 실패");
    } finally {
      setLoading(false);
    }
  };

  // 카카오 로그인 진행 중일 때 로딩 화면 표시
  if (isKakaoLoggingIn) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #FEE500',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2 style={{ color: '#333', marginBottom: '10px' }}>카카오 로그인 진행 중</h2>
          <p style={{ color: '#666' }}>잠시만 기다려주세요...</p>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2 style={{ color: '#333', marginBottom: '10px' }}>웹사이트 빌더</h2>
          <p style={{ color: '#666' }}>로딩 중...</p>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (currentUser) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8f9fa',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '90%'
        }}>
          <h1 style={{ 
            color: '#333', 
            marginBottom: '20px',
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            이미 로그인되어 있습니다!
          </h1>
          
          <p style={{ 
            color: '#666', 
            marginBottom: '30px',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            웹사이트 에디터로 이동하시거나 로그아웃하실 수 있습니다.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button
              onClick={() => navigate('/editor')}
              style={{
                padding: '15px 30px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.3s',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
            >
              🏠 웹사이트 에디터로 이동
            </button>

            <button
              onClick={async () => {
                try {
                  await signOutUser();
                  alert("로그아웃되었습니다");
                } catch (error) {
                  console.error('로그아웃 실패:', error);
                  alert("로그아웃 실패: " + error.message);
                }
              }}
              style={{
                padding: '15px 30px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.3s',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
            >
              🚪 로그아웃
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
       <div style={{
         backgroundColor: 'white',
         borderRadius: '12px',
         boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
         maxWidth: '1200px',
         width: '100%',
         padding: '60px'
       }}>
         {/* 상단 환영 메시지 */}
         <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ 
            color: '#333', 
            marginBottom: '30px',
            fontSize: '36px',
            fontWeight: 'bold'
          }}>
            {isSiteRoute ? '로그인' : 'Shop Frame에 오신 것을 환영합니다!'}
          </h1>
          <p style={{ 
            color: '#888888', 
            fontSize: '24px',
            margin: '0'
          }}>
            {isSiteRoute ? '로그인하여 서비스를 이용해보세요.' : '서비스를 이용하시려면 먼저 계정이 필요합니다.'}
          </p>
         </div>

         {/* 로그인 헤더 */}
         <div style={{ textAlign: 'center', marginBottom: '30px' }}>
           <div
             style={{
               width: '210px',
               padding: '12px',
               backgroundColor: '#000000',
               color: 'white',
               border: 'none',
               borderRadius: '12px',
               fontSize: '16px',
               fontWeight: '500',
               margin: '0 auto',
               textAlign: 'center'
             }}
           >
             {isSiteRoute ? '로그인' : '관리자 계정 로그인'}
           </div>
         </div>

         {/* 로그인 폼 */}
         <form onSubmit={handleSubmit} style={{ textAlign: 'center' }}>
           <div style={{ marginBottom: '20px' }}>
             <input 
               name="email" 
               type="email" 
               value={form.email} 
               onChange={handleChange} 
               onFocus={(e) => e.target.style.borderBottomColor = '#000000'}
               onBlur={(e) => e.target.style.borderBottomColor = '#D9D9D9'}
               style={{ 
                 maxWidth: '600px',
                 width: '100%', 
                 padding: '12px 0', 
                 border: 'none',
                 borderBottom: '1px solid #D9D9D9',
                 borderRadius: '0px',
                 fontSize: '16px',
                 boxSizing: 'border-box',
                 outline: 'none',
                 backgroundColor: 'transparent'
               }} 
               placeholder="이메일"
             />
           </div>
           
           <div style={{ marginBottom: '20px' }}>
             <input 
               name="password" 
               type="password" 
               value={form.password} 
               onChange={handleChange} 
               onFocus={(e) => e.target.style.borderBottomColor = '#000000'}
               onBlur={(e) => e.target.style.borderBottomColor = '#D9D9D9'}
               style={{ 
                 maxWidth: '600px',
                 width: '100%', 
                 padding: '12px 0', 
                 border: 'none',
                 borderBottom: '1px solid #D9D9D9',
                 borderRadius: '0px',
                 fontSize: '16px',
                 boxSizing: 'border-box',
                 outline: 'none',
                 backgroundColor: 'transparent'
               }} 
               placeholder="패스워드"
             />
           </div>

           {/* 보안접속 토글 */}
           <div style={{ 
             display: 'flex', 
             alignItems: 'center', 
             justifyContent: 'center',
             marginBottom: '20px'
           }}>
             <div style={{ 
               display: 'flex', 
               alignItems: 'center', 
               gap: '8px',
               maxWidth: '600px',
               width: '100%',
               justifyContent: 'flex-start'
             }}>
             <div
               onClick={() => setSecureConnection(!secureConnection)}
               style={{
                 width: '26px',
                 height: '16px',
                 backgroundColor: secureConnection ? '#dc3545' : '#ccc',
                 borderRadius: '8px',
                 position: 'relative',
                 cursor: 'pointer',
                 transition: 'background-color 0.3s ease'
               }}
             >
               <div
                 style={{
                   width: '12px',
                   height: '12px',
                   backgroundColor: 'white',
                   borderRadius: '50%',
                   position: 'absolute',
                   top: '2px',
                   left: secureConnection ? '12px' : '2px',
                   transition: 'left 0.3s ease',
                   boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                 }}
               />
             </div>
             <label 
               style={{ 
                 color: '#333',
                 fontSize: '14px',
                 cursor: 'pointer'
               }}
               onClick={() => setSecureConnection(!secureConnection)}
             >
               보안접속
             </label>
             </div>
           </div>

           {error && (
             <div style={{ 
               color: '#dc3545', 
               marginBottom: '20px', 
               fontSize: '16px',
               textAlign: 'center'
             }}>
               {error}
             </div>
           )}

           <button 
             type="submit" 
             disabled={loading} 
             style={{ 
               maxWidth: '600px',
               width: '100%', 
               padding: '12px', 
               background: '#1D1D1F', 
               color: '#fff', 
               border: 'none', 
               borderRadius: '0px', 
               cursor: loading ? 'not-allowed' : 'pointer',
               fontSize: '16px',
               fontWeight: '500',
               opacity: loading ? 0.7 : 1
             }}
           >
             {loading ? "로그인 중..." : "로그인"}
           </button>
         </form>
         
         {/* 하단 링크들 */}
         <div style={{ 
           marginTop: '30px', 
           textAlign: 'center'
         }}>
           <div style={{ 
             display: 'flex', 
             justifyContent: 'center', 
             alignItems: 'center',
             gap: '10px',
             fontSize: '16px',
             marginBottom: '20px'
           }}>
             <button
               onClick={() => alert('아직 개발중인 기능입니다.')}
               style={{ 
                 color: '#D9D9D9', 
                 textDecoration: 'none',
                 background: 'none',
                 border: 'none',
                 cursor: 'pointer',
                 fontSize: '16px'
               }}
             >
               아이디찾기
             </button>
             <span style={{ color: '#D9D9D9' }}>|</span>
             <button
               onClick={() => alert('아직 개발중인 기능입니다.')}
               style={{ 
                 color: '#D9D9D9', 
                 textDecoration: 'none',
                 background: 'none',
                 border: 'none',
                 cursor: 'pointer',
                 fontSize: '16px'
               }}
             >
               비밀번호찾기
             </button>
             <span style={{ color: '#D9D9D9' }}>|</span>
             <button
               onClick={() => {
                 if (isSiteRoute && siteName) {
                   navigate(`/site/${siteName}/signup`);
                 } else {
                   navigate('/signup');
                 }
               }}
               style={{ 
                 color: '#333333', 
                 textDecoration: 'none',
                 background: 'none',
                 border: 'none',
                 cursor: 'pointer',
                 fontSize: '16px'
               }}
             >
               회원가입
             </button>
           </div>
           
           {/* 카카오 로그인 버튼 */}
           {!isSiteRoute && (
             <div style={{ 
               display: 'flex', 
               justifyContent: 'center', 
               alignItems: 'center',
               marginTop: '10px'
             }}>
               <KakaoLogin />
             </div>
           )}
         </div>
       </div>
    </div>
  );
};

export default UserCheck;
