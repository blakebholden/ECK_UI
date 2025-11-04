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
} from '@elastic/eui';
import { clustersApi } from '@services/api';

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
            <EuiPanel paddingSize="none" hasBorder style={{ background: 'transparent' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #343741', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <EuiTitle size="s">
                  <h2>Elasticsearch Deployments</h2>
                </EuiTitle>
                <EuiButton fill size="s" onClick={() => navigate('/clusters/create')}>
                  Create deployment
                </EuiButton>
              </div>
              <div style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #343741' }}>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 500, fontSize: '14px' }}>Deployment</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 500, fontSize: '14px' }}>Status</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 500, fontSize: '14px' }}>Version</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 500, fontSize: '14px' }}>Namespace</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 500, fontSize: '14px' }}>Nodes</th>
                      <th style={{ padding: '12px 24px', textAlign: 'right', fontWeight: 500, fontSize: '14px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clusters?.map((cluster) => (
                      <tr key={`${cluster.metadata?.namespace}/${cluster.metadata?.name}`} style={{ borderBottom: '1px solid #343741' }}>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ color: '#1BA9F5', fontWeight: 500 }}>{cluster.metadata?.name}</span>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span
                            style={{
                              padding: '4px 12px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              background: cluster.status?.health === 'green' ? '#00BFB3' : cluster.status?.health === 'yellow' ? '#FEC514' : '#F04E98',
                              color: '#000'
                            }}
                          >
                            {cluster.status?.health === 'green' ? 'Healthy' : cluster.status?.health === 'yellow' ? 'Warning' : 'Unhealthy'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px' }}>{cluster.spec?.version || 'N/A'}</td>
                        <td style={{ padding: '16px 24px' }}>{cluster.metadata?.namespace}</td>
                        <td style={{ padding: '16px 24px' }}>{cluster.status?.availableNodes || 0}</td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <EuiButton
                            size="s"
                            onClick={() => navigate(`/clusters/${cluster.metadata?.namespace}/${cluster.metadata?.name}`)}
                          >
                            Open
                          </EuiButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </EuiPanel>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
