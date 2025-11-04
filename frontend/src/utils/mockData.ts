import type { ElasticsearchCluster, KibanaInstance } from '@types/index';

export const mockClusters: ElasticsearchCluster[] = [
  {
    metadata: {
      name: 'production-cluster',
      namespace: 'production',
      creationTimestamp: '2024-10-15T10:30:00Z',
      uid: 'abc123-prod',
    },
    spec: {
      version: '8.13.0',
      nodeSets: [
        {
          name: 'master-nodes',
          count: 3,
          config: {
            'node.roles': ['master'],
          },
          podTemplate: {
            spec: {
              containers: [
                {
                  name: 'elasticsearch',
                  resources: {
                    limits: {
                      memory: '4Gi',
                      cpu: '2',
                    },
                  },
                },
              ],
            },
          },
        },
        {
          name: 'data-nodes',
          count: 6,
          config: {
            'node.roles': ['data', 'ingest'],
          },
          podTemplate: {
            spec: {
              containers: [
                {
                  name: 'elasticsearch',
                  resources: {
                    limits: {
                      memory: '16Gi',
                      cpu: '4',
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
    status: {
      health: 'green',
      phase: 'Ready',
      availableNodes: 9,
    },
  },
  {
    metadata: {
      name: 'staging-cluster',
      namespace: 'staging',
      creationTimestamp: '2024-10-20T14:20:00Z',
      uid: 'def456-staging',
    },
    spec: {
      version: '8.12.2',
      nodeSets: [
        {
          name: 'default',
          count: 3,
          config: {
            'node.store.allow_mmap': false,
          },
          podTemplate: {
            spec: {
              containers: [
                {
                  name: 'elasticsearch',
                  resources: {
                    limits: {
                      memory: '4Gi',
                      cpu: '1',
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
    status: {
      health: 'yellow',
      phase: 'Ready',
      availableNodes: 3,
    },
  },
  {
    metadata: {
      name: 'dev-cluster',
      namespace: 'development',
      creationTimestamp: '2024-11-01T09:15:00Z',
      uid: 'ghi789-dev',
    },
    spec: {
      version: '8.13.0',
      nodeSets: [
        {
          name: 'default',
          count: 1,
          config: {
            'node.store.allow_mmap': false,
          },
          podTemplate: {
            spec: {
              containers: [
                {
                  name: 'elasticsearch',
                  resources: {
                    limits: {
                      memory: '2Gi',
                      cpu: '1',
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
    status: {
      health: 'green',
      phase: 'Ready',
      availableNodes: 1,
    },
  },
  {
    metadata: {
      name: 'analytics-cluster',
      namespace: 'analytics',
      creationTimestamp: '2024-10-25T16:45:00Z',
      uid: 'jkl012-analytics',
    },
    spec: {
      version: '8.11.4',
      nodeSets: [
        {
          name: 'hot-nodes',
          count: 4,
          config: {
            'node.roles': ['data_hot', 'ingest'],
          },
          podTemplate: {
            spec: {
              containers: [
                {
                  name: 'elasticsearch',
                  resources: {
                    limits: {
                      memory: '8Gi',
                      cpu: '2',
                    },
                  },
                },
              ],
            },
          },
        },
        {
          name: 'warm-nodes',
          count: 2,
          config: {
            'node.roles': ['data_warm'],
          },
          podTemplate: {
            spec: {
              containers: [
                {
                  name: 'elasticsearch',
                  resources: {
                    limits: {
                      memory: '8Gi',
                      cpu: '1',
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
    status: {
      health: 'green',
      phase: 'Ready',
      availableNodes: 6,
    },
  },
  {
    metadata: {
      name: 'logging-cluster',
      namespace: 'logging',
      creationTimestamp: '2024-11-02T11:00:00Z',
      uid: 'mno345-logging',
    },
    spec: {
      version: '8.13.0',
      nodeSets: [
        {
          name: 'default',
          count: 2,
          config: {
            'node.store.allow_mmap': false,
          },
          podTemplate: {
            spec: {
              containers: [
                {
                  name: 'elasticsearch',
                  resources: {
                    limits: {
                      memory: '4Gi',
                      cpu: '2',
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
    status: {
      health: 'red',
      phase: 'Pending',
      availableNodes: 1,
    },
  },
  {
    metadata: {
      name: 'search-cluster',
      namespace: 'search',
      creationTimestamp: '2024-10-18T08:30:00Z',
      uid: 'pqr678-search',
    },
    spec: {
      version: '8.12.2',
      nodeSets: [
        {
          name: 'default',
          count: 5,
          config: {
            'node.roles': ['data', 'ingest'],
          },
          podTemplate: {
            spec: {
              containers: [
                {
                  name: 'elasticsearch',
                  resources: {
                    limits: {
                      memory: '8Gi',
                      cpu: '2',
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
    status: {
      health: 'green',
      phase: 'Ready',
      availableNodes: 5,
    },
  },
];

export const mockKibana: KibanaInstance[] = [
  {
    metadata: {
      name: 'production-kibana',
      namespace: 'production',
      creationTimestamp: '2024-10-15T10:35:00Z',
    },
    spec: {
      version: '8.13.0',
      count: 2,
      elasticsearchRef: {
        name: 'production-cluster',
        namespace: 'production',
      },
    },
    status: {
      health: 'green',
    },
  },
  {
    metadata: {
      name: 'staging-kibana',
      namespace: 'staging',
      creationTimestamp: '2024-10-20T14:25:00Z',
    },
    spec: {
      version: '8.12.2',
      count: 1,
      elasticsearchRef: {
        name: 'staging-cluster',
        namespace: 'staging',
      },
    },
    status: {
      health: 'green',
    },
  },
  {
    metadata: {
      name: 'analytics-kibana',
      namespace: 'analytics',
      creationTimestamp: '2024-10-25T16:50:00Z',
    },
    spec: {
      version: '8.11.4',
      count: 1,
      elasticsearchRef: {
        name: 'analytics-cluster',
        namespace: 'analytics',
      },
    },
    status: {
      health: 'green',
    },
  },
];

export const USE_MOCK_DATA = true; // Toggle this to switch between mock and real data
