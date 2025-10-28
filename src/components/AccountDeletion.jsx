import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SiteContext } from '../context/SiteContext';
import { auth, db, storage } from '../firebase';
import { 
  deleteUser, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc,
  getDoc
} from 'firebase/firestore';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { getCurrentSiteName } from '../utils/siteUserManager';
import './AccountDeletion.scss';

function AccountDeletion() {
  const navigate = useNavigate();
  const { currentUser, siteData } = useContext(SiteContext);
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  // 관리자 데이터 삭제 함수
  const deleteAdminData = async (userId) => {
    try {
      console.log('관리자 데이터 삭제 시작:', userId);

      // 1. Firestore에서 관리자 관련 데이터 삭제
      const adminCollections = [
        'siteData',
        'sliderImages',
        'products',
        'categories',
        'orders',
        'users',
        'adminUsers'
      ];

      for (const collectionName of adminCollections) {
        try {
          // siteData, sliderImages, adminUsers는 userId로 직접 삭제
          if (collectionName === 'siteData' || collectionName === 'sliderImages' || collectionName === 'adminUsers') {
            const docRef = doc(db, collectionName, userId);
            await deleteDoc(docRef);
            console.log(`${collectionName} 문서 삭제 완료:`, userId);
          } else {
            // 다른 컬렉션은 userId 필드로 검색하여 삭제
            const q = query(collection(db, collectionName), where('userId', '==', userId));
            const querySnapshot = await getDocs(q);
            
            for (const docSnapshot of querySnapshot.docs) {
              await deleteDoc(doc(db, collectionName, docSnapshot.id));
              console.log(`${collectionName}에서 문서 삭제:`, docSnapshot.id);
            }
          }
        } catch (error) {
          console.error(`${collectionName} 삭제 중 오류:`, error);
        }
      }

      // 2. 사이트별 사용자 데이터 삭제 (관리자가 만든 사이트의 사용자들)
      try {
        // 모든 사이트별 사용자 컬렉션에서 해당 관리자의 사이트 사용자들 삭제
        const siteDataRef = doc(db, 'siteData', userId);
        const siteDataDoc = await getDoc(siteDataRef);
        
        if (siteDataDoc.exists()) {
          const siteData = siteDataDoc.data();
          const siteName = siteData.siteEnglishName;
          
          if (siteName) {
            // 해당 사이트의 모든 사용자 데이터 삭제
            const siteUsersRef = collection(db, `users_${siteName}`);
            const siteUsersSnapshot = await getDocs(siteUsersRef);
            
            for (const userDoc of siteUsersSnapshot.docs) {
              await deleteDoc(doc(db, `users_${siteName}`, userDoc.id));
              console.log(`사이트 ${siteName}의 사용자 데이터 삭제:`, userDoc.id);
            }
          }
        }
      } catch (error) {
        console.error('사이트별 사용자 데이터 삭제 중 오류:', error);
      }

      // 3. 모든 Storage 폴더에서 사용자 관련 파일 삭제
      try {
        // 모든 가능한 Storage 경로에서 파일 삭제
        const storagePaths = [
          `admin/${userId}`,
          `sites/${userId}`,
          `users/${userId}`,
          `images/${userId}`,
          `uploads/${userId}`,
          `products/${userId}`,
          `sliders/${userId}`,
          `categories/${userId}`
        ];

        for (const path of storagePaths) {
          try {
            const storageRef = ref(storage, path);
            const listResult = await listAll(storageRef);
            
            // 모든 파일 삭제
            const deletePromises = listResult.items.map(itemRef => deleteObject(itemRef));
            await Promise.all(deletePromises);
            
            console.log(`Storage 경로 ${path}에서 파일 삭제 완료`);
          } catch (error) {
            console.log(`Storage 경로 ${path} 삭제 중 오류 (폴더가 없을 수 있음):`, error.message);
          }
        }

        // 4. 모든 컬렉션에서 해당 사용자와 관련된 문서들 재검색 및 삭제
        const allCollections = [
          'users',
          'orders', 
          'cart',
          'favorites',
          'reviews',
          'products',
          'categories',
          'siteData',
          'sliderImages'
        ];

        for (const collectionName of allCollections) {
          try {
            // 여러 필드로 검색하여 누락된 데이터 찾기
            const searchFields = ['userId', 'adminId', 'ownerId', 'createdBy', 'authorId', 'managerId'];
            
            for (const field of searchFields) {
              const q = query(collection(db, collectionName), where(field, '==', userId));
              const querySnapshot = await getDocs(q);
              
              for (const docSnapshot of querySnapshot.docs) {
                await deleteDoc(doc(db, collectionName, docSnapshot.id));
                console.log(`${collectionName}에서 ${field} 필드로 문서 삭제:`, docSnapshot.id);
              }
            }
          } catch (error) {
            console.error(`${collectionName} 재검색 삭제 중 오류:`, error);
          }
        }

        console.log('모든 Storage 및 Firestore 데이터 삭제 완료');
      } catch (error) {
        console.error('Storage 삭제 중 오류:', error);
      }

      // 5. 최종 검증: 모든 컬렉션에서 해당 사용자 ID가 포함된 문서들 재검색
      try {
        console.log('최종 검증: 남은 데이터 재검색 중...');
        
        // 모든 컬렉션을 다시 한 번 검색
        const finalCollections = [
          'users', 'orders', 'cart', 'favorites', 'reviews', 'products', 
          'categories', 'siteData', 'sliderImages', 'adminUsers'
        ];

        for (const collectionName of finalCollections) {
          try {
            // 사용자 ID가 포함된 모든 문서 검색 (문서 ID가 사용자 ID인 경우도 포함)
            const allDocsSnapshot = await getDocs(collection(db, collectionName));
            
            for (const docSnapshot of allDocsSnapshot.docs) {
              const docData = docSnapshot.data();
              const docId = docSnapshot.id;
              
              // 문서 ID가 사용자 ID와 같거나, 데이터에 사용자 ID가 포함된 경우
              if (docId === userId || 
                  (docData && (
                    docData.userId === userId ||
                    docData.adminId === userId ||
                    docData.ownerId === userId ||
                    docData.createdBy === userId ||
                    docData.authorId === userId ||
                    docData.managerId === userId
                  ))) {
                await deleteDoc(doc(db, collectionName, docId));
                console.log(`최종 검증: ${collectionName}에서 문서 삭제:`, docId);
              }
            }
          } catch (error) {
            console.error(`최종 검증 ${collectionName} 삭제 중 오류:`, error);
          }
        }
      } catch (error) {
        console.error('최종 검증 중 오류:', error);
      }

      console.log('모든 관리자 데이터 삭제 완료');
    } catch (error) {
      console.error('관리자 데이터 삭제 중 오류:', error);
      throw error;
    }
  };

  // 회원탈퇴 처리
  const handleDeleteAccount = async () => {
    if (!currentUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      // 1. 사용자 재인증
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);

      // 2. 관리자 데이터 삭제
      await deleteAdminData(currentUser.uid);

      // 3. Firebase Authentication에서 사용자 삭제
      await deleteUser(currentUser);
      
      // 4. 로그아웃
      await signOut(auth);

      alert('회원탈퇴가 완료되었습니다.');
      navigate('/');
    } catch (error) {
      console.error('회원탈퇴 중 오류:', error);
      
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        console.log('비밀번호 오류 발생:', error.code);
        setError('비밀번호를 잘못 입력하셨습니다.');
        setIsDeleting(false);
        console.log('에러 상태 설정 완료, 모달 유지');
        // 비밀번호 오류 시 모달을 열어둠 - 모달을 닫지 않음
        return;
      } else if (error.code === 'auth/too-many-requests') {
        setError('너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.');
        setIsDeleting(false);
        setShowModal(false);
        setPassword('');
      } else {
        setError('회원탈퇴 중 오류가 발생했습니다. 다시 시도해주세요.');
        setIsDeleting(false);
        setShowModal(false);
        setPassword('');
      }
    }
  };

  const openModal = () => {
    setShowModal(true);
    setError('');
  };

  const closeModal = () => {
    console.log('모달 닫기 호출됨');
    setShowModal(false);
    setPassword('');
    setError('');
  };

  return (
    <div className="account-deletion">
      <div className="deletion-content">
        <h2 className="deletion-title">회원탈퇴</h2>
        <p className="deletion-description">
          회원탈퇴 시 지금까지 작성하신 모든 데이터가 영구적으로 삭제됩니다.
        </p>
        
        <div className="warning-box">
          <h3>삭제되는 데이터</h3>
          <ul>
            <li>관리자 계정 정보 및 프로필</li>
            <li>사이트 정보 및 설정</li>
            <li>상품 정보 및 카탈로그</li>
            <li>업로드한 이미지 및 파일</li>
            <li>슬라이더 이미지</li>
            <li>사이트 디자인 설정</li>
            <li>카테고리 및 메뉴 설정</li>
            <li>푸터 정보</li>
            <li>기타 모든 사이트 관련 데이터</li>
          </ul>
        </div>

        <button 
          className="delete-button"
          onClick={openModal}
        >
          회원탈퇴하기
        </button>
      </div>

      {/* 확인 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => {
          // 모달 오버레이 자체를 클릭한 경우에만 닫기
          if (e.target === e.currentTarget) {
            closeModal();
          }
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">정말로 회원탈퇴하시겠습니까?</h3>
            <p className="modal-description">
              모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
            </p>
            
            <div className="password-input">
              <label>비밀번호 확인</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="현재 비밀번호를 입력하세요"
                disabled={isDeleting}
              />
            </div>

            {error && (
              <div className="error-message" style={{color: 'red', marginTop: '10px'}}>
                {error}
              </div>
            )}

            <div className="modal-buttons">
              <button 
                className="cancel-btn"
                onClick={closeModal}
                disabled={isDeleting}
              >
                취소
              </button>
              <button 
                className="confirm-btn"
                onClick={handleDeleteAccount}
                disabled={isDeleting || !password.trim()}
              >
                {isDeleting ? '처리중...' : '예, 탈퇴합니다'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountDeletion;
