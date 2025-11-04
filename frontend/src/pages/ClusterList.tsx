import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  EuiPageHeader,
  EuiSpacer,
  EuiBasicTable,
  EuiHealth,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiEmptyPrompt,
  EuiLoadingSpinner,
  EuiBadge,
  EuiTableFieldDataColumnType,
} from '@elastic/eui';
import { clustersApi } from '@services/api';
import type { ElasticsearchCluster } from '@types/index';

const ClusterList: React.FC = () => {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data: clusters, isLoading, error } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => clustersApi.list(),
  });

  const columns: Array<EuiTableFieldDataColumnType<ElasticsearchCluster>> = [
    {
      field: 'metadata.name',
      name: 'Name',
      sortable: true,
      render: (name: string, cluster: ElasticsearchCluster) => (
        <a
          onClick={() => navigate(`/clusters/${cluster.metadata.namespace}/${name}`)}
          style={{ cursor: 'pointer' }}
        >
          {name}
        </a>
      ),
    },
    {
      field: 'metadata.namespace',
      name: 'Namespace',
      sortable: true,
    },
    {
      field: 'spec.version',
      name: 'Version',
      sortable: true,
      render: (version: string) => <EuiBadge color="hollow">{version}</EuiBadge>,
    },
    {
      field: 'status.health',
      name: 'Health',
      sortable: true,
      render: (health: string) => {
        const color = health === 'green' ? 'success' : health === 'yellow' ? 'warning' : 'danger';
        return <EuiHealth color={color}>{(health || 'unknown').toUpperCase()}</EuiHealth>;
      },
    },
    {
      field: 'status.phase',
      name: 'Phase',
      sortable: true,
      render: (phase: string) => {
        const color = phase === 'Ready' ? 'success' : phase === 'Pending' ? 'warning' : 'danger';
        return <EuiBadge color={color}>{phase || 'Unknown'}</EuiBadge>;
      },
    },
    {
      field: 'status.availableNodes',
      name: 'Nodes',
      sortable: true,
      render: (nodes: number) => nodes || 0,
    },
    {
      name: 'Actions',
      actions: [
        {
          name: 'View',
          description: 'View cluster details',
          icon: 'eye',
          type: 'icon',
          onClick: (cluster: ElasticsearchCluster) =>
            navigate(`/clusters/${cluster.metadata.namespace}/${cluster.metadata.name}`),
        },
      ],
    },
  ];

  const pagination = {
    pageIndex,
    pageSize,
    totalItemCount: clusters?.length || 0,
    pageSizeOptions: [10, 25, 50],
  };

  const onTableChange = ({ page }: any) => {
    if (page) {
      setPageIndex(page.index);
      setPageSize(page.size);
    }
  };

  if (error) {
    return (
      <EuiEmptyPrompt
        iconType="alert"
        color="danger"
        title={<h2>Error loading clusters</h2>}
        body={<p>Unable to fetch cluster list. Please check your connection to the backend API.</p>}
      />
    );
  }

  return (
    <>
      <EuiPageHeader
        pageTitle="Elasticsearch Clusters"
        description="Manage your Elasticsearch clusters running on Kubernetes"
        rightSideItems={[
          <EuiButton fill iconType="plus" onClick={() => navigate('/clusters/create')}>
            Create Cluster
          </EuiButton>,
        ]}
      />

      <EuiSpacer size="l" />

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <EuiLoadingSpinner size="xl" />
        </div>
      ) : !clusters || clusters.length === 0 ? (
        <EuiEmptyPrompt
          iconType="logoElasticsearch"
          title={<h2>No clusters found</h2>}
          body={<p>Get started by creating your first Elasticsearch cluster.</p>}
          actions={
            <EuiButton fill iconType="plus" onClick={() => navigate('/clusters/create')}>
              Create Cluster
            </EuiButton>
          }
        />
      ) : (
        <EuiBasicTable
          items={clusters.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)}
          columns={columns}
          pagination={pagination}
          onChange={onTableChange}
          sorting={{
            sort: {
              field: 'metadata.name',
              direction: 'asc',
            },
          }}
        />
      )}
    </>
  );
};

export default ClusterList;
