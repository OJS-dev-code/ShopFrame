import React, { useEffect, useMemo, useState, useContext } from 'react';
import { SiteContext } from '../context/SiteContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import './MypageReviews.scss';

const MypageReviews = () => {
  const [activeTab, setActiveTab] = useState('write');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [writeCandidates, setWriteCandidates] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [reviewedHistory, setReviewedHistory] = useState([]);
  const [hoverDeleteIndex, setHoverDeleteIndex] = useState(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const { currentUser, addReview, products, deleteReview } = useContext(SiteContext) || {};

  // 주문/리뷰/리뷰이력 로드 및 후보 계산
  useEffect(() => {
    const load = async () => {
      try {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');

        let reviewList = [];
        let historyKeys = [];
        if (currentUser && currentUser.uid) {
          const snap = await getDocs(collection(db, 'users', currentUser.uid, 'reviews'));
          reviewList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          const histDoc = await getDoc(doc(db, 'users', currentUser.uid, 'meta', 'reviewedHistory'));
          historyKeys = histDoc.exists() ? (histDoc.data().keys || []) : [];
        } else {
          reviewList = JSON.parse(localStorage.getItem('reviews') || '[]');
          historyKeys = JSON.parse(localStorage.getItem('reviewedHistory') || '[]');
        }

        setMyReviews(reviewList);
        setReviewedHistory(historyKeys);

        const reviewedKeys = new Set([...(reviewList || []).map((r) => r.key), ...(historyKeys || [])]);
        const candidates = (orders || [])
          .filter((o) => o && o.status === '배송완료')
          .map((o) => ({
            id: `${o.orderNumber}|${o.product?.name || ''}|${o.product?.option || ''}`,
            key: `${o.orderNumber}|${o.product?.name || ''}|${o.product?.option || ''}`,
            image: o.product?.image || '/images/item1.png',
            brand: o.product?.brand || '',
            name: o.product?.name || '',
            option: o.product?.option || '',
            period: '',
            type: '일반리뷰'
          }))
          .filter((item) => !reviewedKeys.has(item.key));
        setWriteCandidates(candidates);
      } catch {
        setWriteCandidates([]);
        setMyReviews([]);
        setReviewedHistory([]);
      }
    };
    load();
  }, [currentUser]);

  const handleWriteReview = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
    setRating(0);
    setReviewText('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setRating(0);
    setReviewText('');
  };

  const handleSubmitReview = async () => {
    if (!selectedProduct || rating <= 0 || !reviewText.trim()) {
      alert('별점과 리뷰 내용을 입력해주세요.');
      return;
    }
    try {
      const now = new Date();
      const reviewRecord = {
        key: selectedProduct.key,
        image: selectedProduct.image,
        brand: selectedProduct.brand || '',
        name: selectedProduct.name,
        option: selectedProduct.option,
        rating: rating,
        review: reviewText.trim(),
        date: `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
      };
      
      // 상품 ID 찾기 (상품명으로 매칭)
      const product = products?.find(p => p.name === selectedProduct.name);
      
      if (product && addReview) {
        // 이메일에서 @ 앞 3글자 + 나머지 *로 표시
        const getMaskedEmail = (email) => {
          if (!email) return '익명';
          const [username] = email.split('@');
          if (username.length <= 3) {
            return username + '***';
          }
          return username.substring(0, 3) + '*'.repeat(username.length - 3);
        };
        
        // SiteContext의 addReview 함수로 상품 상세 페이지 후기에도 저장
        addReview(product.id, {
          rating: rating,
          content: reviewText.trim(),
          author: getMaskedEmail(currentUser?.email)
        });
      }
      
      if (currentUser && currentUser.uid) {
        const added = await addDoc(collection(db, 'users', currentUser.uid, 'reviews'), reviewRecord);
        setMyReviews(prev => [...prev, { id: added.id, ...reviewRecord }]);
        const histRef = doc(db, 'users', currentUser.uid, 'meta', 'reviewedHistory');
        const histSnap = await getDoc(histRef);
        const before = histSnap.exists() ? (histSnap.data().keys || []) : [];
        const after = Array.from(new Set([...before, selectedProduct.key]));
        await setDoc(histRef, { keys: after }, { merge: true });
        setReviewedHistory(after);
      } else {
        const existing = JSON.parse(localStorage.getItem('reviews') || '[]');
        const updated = [...existing, reviewRecord];
        localStorage.setItem('reviews', JSON.stringify(updated));
        setMyReviews(updated);
        const history = JSON.parse(localStorage.getItem('reviewedHistory') || '[]');
        const newHistory = Array.from(new Set([...(history || []), selectedProduct.key]));
        localStorage.setItem('reviewedHistory', JSON.stringify(newHistory));
        setReviewedHistory(newHistory);
      }

      // 작성 가능한 목록에서 제거
      setWriteCandidates((prev) => prev.filter((item) => item.key !== selectedProduct.key));
      handleCloseModal();
    } catch {
      // 실패 시에도 모달만 닫지 않도록 함
    }
  };

  const handleRequestDeleteReview = (index) => {
    setConfirmDeleteIndex(index);
  };

  const handleCancelDeleteReview = () => {
    setConfirmDeleteIndex(null);
  };

  const handleConfirmDeleteReview = async () => {
    if (confirmDeleteIndex === null) return;
    try {
      const target = myReviews[confirmDeleteIndex];
      
      // 상품 상세 페이지 후기에서도 삭제
      if (target && target.name && products) {
        const product = products.find(p => p.name === target.name);
        if (product && deleteReview) {
          // 상품명과 리뷰 내용으로 매칭하여 삭제
          const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
          const reviewToDelete = reviews.find(r => 
            r.productId === product.id && 
            r.content === target.review && 
            r.rating === target.rating
          );
          if (reviewToDelete) {
            deleteReview(reviewToDelete.id);
          }
        }
      }
      
      if (currentUser && currentUser.uid && target && target.id) {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'reviews', target.id));
        setMyReviews(prev => prev.filter((_, i) => i !== confirmDeleteIndex));
      } else {
        const updated = (myReviews || []).filter((_, i) => i !== confirmDeleteIndex);
        setMyReviews(updated);
        try { localStorage.setItem('reviews', JSON.stringify(updated)); } catch {}
      }
    } catch {}
    setConfirmDeleteIndex(null);
  };

  // 집계 텍스트 안전 처리
  const myReviewsCount = useMemo(() => (Array.isArray(myReviews) ? myReviews.length : 0), [myReviews]);

  return (
    <div className="reviews-page">

      <div className="reviews-section">
        <h2>리뷰</h2>
        
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'write' ? 'active' : ''}`}
            onClick={() => setActiveTab('write')}
          >
            리뷰작성
          </button>
          <button 
            className={`tab ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            나의 리뷰
          </button>
        </div>

        {activeTab === 'write' && (
          <div className="write-review">
            <div className="review-info">
              <ul>
                <li>리뷰는 배송 완료 후 90일 이내 작성할 수 있습니다.</li>
                <li>리뷰 작성으로 얻는 적립금은 해당 상품 금액의 5%이며, 적립금은 리뷰 작성 4일 뒤 지급됩니다.</li>
              </ul>
            </div>

            <div className="review-section">

              <div className="review-table">
                <div className="table-header">
                  <div>상품</div>
                  <div>작성기간</div>
                  <div>리뷰작성</div>
                </div>
                
                {writeCandidates.length === 0 && (
                  <div className="empty-state" style={{ padding: '20px', color: '#6c757d' }}>작성 가능한 상품이 없습니다.</div>
                )}
                {writeCandidates.map((item) => (
                  <div key={item.key} className="review-item">
                    <div className="product-info">
                      <img src={item.image} alt="상품" />
                      <div className="product-details">
                        <div className="brand">{item.brand}</div>
                        <div className="name">{item.name}</div>
                        <div className="option">{item.option}</div>
                      </div>
                    </div>
                    <div className="period">{item.period}</div>
                    <div className="action">
                      <button 
                        className="write-btn"
                        onClick={() => handleWriteReview(item)}
                      >
                        리뷰 작성
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'my' && (
          <div className="my-reviews">
            <div className="review-policy">
              <ul>
                <li>비속어 사용, 명예훼손, 비적절한 사진 첨부 등 적절치 않은 리뷰는 상품상세페이지 리뷰목록에 노출되지 않습니다.</li>
              </ul>
            </div>

            <div className="review-count">누적 리뷰 건수 {myReviewsCount}건</div>

            <div className="reviews-table">
              <div className="table-header">
                <div>상품</div>
                <div>리뷰</div>
              </div>
              
              {myReviewsCount > 0 ? (
                myReviews.map((review, idx) => (
                  <div key={`${review.key}-${idx}`} className="review-item">
                    <div className="product-info">
                      <img src={review.image} alt="상품" />
                      <div className="product-details">
                        <div className="brand">{review.brand}</div>
                        <div className="name">{review.name}</div>
                        <div className="option">{review.option}</div>
                      </div>
                    </div>
                    <div className="review-content">
                      <div className="rating">
                        {'★'.repeat(Math.max(0, Math.min(5, Math.floor(review.rating || 0))))}
                        <span className="rating-text">{review.rating}</span>
                      </div>
                      <div className="review-text">{review.review}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                        <div className="review-date">{review.date}</div>
                        <button
                          type="button"
                          onClick={() => handleRequestDeleteReview(idx)}
                          onMouseEnter={() => setHoverDeleteIndex(idx)}
                          onMouseLeave={() => setHoverDeleteIndex(null)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            padding: 0,
                            margin: 0,
                            fontSize: '12px',
                            color: '#6c757d',
                            cursor: 'pointer',
                            textDecoration: hoverDeleteIndex === idx ? 'underline' : 'none'
                          }}
                        >
                          리뷰 삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">⚠️</div>
                  <p>작성하신 상품 리뷰가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pagination">
          <button className="page-btn active">1</button>
        </div>
      </div>

      {/* 리뷰 작성 모달 */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              {selectedProduct && (
                <div className="modal-product">
                  <img src={selectedProduct.image} alt="상품" />
                  <div className="product-info">
                    <div className="brand">{selectedProduct.brand}</div>
                    <div className="name">{selectedProduct.name}</div>
                    <div className="option">{selectedProduct.option}</div>
                  </div>
                </div>
              )}
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>

            <div className="modal-rating">
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={`star ${rating >= star ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-text">
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="리뷰는 배송 완료 후 90일 이내 작성할 수 있습니다.
리뷰 작성으로 얻는 적립금은 해당 상품 금액의 5%이며, 적립금은 리뷰 작성 4일 뒤 지급됩니다.
비속어 사용, 명예훼손, 비적절한 사진 첨부 등 적절치 않은 리뷰는 상품상세페이지 리뷰목록에 노출되지 않습니다."
                rows={5}
              />
            </div>

            <div className="review-modal-actions">
              <button className="review-cancel-btn" onClick={handleCloseModal}>
                취소
              </button>
              <button className="review-submit-btn" onClick={handleSubmitReview}>
                작성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 리뷰 삭제 확인 모달 */}
      {confirmDeleteIndex !== null && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '360px' }}>
            <div className="modal-header">
              <div style={{ fontWeight: 600 }}>리뷰 삭제</div>
              <button className="close-btn" onClick={handleCancelDeleteReview}>×</button>
            </div>
            <div style={{ padding: '10px 0', color: '#333' }}>
              리뷰를 정말 삭제하시겠습니까?
            </div>
            <div className="review-modal-actions" style={{ justifyContent: 'flex-end' }}>
              <button className="review-cancel-btn" onClick={handleCancelDeleteReview}>
                아니오
              </button>
              <button className="review-submit-btn" onClick={handleConfirmDeleteReview}>
                예
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MypageReviews;
