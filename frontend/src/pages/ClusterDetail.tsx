import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  EuiPageHeader,
  EuiSpacer,
  EuiPanel,
  EuiDescriptionList,
  EuiLoadingSpinner,
  EuiEmptyPrompt,
  EuiButton,
  EuiHealth,
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { clustersApi } from '@services/api';

const ClusterDetail: React.FC = () => {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const navigate = useNavigate();

  const { data: cluster, isLoading, error } = useQuery({
    queryKey: ['cluster', namespace, name],
    queryFn: () => clustersApi.get(namespace!, name!),
    enabled: !!namespace && !!name,
  });

  if (error) {
    return (
      <EuiEmptyPrompt
        iconType="alert"
        color="danger"
        title={<h2>Error loading cluster</h2>}
        body={<p>Unable to fetch cluster details. The cluster may not exist.</p>}
        actions={
          <EuiButton onClick={() => navigate('/clusters')}>
            Back to Clusters
          </EuiButton>
        }
      />
    );
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <EuiLoadingSpinner size="xl" />
      </div>
    );
  }

  if (!cluster) {
    return null;
  }

  const health = cluster.status?.health || 'unknown';
  const healthColor = health === 'green' ? 'success' : health === 'yellow' ? 'warning' : 'danger';

  const phase = cluster.status?.phase || 'Unknown';
  const phaseColor = phase === 'Ready' ? 'success' : phase === 'Pending' ? 'warning' : 'danger';

  const overviewItems = [
    {
      title: 'Name',
      description: cluster.metadata.name,
    },
    {
      title: 'Namespace',
      description: cluster.metadata.namespace,
    },
    {
      title: 'Version',
      description: <EuiBadge color="hollow">{cluster.spec.version}</EuiBadge>,
    },
    {
      title: 'Health',
      description: <EuiHealth color={healthColor}>{health.toUpperCase()}</EuiHealth>,
    },
    {
      title: 'Phase',
      description: <EuiBadge color={phaseColor}>{phase}</EuiBadge>,
    },
    {
      title: 'Available Nodes',
      description: cluster.status?.availableNodes || 0,
    },
    {
      title: 'Created',
      description: new Date(cluster.metadata.creationTimestamp).toLocaleString(),
    },
  ];

  return (
    <>
      <EuiPageHeader
        pageTitle={cluster.metadata.name}
        description={`Elasticsearch cluster in ${cluster.metadata.namespace}`}
        rightSideItems={[
          <EuiButton onClick={() => navigate('/clusters')}>
            Back to Clusters
          </EuiButton>,
        ]}
      />

      <EuiSpacer size="l" />

      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiPanel>
            <h3>Overview</h3>
            <EuiSpacer size="m" />
            <EuiDescriptionList listItems={overviewItems} />
          </EuiPanel>
        </EuiFlexItem>

        <EuiFlexItem>
          <EuiPanel>
            <h3>Node Sets</h3>
            <EuiSpacer size="m" />
            {cluster.spec.nodeSets.map((nodeSet, index) => (
              <div key={index}>
                <EuiDescriptionList
                  listItems={[
                    { title: 'Name', description: nodeSet.name },
                    { title: 'Count', description: nodeSet.count },
                  ]}
                />
                {index < cluster.spec.nodeSets.length - 1 && <EuiSpacer size="m" />}
              </div>
            ))}
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};

export default ClusterDetail;
