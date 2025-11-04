import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Badge, Panel, PanelTitle } from '../components/ui';
import { clustersApi } from '../services/api';

const ClusterDetail = () => {
  const { namespace, name } = useParams();
  const navigate = useNavigate();

  const { data: cluster, isLoading, error } = useQuery({
    queryKey: ['cluster', namespace, name],
    queryFn: () => clustersApi.get(namespace, name),
    enabled: !!namespace && !!name,
  });

  const getHealthStatus = (health) => {
    if (health === 'green') return 'healthy';
    if (health === 'yellow') return 'warning';
    return 'error';
  };

  const getPhaseStatus = (phase) => {
    if (phase === 'Ready') return 'healthy';
    if (phase === 'Pending') return 'warning';
    return 'error';
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold mb-2 text-elastic-text-primary">
            Error loading cluster
          </h2>
          <p className="text-elastic-text-secondary mb-6">
            Unable to fetch cluster details. The cluster may not exist.
          </p>
          <Button onClick={() => navigate('/clusters')}>
            Back to Clusters
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-elastic-blue-600"></div>
      </div>
    );
  }

  if (!cluster) {
    return null;
  }

  const health = cluster.status?.health || 'unknown';
  const phase = cluster.status?.phase || 'Unknown';

  const DetailRow = ({ label, value }) => (
    <div className="flex py-3 border-b border-elastic-dark-600 last:border-b-0">
      <div className="w-1/3 text-elastic-text-secondary text-sm">{label}</div>
      <div className="w-2/3 text-elastic-text-primary">{value}</div>
    </div>
  );

  return (
    <div className="min-h-screen pb-10">
      <div className="px-12 py-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-3xl font-semibold text-elastic-text-primary">
              {cluster.metadata.name}
            </h1>
            <p className="text-elastic-text-secondary mt-2">
              Elasticsearch cluster in {cluster.metadata.namespace}
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/clusters')}>
            Back to Clusters
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Panel>
            <PanelTitle className="mb-6">Overview</PanelTitle>
            <div>
              <DetailRow label="Name" value={cluster.metadata.name} />
              <DetailRow label="Namespace" value={cluster.metadata.namespace} />
              <DetailRow
                label="Version"
                value={<Badge>{cluster.spec.version}</Badge>}
              />
              <DetailRow
                label="Health"
                value={
                  <Badge status={getHealthStatus(health)}>
                    {health.toUpperCase()}
                  </Badge>
                }
              />
              <DetailRow
                label="Phase"
                value={
                  <Badge status={getPhaseStatus(phase)}>
                    {phase}
                  </Badge>
                }
              />
              <DetailRow
                label="Available Nodes"
                value={cluster.status?.availableNodes || 0}
              />
              <DetailRow
                label="Created"
                value={new Date(cluster.metadata.creationTimestamp).toLocaleString()}
              />
            </div>
          </Panel>

          <Panel>
            <PanelTitle className="mb-6">Node Sets</PanelTitle>
            <div className="space-y-6">
              {cluster.spec.nodeSets.map((nodeSet, index) => (
                <div key={index}>
                  <h4 className="text-elastic-text-primary font-medium mb-3">
                    {nodeSet.name}
                  </h4>
                  <div>
                    <DetailRow label="Name" value={nodeSet.name} />
                    <DetailRow label="Count" value={nodeSet.count} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default ClusterDetail;
