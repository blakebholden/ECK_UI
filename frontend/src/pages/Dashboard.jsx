import React, { useState, lazy, Suspense } from 'react';
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
import EventFeed from '../components/EventFeed';
import ClusterCards from '../components/ClusterCards';

// Lazy load the heavy ClusterMap component
const ClusterMap = lazy(() => import('../components/ClusterMap'));

const Dashboard = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table'); // 'cards' or 'table'
  const { data: clusters, isLoading, error } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => clustersApi.list(),
  });

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold mb-2 text-elastic-text-primary">
            Error loading dashboard
          </h2>
          <p className="text-elastic-text-secondary">
            Unable to fetch cluster information. Please check your connection to the backend API.
          </p>
        </div>
      </div>
    );
  }

  const totalClusters = clusters?.length || 0;

  const getHealthStatus = (health) => {
    if (health === 'green') return 'healthy';
    if (health === 'yellow') return 'warning';
    return 'error';
  };

  const getHealthLabel = (health) => {
    if (health === 'green') return 'Healthy';
    if (health === 'yellow') return 'Warning';
    return 'Unhealthy';
  };

  return (
    <div className="min-h-screen pb-10">
      <div className="px-12 py-6">
        <h1 className="text-2xl font-normal text-elastic-text-primary mb-8">
          ECK Dashboard
        </h1>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content - Left Side (2/3 width on xl screens) */}
          <div className="xl:col-span-2">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-elastic-blue-600"></div>
              </div>
            ) : totalClusters === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center max-w-md">
                  <h2 className="text-2xl font-semibold mb-2 text-elastic-text-primary">
                    No Elasticsearch clusters found
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
              <>
                {/* View Toggle Section */}
                <div className="flex justify-between items-center mb-6">
                  <PanelTitle>Hosted deployments</PanelTitle>
                  <div className="flex gap-3 items-center">
                    {/* View Mode Toggle */}
                    <div className="flex bg-elastic-dark-700 border border-elastic-dark-600 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('cards')}
                        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                          viewMode === 'cards'
                            ? 'bg-elastic-blue-600 text-white'
                            : 'text-elastic-text-secondary hover:text-elastic-text-primary'
                        }`}
                      >
                        <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        Cards
                      </button>
                      <button
                        onClick={() => setViewMode('table')}
                        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                          viewMode === 'table'
                            ? 'bg-elastic-blue-600 text-white'
                            : 'text-elastic-text-secondary hover:text-elastic-text-primary'
                        }`}
                      >
                        <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Table
                      </button>
                    </div>

                    <Button onClick={() => navigate('/clusters/create')}>
                      Create hosted deployment
                    </Button>
                  </div>
                </div>

                {/* Conditional View Rendering */}
                {viewMode === 'cards' ? (
                  <ClusterCards clusters={clusters} />
                ) : (
                  <Panel>
                    <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Deployment</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Version</TableHeader>
                      <TableHeader>Cloud provider & region</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clusters.map((cluster) => (
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
                        <TableCell>
                          <Badge status={getHealthStatus(cluster.status?.health)}>
                            {getHealthLabel(cluster.status?.health)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-elastic-text-secondary">
                          {cluster.spec?.version || 'N/A'}
                        </TableCell>
                        <TableCell className="text-elastic-text-secondary">
                          AWS - N. Virginia ({cluster.metadata?.namespace})
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-4">
                            <Link
                              onClick={() =>
                                navigate(`/clusters/${cluster.metadata?.namespace}/${cluster.metadata?.name}`)
                              }
                            >
                              Open
                            </Link>
                            <Link
                              onClick={() =>
                                navigate(`/clusters/${cluster.metadata?.namespace}/${cluster.metadata?.name}`)
                              }
                            >
                              Manage
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                      </TableBody>
                    </Table>
                  </Panel>
                )}

                {/* 3D Globe Map - Always visible below clusters */}
                <div className="mt-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-elastic-dark-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-elastic-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-elastic-text-primary">Cluster Map</h2>
                  </div>
                  <Suspense fallback={
                    <div className="flex justify-center items-center py-20 bg-elastic-dark-700 rounded-lg border border-elastic-dark-600" style={{ height: '600px' }}>
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-elastic-blue-600 mx-auto mb-4"></div>
                        <p className="text-elastic-text-secondary">Loading 3D map...</p>
                      </div>
                    </div>
                  }>
                    <ClusterMap clusters={clusters} />
                  </Suspense>
                </div>
              </>
            )}
          </div>

          {/* Event Feed - Right Side (1/3 width on xl screens) */}
          <div className="xl:col-span-1">
            <EventFeed />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
