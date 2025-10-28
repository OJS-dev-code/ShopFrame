import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SiteContext } from '../context/SiteContext';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import './MypageWithdrawal.scss';

const MypageWithdrawal = () => {
  const context = useContext(SiteContext);
  const currentUser = context?.currentUser;
  const navigate = useNavigate();
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const withdrawalConditions = [
    '이용약관 동의 철회 시 회원 개인정보 및 고객님께서 보유하셨던 쿠폰은 모두 삭제되며, 쿠폰 정보는 재가입시 복원이 불가능합니다.',
    '이용약관 동의 철회 시에는 서비스만 이용할 수 없게 되며 웹사이트를 포함한 제휴 브랜드의 웹사이트 이용도 불가능 하십니다.',
    '이용약관 동의를 철회한 후에라도 해당 약관에 다시 동의하시면 서비스를 이용할 수 있습니다.',
    '진행 중인 전자상거래 이용내역(결제/배송/교환/반품 중인 상태)이 있거나 고객상담 및 이용하신 서비스가 완료되지 않은 경우 서비스 철회 하실 수 없습니다.',
    '이용약관 동의 철회 시 고객님께서 보유하셨던 카드 리워드는 모두 소멸되며, 재동의 시에도 복원은 불가합니다.'
  ];

  const handleWithdrawalClick = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 비밀번호 확인
      await signInWithEmailAndPassword(auth, currentUser.email, password);
      setShowPasswordModal(false);
      setShowConfirmModal(true);
    } catch (error) {
      setError('비밀번호가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalWithdrawal = async () => {
    setIsLoading(true);
    setError('');

    try {
      // 사용자 관련 데이터 삭제
      await deleteUserData(currentUser.uid);
      
      // Firebase Auth에서 사용자 삭제
      await deleteUser(currentUser);
      
      // 로그인 페이지로 리다이렉트
      navigate('/');
    } catch (error) {
      setError('회원탈퇴 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUserData = async (userId) => {
    try {
      // 장바구니 데이터 삭제
      const cartQuery = query(collection(db, 'carts'), where('userId', '==', userId));
      const cartSnapshot = await getDocs(cartQuery);
      const cartPromises = cartSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(cartPromises);

      // 좋아요 데이터 삭제
      const likesQuery = query(collection(db, 'likes'), where('userId', '==', userId));
      const likesSnapshot = await getDocs(likesQuery);
      const likesPromises = likesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(likesPromises);

      // 사용자 정보 삭제
      const userDocRef = doc(db, 'siteUsers', userId);
      await deleteDoc(userDocRef);

      // 주문 내역 삭제 (있는 경우)
      const ordersQuery = query(collection(db, 'orders'), where('userId', '==', userId));
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersPromises = ordersSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(ordersPromises);

      // 리뷰 삭제 (있는 경우)
      const reviewsQuery = query(collection(db, 'reviews'), where('userId', '==', userId));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsPromises = reviewsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(reviewsPromises);

    } catch (error) {
      console.error('사용자 데이터 삭제 중 오류:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    setShowPasswordModal(false);
    setShowConfirmModal(false);
    setPassword('');
    setError('');
  };

  return (
    <div className="withdrawal-page">
      <div className="withdrawal-section">
        <h2>회원 탈퇴</h2>
        
        <div className="instruction">
          <p>회원 탈퇴(이용약관 동의 철회)시 아래 내용을 확인해주세요.</p>
        </div>

        <div className="conditions-box">
          <ul className="conditions-list">
            {withdrawalConditions.map((condition, index) => (
              <li key={index} className="condition-item">
                {condition}
              </li>
            ))}
          </ul>
        </div>

        <div className="confirmation">
          <p>회원 탈퇴(이용약관 동의 철회)를 하시겠습니까?</p>
          <button className="withdrawal-btn" onClick={handleWithdrawalClick}>
            회원탈퇴
          </button>
        </div>
      </div>

      {/* 비밀번호 확인 모달 */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>비밀번호 확인</h3>
            <p>회원탈퇴를 위해 비밀번호를 입력해주세요.</p>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
              />
              {error && <div className="error-message">{error}</div>}
              <div className="modal-actions">
                <button type="button" onClick={handleCancel} disabled={isLoading}>
                  취소
                </button>
                <button type="submit" disabled={isLoading}>
                  {isLoading ? '확인 중...' : '확인'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 최종 확인 모달 */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>회원탈퇴 최종 확인</h3>
            <p>정말로 탈퇴하시겠습니까?</p>
            <p className="warning-text">
              탈퇴 시 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
            </p>
            {error && <div className="error-message">{error}</div>}
            <div className="modal-actions">
              <button type="button" onClick={handleCancel} disabled={isLoading}>
                취소
              </button>
              <button onClick={handleFinalWithdrawal} disabled={isLoading} className="danger-btn">
                {isLoading ? '처리 중...' : '예, 탈퇴합니다'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MypageWithdrawal;
