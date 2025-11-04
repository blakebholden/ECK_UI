import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  EuiHeader,
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiHeaderLinks,
  EuiHeaderLink,
  EuiIcon,
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
            <h1 style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => navigate('/')}>
              <EuiIcon type="logoElastic" size="l" />
              ECK UI
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
