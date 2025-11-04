export interface ElasticsearchCluster {
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp: string;
    uid: string;
  };
  spec: {
    version: string;
    nodeSets: NodeSet[];
    http?: {
      tls?: {
        selfSignedCertificate?: {
          disabled: boolean;
        };
      };
    };
  };
  status?: {
    health: 'green' | 'yellow' | 'red' | 'unknown';
    phase: 'Ready' | 'Pending' | 'Failed' | 'Unknown';
    availableNodes: number;
  };
}

export interface NodeSet {
  name: string;
  count: number;
  config?: Record<string, any>;
  podTemplate?: {
    spec?: {
      containers?: Array<{
        name: string;
        resources?: {
          limits?: {
            memory?: string;
            cpu?: string;
          };
          requests?: {
            memory?: string;
            cpu?: string;
          };
        };
      }>;
    };
  };
}

export interface KibanaInstance {
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp: string;
  };
  spec: {
    version: string;
    count: number;
    elasticsearchRef: {
      name: string;
      namespace?: string;
    };
  };
  status?: {
    health: 'green' | 'yellow' | 'red' | 'unknown';
  };
}

export interface ClusterHealth {
  status: 'green' | 'yellow' | 'red';
  numberOfNodes: number;
  activeShards: number;
  indices: number;
  docs: number;
  storeSize: number;
}

export interface ClusterStats {
  nodes: {
    count: number;
    roles: Record<string, number>;
  };
  indices: {
    count: number;
    shards: {
      total: number;
      primaries: number;
      replicas: number;
    };
    docs: {
      count: number;
      deleted: number;
    };
    store: {
      sizeInBytes: number;
    };
  };
}
