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
    <div style={{ background: '#F5F7FA', minHeight: '100vh', paddingBottom: '40px' }}>
      <EuiPageHeader
        pageTitle="Dashboard"
        description="Overview of your Elastic Cloud on Kubernetes deployments"
        rightSideItems={[
          <EuiButton fill color="primary" size="m" onClick={() => navigate('/clusters/create')}>
            Create Cluster
          </EuiButton>,
        ]}
        paddingSize="l"
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
              <EuiPanel hasBorder paddingSize="l" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <EuiStat
                  title={totalClusters.toString()}
                  description="Total Clusters"
                  titleColor="ghost"
                  titleSize="l"
                  descriptionElement="div"
                  isLoading={isLoading}
                  textAlign="center"
                  style={{ color: 'white' }}
                />
              </EuiPanel>
            </EuiFlexItem>

            <EuiFlexItem>
              <EuiPanel hasBorder paddingSize="l" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <EuiStat
                  title={totalNodes.toString()}
                  description="Total Nodes"
                  titleColor="ghost"
                  titleSize="l"
                  descriptionElement="div"
                  isLoading={isLoading}
                  textAlign="center"
                  style={{ color: 'white' }}
                />
              </EuiPanel>
            </EuiFlexItem>

            <EuiFlexItem>
              <EuiPanel hasBorder paddingSize="l" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <EuiStat
                  title={(healthCounts.green || 0).toString()}
                  description="Healthy Clusters"
                  titleColor="ghost"
                  titleSize="l"
                  descriptionElement="div"
                  isLoading={isLoading}
                  textAlign="center"
                  style={{ color: 'white' }}
                />
              </EuiPanel>
            </EuiFlexItem>

            <EuiFlexItem>
              <EuiPanel hasBorder paddingSize="l" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                <EuiStat
                  title={((healthCounts.yellow || 0) + (healthCounts.red || 0)).toString()}
                  description="Unhealthy Clusters"
                  titleColor="ghost"
                  titleSize="l"
                  descriptionElement="div"
                  isLoading={isLoading}
                  textAlign="center"
                  style={{ color: 'white' }}
                />
              </EuiPanel>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiSpacer size="l" />

          <EuiPanel hasBorder paddingSize="l">
            <h3>Recent Clusters</h3>
            <EuiSpacer size="m" />
            <p>View all clusters in the <EuiButton onClick={() => navigate('/clusters')}>Clusters</EuiButton> page.</p>
          </EuiPanel>
        </>
      )}
    </div>
  );
};

export default Dashboard;
