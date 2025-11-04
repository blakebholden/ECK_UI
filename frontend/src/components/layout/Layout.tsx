import React from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiTitle,
  EuiSpacer,
} from '@elastic/eui';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <Header />
      <EuiPage paddingSize="l">
        <EuiPageBody>
          {children}
        </EuiPageBody>
      </EuiPage>
    </>
  );
};

export default Layout;
