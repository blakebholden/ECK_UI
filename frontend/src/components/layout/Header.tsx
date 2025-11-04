import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  EuiHeader,
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiHeaderLinks,
  EuiHeaderLink,
  EuiTitle,
} from '@elastic/eui';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <EuiHeader position="fixed">
      <EuiHeaderSection>
        <EuiHeaderSectionItem>
          <EuiTitle size="xs">
            <h1
              style={{
                cursor: 'pointer',
                color: '#1BA9F5',
                fontWeight: 700,
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onClick={() => navigate('/')}
            >
              <span style={{ fontSize: '24px' }}>⚡</span>
              Elastic Cloud on Kubernetes
            </h1>
          </EuiTitle>
        </EuiHeaderSectionItem>
      </EuiHeaderSection>

      <EuiHeaderSection side="right">
        <EuiHeaderSectionItem>
          <EuiHeaderLinks>
            <EuiHeaderLink
              isActive={location.pathname === '/'}
              onClick={() => navigate('/')}
            >
              Dashboard
            </EuiHeaderLink>
            <EuiHeaderLink
              isActive={location.pathname.startsWith('/clusters')}
              onClick={() => navigate('/clusters')}
            >
              Clusters
            </EuiHeaderLink>
          </EuiHeaderLinks>
        </EuiHeaderSectionItem>
      </EuiHeaderSection>
    </EuiHeader>
  );
};

export default Header;
