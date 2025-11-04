import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Link,
  Badge,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  Panel,
  PanelTitle,
} from '../components/ui';
import { clustersApi } from '../services/api';

const ClusterList = () => {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data: clusters, isLoading, error } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => clustersApi.list(),
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
            Error loading clusters
          </h2>
          <p className="text-elastic-text-secondary">
            Unable to fetch cluster list. Please check your connection to the backend API.
          </p>
        </div>
      </div>
    );
  }

  const totalClusters = clusters?.length || 0;
  const paginatedClusters = clusters?.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize) || [];
  const totalPages = Math.ceil(totalClusters / pageSize);

  return (
    <div className="min-h-screen pb-10">
      <div className="px-12 py-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-3xl font-semibold text-elastic-text-primary">
              Elasticsearch Clusters
            </h1>
            <p className="text-elastic-text-secondary mt-2">
              Manage your Elasticsearch clusters running on Kubernetes
            </p>
          </div>
          <Button onClick={() => navigate('/clusters/create')}>
            Create Cluster
          </Button>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-elastic-blue-600"></div>
            </div>
          ) : totalClusters === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center max-w-md">
                <h2 className="text-2xl font-semibold mb-2 text-elastic-text-primary">
                  No clusters found
                </h2>
                <p className="text-elastic-text-secondary mb-6">
                  Get started by creating your first Elasticsearch cluster.
                </p>
                <Button onClick={() => navigate('/clusters/create')}>
                  Create Cluster
                </Button>
              </div>
            </div>
          ) : (
            <Panel>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Namespace</TableHeader>
                    <TableHeader>Version</TableHeader>
                    <TableHeader>Health</TableHeader>
                    <TableHeader>Phase</TableHeader>
                    <TableHeader>Nodes</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedClusters.map((cluster) => (
                    <TableRow key={`${cluster.metadata?.namespace}-${cluster.metadata?.name}`}>
                      <TableCell>
                        <Link
                          onClick={() =>
                            navigate(`/clusters/${cluster.metadata?.namespace}/${cluster.metadata?.name}`)
                          }
                        >
                          {cluster.metadata?.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-elastic-text-secondary">
                        {cluster.metadata?.namespace}
                      </TableCell>
                      <TableCell>
                        <Badge>{cluster.spec?.version}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge status={getHealthStatus(cluster.status?.health)}>
                          {(cluster.status?.health || 'unknown').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge status={getPhaseStatus(cluster.status?.phase)}>
                          {cluster.status?.phase || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-elastic-text-secondary">
                        {cluster.status?.availableNodes || 0}
                      </TableCell>
                      <TableCell>
                        <Link
                          onClick={() =>
                            navigate(`/clusters/${cluster.metadata?.namespace}/${cluster.metadata?.name}`)
                          }
                        >
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-elastic-dark-600">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-elastic-text-secondary">
                      Rows per page:
                    </span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPageIndex(0);
                      }}
                      className="bg-elastic-dark-600 text-elastic-text-primary border border-elastic-dark-500 rounded px-3 py-1 text-sm"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-elastic-text-secondary">
                      {pageIndex * pageSize + 1}-{Math.min((pageIndex + 1) * pageSize, totalClusters)} of {totalClusters}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
                        disabled={pageIndex === 0}
                        className="px-3 py-1 rounded bg-elastic-dark-600 hover:bg-elastic-dark-500 disabled:opacity-50 disabled:cursor-not-allowed text-elastic-text-primary transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPageIndex(Math.min(totalPages - 1, pageIndex + 1))}
                        disabled={pageIndex >= totalPages - 1}
                        className="px-3 py-1 rounded bg-elastic-dark-600 hover:bg-elastic-dark-500 disabled:opacity-50 disabled:cursor-not-allowed text-elastic-text-primary transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClusterList;
