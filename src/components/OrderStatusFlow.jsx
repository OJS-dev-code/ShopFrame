import React from 'react';
import './OrderStatusFlow.scss';

const OrderStatusFlow = ({ orderStatus = [] }) => {
  return (
    <div className="order-status-flow">
      {orderStatus.map((item, index) => (
        <React.Fragment key={index}>
          <div className={`status-item ${item.active ? 'active' : ''}`}>
            <span className="count">{item.count}</span>
            <span className="status">{item.status}</span>
          </div>
          {index < orderStatus.length - 1 && (
            <div 
              className="arrow"
              style={{
                backgroundImage: "url('/icons/right-arrow.png')",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center"
              }}
            ></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default OrderStatusFlow;
