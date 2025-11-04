import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  EuiPageHeader,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiStat,
  EuiPanel,
  EuiLoadingSpinner,
  EuiEmptyPrompt,
  EuiButton,
  EuiTitle,
  EuiBasicTable,
  EuiBadge,
  EuiBasicTableColumn,
  EuiLink,
} from '@elastic/eui';
import { clustersApi } from '@services/api';
import type { ElasticsearchCluster } from '@types/index';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: clusters, isLoading, error } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => clustersApi.list(),
  });

  if (error) {
    return (
      <EuiEmptyPrompt
        iconType="alert"
        color="danger"
        title={<h2>Error loading dashboard</h2>}
        body={<p>Unable to fetch cluster information. Please check your connection to the backend API.</p>}
      />
    );
  }

  const healthCounts = clusters?.reduce((acc, cluster) => {
    const health = cluster.status?.health || 'unknown';
    acc[health] = (acc[health] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const totalClusters = clusters?.length || 0;
  const totalNodes = clusters?.reduce((sum, cluster) => sum + (cluster.status?.availableNodes || 0), 0) || 0;

  const columns: Array<EuiBasicTableColumn<ElasticsearchCluster>> = [
    {
      field: 'metadata.name',
      name: 'Deployment',
      render: (name: string, cluster: ElasticsearchCluster) => (
        <EuiLink
          color="primary"
          onClick={() => navigate(`/clusters/${cluster.metadata?.namespace}/${cluster.metadata?.name}`)}
        >
          {name}
        </EuiLink>
      ),
    },
    {
      field: 'status.health',
      name: 'Status',
      render: (health: string) => {
        const color = health === 'green' ? 'success' : health === 'yellow' ? 'warning' : 'danger';
        const label = health === 'green' ? 'Healthy' : health === 'yellow' ? 'Warning' : 'Unhealthy';
        return <EuiBadge color={color}>{label}</EuiBadge>;
      },
    },
    {
      field: 'spec.version',
      name: 'Version',
      render: (version: string) => version || 'N/A',
    },
    {
      field: 'metadata.namespace',
      name: 'Namespace',
    },
    {
      field: 'status.availableNodes',
      name: 'Nodes',
      render: (nodes: number) => nodes || 0,
    },
    {
      name: 'Actions',
      actions: [
        {
          name: 'Open',
          description: 'Open cluster details',
          type: 'icon',
          icon: 'eye',
          onClick: (cluster: ElasticsearchCluster) =>
            navigate(`/clusters/${cluster.metadata?.namespace}/${cluster.metadata?.name}`),
        },
      ],
    },
  ];

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
      <div style={{ padding: '24px 48px' }}>
        <EuiTitle size="l">
          <h1>Welcome to Elastic Cloud on Kubernetes</h1>
        </EuiTitle>
        <EuiSpacer size="l" />

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <EuiLoadingSpinner size="xl" />
          </div>
        ) : totalClusters === 0 ? (
          <EuiEmptyPrompt
            title={<h2>No Elasticsearch clusters found</h2>}
            body={<p>Get started by creating your first Elasticsearch cluster.</p>}
            actions={
              <EuiButton fill onClick={() => navigate('/clusters/create')}>
                Create Cluster
              </EuiButton>
            }
          />
        ) : (
          <>
            <EuiPanel paddingSize="none" hasBorder>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #343741', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <EuiTitle size="s">
                  <h2>Elasticsearch Deployments</h2>
                </EuiTitle>
                <EuiButton fill size="s" onClick={() => navigate('/clusters/create')}>
                  Create deployment
                </EuiButton>
              </div>
              <EuiBasicTable
                items={clusters || []}
                columns={columns}
                tableLayout="auto"
              />
            </EuiPanel>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
