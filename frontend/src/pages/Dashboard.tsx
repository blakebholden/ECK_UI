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
    <>
      <EuiPageHeader
        pageTitle="Dashboard"
        description="Overview of your Elastic Cloud on Kubernetes deployments"
        rightSideItems={[
          <EuiButton fill onClick={() => navigate('/clusters/create')}>
            Create Cluster
          </EuiButton>,
        ]}
      />

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
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiPanel>
                <EuiStat
                  title={totalClusters.toString()}
                  description="Total Clusters"
                  titleColor="primary"
                  isLoading={isLoading}
                />
              </EuiPanel>
            </EuiFlexItem>

            <EuiFlexItem>
              <EuiPanel>
                <EuiStat
                  title={totalNodes.toString()}
                  description="Total Nodes"
                  titleColor="success"
                  isLoading={isLoading}
                />
              </EuiPanel>
            </EuiFlexItem>

            <EuiFlexItem>
              <EuiPanel>
                <EuiStat
                  title={(healthCounts.green || 0).toString()}
                  description="Healthy Clusters"
                  titleColor="success"
                  isLoading={isLoading}
                />
              </EuiPanel>
            </EuiFlexItem>

            <EuiFlexItem>
              <EuiPanel>
                <EuiStat
                  title={((healthCounts.yellow || 0) + (healthCounts.red || 0)).toString()}
                  description="Unhealthy Clusters"
                  titleColor="danger"
                  isLoading={isLoading}
                />
              </EuiPanel>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiSpacer size="l" />

          <EuiPanel>
            <h3>Recent Clusters</h3>
            <EuiSpacer size="m" />
            <p>View all clusters in the <EuiButton onClick={() => navigate('/clusters')}>Clusters</EuiButton> page.</p>
          </EuiPanel>
        </>
      )}
    </>
  );
};

export default Dashboard;
