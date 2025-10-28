import React, { useEffect, useState } from 'react';
import OrderStatusFlow from '../components/OrderStatusFlow';
import './MypageOrders.scss';

const MypageOrders = () => {
  const [period, setPeriod] = useState('1month');
  const [sortOrder, setSortOrder] = useState('recent');

  const orderStatus = [
    { status: '주문접수', count: 0 },
    { status: '결제완료', count: 0 },
    { status: '배송준비중', count: 0 },
    { status: '배송중', count: 0 },
    { status: '배송완료', count: 1, active: true }
  ];

  const [orders, setOrders] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('orders') || '[]');
      setOrders(saved);
    } catch { setOrders([]); }
  }, []);

  return (
    <div className="orders-page">

      <div className="orders-section">
        <div className="section-header">
          <h2>주문/배송조회</h2>
          <span className="period">(최근1개월)</span>
          <a href="#" className="more-link">더보기 </a>
        </div>

        <OrderStatusFlow orderStatus={orderStatus} />

        <div className="filter-section">
          <div className="filter-group">
            <h4>구매기간</h4>
            <div className="filter-buttons">
              {['1개월', '3개월', '6개월'].map((p) => (
                <button 
                  key={p}
                  className={period === p.replace('개월', 'month') ? 'active' : ''}
                  onClick={() => setPeriod(p.replace('개월', 'month'))}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="date-range">
            <div className="date-input">
              <select><option>2025년</option></select>
              <select><option>8월</option></select>
              <select><option>24일</option></select>
            </div>
            <span>~</span>
            <div className="date-input">
              <select><option>2025년</option></select>
              <select><option>9월</option></select>
              <select><option>24일</option></select>
            </div>
            <button className="search-btn">조회</button>
          </div>
        </div>

        <div className="orders-table">
          <div className="table-header-controls">
            <div className="sort-options">
              <span 
                className={sortOrder === 'recent' ? 'active' : ''}
                onClick={() => setSortOrder('recent')}
              >
                최근 주문순
              </span>
              <span 
                className={sortOrder === 'old' ? 'active' : ''}
                onClick={() => setSortOrder('old')}
              >
                과거 주문순
              </span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>주문일자</th>
                <th>상품</th>
                <th>수량</th>
                <th>주문금액</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={index}>
                  <td>
                    <div className="order-date">
                      <div>{order.orderDate}</div>
                    </div>
                  </td>
                  <td>
                    <div className="product-info">
                      <img src={order.product.image} alt="상품" />
                      <div className="product-details">
                        {order.product.brand && (<div className="brand">{order.product.brand}</div>)}
                        <div className="name">{order.product.name}</div>
                        {order.product.option && (<div className="option">{order.product.option}</div>)}
                      </div>
                    </div>
                  </td>
                  <td>{order.quantity}</td>
                  <td>{typeof order.amount === 'number' ? `${order.amount.toLocaleString()}원` : order.amount}</td>
                  <td>
                    <div className="status-info">
                      <div className="status">{order.status}</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MypageOrders;
