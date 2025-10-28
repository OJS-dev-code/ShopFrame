import React from 'react';
import './AdminFooter.scss';

const AdminFooter = () => {
  const teamMembers = [
    { name: "Oh jeong seo", role: "Project Planning & Website Development & Deployment" },
    { name: "Kil jeong eun", role: "Overall Design & Website Architecture Lead" },
    { name: "Kwon sera", role: "Website Component Development & Implementation" },
    { name: "Kim min gyeong", role: "Content Creation & Tutorial Video Production" },
    { name: "Kang yeon soo", role: "Content Creation & Tutorial Video Production" }
  ];

  return (
    <footer className="admin-footer">
      <div className="admin-footer-container">
        {/* 데스크톱 레이아웃 */}
        <div className="admin-footer-desktop">
          {/* 로고 */}
          <div className="admin-footer-logo">
            <img 
              src="/icons/shop frame logo-footer.png" 
              alt="SHOP FRAME" 
              className="admin-footer-logo-img"
            />
          </div>
          
          {/* 로고 옆 세로 구분선 */}
          <div className="admin-footer-logo-divider"></div>
          
          {/* 프로젝트 정보 */}
          <div className="admin-footer-project-info">
            <p>MBC Academy Project</p>
            <p>Project Team Name [ Shop Frame ]</p>
            <p>Project Duration - 25.09.03 ~ 25.10.13</p>
          </div>
          
          {/* 팀원명 */}
          <div className="admin-footer-members">
            <h3 className="admin-footer-section-title">Team Member</h3>
            <ul>
              {teamMembers.map((member, index) => (
                <li key={index}>{member.name}</li>
              ))}
            </ul>
          </div>
          
          {/* 팀원별 역할 */}
          <div className="admin-footer-roles">
            <h3 className="admin-footer-section-title">Team Members' Roles</h3>
            <ul>
              {teamMembers.map((member, index) => (
                <li key={index}>{member.role}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 모바일 레이아웃 - 테이블 형태 */}
        <div className="admin-footer-mobile">
          <div className="admin-footer-mobile-logo">
            <img 
              src="/icons/shop frame logo-footer.png" 
              alt="SHOP FRAME" 
              className="admin-footer-logo-img"
            />
          </div>
          
          <div className="admin-footer-mobile-project-info">
            <p>MBC Academy Project</p>
            <p>Project Team Name [ Shop Frame ]</p>
            <p>Project Duration - 25.09.03 ~ 25.10.13</p>
          </div>
          
          <table className="admin-footer-table">
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Team Members' Roles</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member, index) => (
                <tr key={index}>
                  <td>{member.name}</td>
                  <td>{member.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </footer>
  );
};

export default AdminFooter;
