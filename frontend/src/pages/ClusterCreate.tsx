import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EuiPageHeader,
  EuiSpacer,
  EuiPanel,
  EuiButton,
} from '@elastic/eui';

const ClusterCreate: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <EuiPageHeader
        pageTitle="Create Elasticsearch Cluster"
        description="Deploy a new Elasticsearch cluster on Kubernetes"
        rightSideItems={[
          <EuiButton onClick={() => navigate('/clusters')}>
            Cancel
          </EuiButton>,
        ]}
      />

      <EuiSpacer size="l" />

      <EuiPanel>
        <h3>Cluster Creation Wizard</h3>
        <EuiSpacer size="m" />
        <p>Cluster creation form will be implemented in the next phase.</p>
      </EuiPanel>
    </>
  );
};

export default ClusterCreate;
