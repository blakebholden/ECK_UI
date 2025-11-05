import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button, Panel, PanelTitle } from '../components/ui';
import { clustersApi, namespacesApi, capacityApi, storageApi } from '../services/api';

const ClusterCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    namespace: '',
    version: '8.11.0',
    nodeCount: 1,
    memory: '2Gi', // Minimum 2GB for Elasticsearch
    storageSize: '10Gi', // Default storage size
    storageClass: '', // Will be set to default storage class when loaded
  });
  const [showNewNamespace, setShowNewNamespace] = useState(false);
  const [newNamespace, setNewNamespace] = useState('');

  // Fetch existing namespaces from Kubernetes
  const { data: namespaces = [], isLoading: namespacesLoading } = useQuery({
    queryKey: ['namespaces'],
    queryFn: () => namespacesApi.list(),
  });

  // Fetch available storage classes
  const { data: storageClasses = [], isLoading: storageClassesLoading } = useQuery({
    queryKey: ['storage-classes'],
    queryFn: () => storageApi.list(),
    onSuccess: (data) => {
      // Set default storage class if available and not already set
      if (data.length > 0 && !formData.storageClass) {
        const defaultClass = data.find(sc => sc.isDefault) || data[0];
        setFormData(prev => ({ ...prev, storageClass: defaultClass.name }));
      }
    },
  });

  // Fetch cluster capacity
  const { data: capacity, isLoading: capacityLoading } = useQuery({
    queryKey: ['capacity'],
    queryFn: () => capacityApi.get(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const createMutation = useMutation({
    mutationFn: ({ namespace, clusterSpec }) => clustersApi.create(namespace, clusterSpec),
    onSuccess: () => {
      queryClient.invalidateQueries(['clusters']);
      navigate('/');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Build Elasticsearch cluster spec
    const nodeSet = {
      name: 'default',
      count: formData.nodeCount,
      config: {
        'node.store.allow_mmap': false,
      },
      podTemplate: {
        spec: {
          containers: [
            {
              name: 'elasticsearch',
              resources: {
                requests: {
                  memory: formData.memory,
                },
                limits: {
                  memory: formData.memory,
                },
              },
            },
          ],
        },
      },
    };

    // Add volumeClaimTemplates for persistent storage if storage class is selected
    if (formData.storageClass && formData.storageSize) {
      nodeSet.volumeClaimTemplates = [
        {
          metadata: {
            name: 'elasticsearch-data',
          },
          spec: {
            accessModes: ['ReadWriteOnce'],
            resources: {
              requests: {
                storage: formData.storageSize,
              },
            },
            storageClassName: formData.storageClass,
          },
        },
      ];
    }

    const clusterSpec = {
      apiVersion: 'elasticsearch.k8s.elastic.co/v1',
      kind: 'Elasticsearch',
      metadata: {
        name: formData.name,
      },
      spec: {
        version: formData.version,
        nodeSets: [nodeSet],
      },
    };

    createMutation.mutate({ namespace: finalNamespace, clusterSpec });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNamespaceChange = (value) => {
    if (value === '__new__') {
      setShowNewNamespace(true);
      setFormData(prev => ({ ...prev, namespace: '' }));
    } else {
      setShowNewNamespace(false);
      setFormData(prev => ({ ...prev, namespace: value }));
    }
  };

  const finalNamespace = showNewNamespace ? newNamespace : formData.namespace;

  // Calculate resource requirements and check capacity
  const resourceCheck = useMemo(() => {
    if (!capacity) return null;

    // Parse memory requirement
    const parseMemory = (mem) => {
      if (mem.endsWith('Gi')) return parseFloat(mem);
      if (mem.endsWith('Mi')) return parseFloat(mem) / 1024;
      return 0;
    };

    const memoryPerNode = parseMemory(formData.memory);
    const totalMemoryNeeded = memoryPerNode * formData.nodeCount;
    const estimatedCPU = formData.nodeCount * 0.5; // Estimate 0.5 CPU per node

    const hasEnoughMemory = capacity.cluster.available.memory >= totalMemoryNeeded;
    const hasEnoughCPU = capacity.cluster.available.cpu >= estimatedCPU;
    const hasEnoughPods = capacity.cluster.available.pods >= formData.nodeCount;

    return {
      memory: {
        needed: totalMemoryNeeded,
        available: capacity.cluster.available.memory,
        sufficient: hasEnoughMemory,
      },
      cpu: {
        needed: estimatedCPU,
        available: capacity.cluster.available.cpu,
        sufficient: hasEnoughCPU,
      },
      pods: {
        needed: formData.nodeCount,
        available: capacity.cluster.available.pods,
        sufficient: hasEnoughPods,
      },
      canDeploy: hasEnoughMemory && hasEnoughCPU && hasEnoughPods,
    };
  }, [capacity, formData.memory, formData.nodeCount]);

  return (
    <div className="min-h-screen pb-10">
      <div className="px-12 py-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-3xl font-semibold text-elastic-text-primary">
              Create Elasticsearch Cluster
            </h1>
            <p className="text-elastic-text-secondary mt-2">
              Deploy a new Elasticsearch cluster on Kubernetes
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/')}>
            Cancel
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Cluster Capacity Overview */}
          {capacity && (
            <Panel>
              <div className="flex justify-between items-center mb-6">
                <PanelTitle>Cluster Capacity</PanelTitle>
                <span className="text-xs text-elastic-text-secondary">
                  {capacity.cluster.totalNodes} nodes • {capacity.cluster.readyNodes} ready
                </span>
              </div>

              {/* Cluster-wide resources */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-elastic-dark-600 rounded-lg p-4">
                  <div className="text-xs text-elastic-text-secondary uppercase mb-2">CPU Cores</div>
                  <div className="text-2xl font-semibold text-elastic-text-primary">
                    {capacity.cluster.available.cpu.toFixed(1)}
                  </div>
                  <div className="text-xs text-elastic-text-secondary mt-1">
                    of {capacity.cluster.capacity.cpu.toFixed(1)} available
                  </div>
                  <div className="mt-2 bg-elastic-dark-700 rounded-full h-2">
                    <div
                      className="bg-elastic-blue-600 h-2 rounded-full"
                      style={{ width: `${capacity.cluster.utilization.cpu}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-elastic-dark-600 rounded-lg p-4">
                  <div className="text-xs text-elastic-text-secondary uppercase mb-2">Memory (GB)</div>
                  <div className="text-2xl font-semibold text-elastic-text-primary">
                    {capacity.cluster.available.memory.toFixed(1)}
                  </div>
                  <div className="text-xs text-elastic-text-secondary mt-1">
                    of {capacity.cluster.capacity.memory.toFixed(1)} available
                  </div>
                  <div className="mt-2 bg-elastic-dark-700 rounded-full h-2">
                    <div
                      className="bg-elastic-blue-600 h-2 rounded-full"
                      style={{ width: `${capacity.cluster.utilization.memory}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-elastic-dark-600 rounded-lg p-4">
                  <div className="text-xs text-elastic-text-secondary uppercase mb-2">Pod Slots</div>
                  <div className="text-2xl font-semibold text-elastic-text-primary">
                    {capacity.cluster.available.pods}
                  </div>
                  <div className="text-xs text-elastic-text-secondary mt-1">
                    of {capacity.cluster.capacity.pods} available
                  </div>
                  <div className="mt-2 bg-elastic-dark-700 rounded-full h-2">
                    <div
                      className="bg-elastic-blue-600 h-2 rounded-full"
                      style={{ width: `${capacity.cluster.utilization.pods}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Resource requirement check */}
              {resourceCheck && (
                <div className={`p-4 rounded-lg border ${
                  resourceCheck.canDeploy
                    ? 'bg-green-900/20 border-green-700'
                    : 'bg-red-900/20 border-red-700'
                }`}>
                  <div className="flex items-start gap-3">
                    {resourceCheck.canDeploy ? (
                      <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                    <div className="flex-1">
                      <div className={`font-medium ${resourceCheck.canDeploy ? 'text-green-400' : 'text-red-400'}`}>
                        {resourceCheck.canDeploy
                          ? 'Sufficient resources available'
                          : 'Insufficient resources'}
                      </div>
                      <div className="text-sm text-elastic-text-secondary mt-1 space-y-1">
                        <div className="flex justify-between">
                          <span>Memory needed: {resourceCheck.memory.needed.toFixed(1)} GB</span>
                          <span className={resourceCheck.memory.sufficient ? 'text-green-400' : 'text-red-400'}>
                            {resourceCheck.memory.sufficient ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>CPU needed: ~{resourceCheck.cpu.needed.toFixed(1)} cores</span>
                          <span className={resourceCheck.cpu.sufficient ? 'text-green-400' : 'text-red-400'}>
                            {resourceCheck.cpu.sufficient ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pods needed: {resourceCheck.pods.needed}</span>
                          <span className={resourceCheck.pods.sufficient ? 'text-green-400' : 'text-red-400'}>
                            {resourceCheck.pods.sufficient ? '✓' : '✗'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Panel>
          )}

          {/* Basic Configuration */}
          <Panel>
            <PanelTitle className="mb-6">Basic Configuration</PanelTitle>

            <div className="space-y-6">
              {/* Cluster Name */}
              <div>
                <label className="block text-sm font-medium text-elastic-text-primary mb-2">
                  Cluster Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value.toLowerCase())}
                  className="w-full px-4 py-2 bg-elastic-dark-600 border border-elastic-dark-500 rounded text-elastic-text-primary focus:outline-none focus:border-elastic-blue-600"
                  placeholder="my-cluster"
                  pattern="^[a-z0-9]([-a-z0-9]*[a-z0-9])?$"
                  title="Must be lowercase letters, numbers, and hyphens only. Must start and end with alphanumeric characters."
                  required
                />
                <p className="text-xs text-elastic-text-secondary mt-1">
                  Must be lowercase letters, numbers, and hyphens only
                </p>
              </div>

              {/* Namespace Selection */}
              <div>
                <label className="block text-sm font-medium text-elastic-text-primary mb-2">
                  Namespace
                </label>
                <select
                  value={showNewNamespace ? '__new__' : formData.namespace}
                  onChange={(e) => handleNamespaceChange(e.target.value)}
                  className="w-full px-4 py-2 bg-elastic-dark-600 border border-elastic-dark-500 rounded text-elastic-text-primary focus:outline-none focus:border-elastic-blue-600"
                  required
                  disabled={namespacesLoading}
                >
                  <option value="">
                    {namespacesLoading ? 'Loading namespaces...' : 'Select a namespace'}
                  </option>
                  {namespaces.map((ns) => (
                    <option key={ns} value={ns}>
                      {ns}
                    </option>
                  ))}
                  <option value="__new__">+ Create new namespace</option>
                </select>

                {showNewNamespace && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-elastic-text-primary mb-2">
                      New Namespace Name
                    </label>
                    <input
                      type="text"
                      value={newNamespace}
                      onChange={(e) => setNewNamespace(e.target.value.toLowerCase())}
                      className="w-full px-4 py-2 bg-elastic-dark-600 border border-elastic-dark-500 rounded text-elastic-text-primary focus:outline-none focus:border-elastic-blue-600"
                      placeholder="my-namespace"
                      pattern="^[a-z0-9]([-a-z0-9]*[a-z0-9])?$"
                      title="Namespace must be lowercase alphanumeric with hyphens"
                      required
                    />
                    <p className="text-xs text-elastic-text-secondary mt-1">
                      Must be lowercase letters, numbers, and hyphens only
                    </p>
                  </div>
                )}
              </div>

              {/* Elasticsearch Version */}
              <div>
                <label className="block text-sm font-medium text-elastic-text-primary mb-2">
                  Elasticsearch Version
                </label>
                <select
                  value={formData.version}
                  onChange={(e) => handleChange('version', e.target.value)}
                  className="w-full px-4 py-2 bg-elastic-dark-600 border border-elastic-dark-500 rounded text-elastic-text-primary focus:outline-none focus:border-elastic-blue-600"
                >
                  <option value="8.11.0">8.11.0</option>
                  <option value="8.10.0">8.10.0</option>
                  <option value="8.9.0">8.9.0</option>
                  <option value="7.17.0">7.17.0</option>
                </select>
              </div>
            </div>
          </Panel>

          {/* Node Configuration */}
          <Panel>
            <PanelTitle className="mb-6">Node Configuration</PanelTitle>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-elastic-text-primary mb-2">
                  Node Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.nodeCount}
                  onChange={(e) => handleChange('nodeCount', parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 bg-elastic-dark-600 border border-elastic-dark-500 rounded text-elastic-text-primary focus:outline-none focus:border-elastic-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-elastic-text-primary mb-2">
                  Memory per Node
                </label>
                <select
                  value={formData.memory}
                  onChange={(e) => handleChange('memory', e.target.value)}
                  className="w-full px-4 py-2 bg-elastic-dark-600 border border-elastic-dark-500 rounded text-elastic-text-primary focus:outline-none focus:border-elastic-blue-600"
                >
                  <option value="512Mi">512 MB</option>
                  <option value="1Gi">1 GB</option>
                  <option value="2Gi">2 GB</option>
                  <option value="4Gi">4 GB</option>
                </select>
              </div>

              {/* Storage Configuration */}
              <div>
                <label className="block text-sm font-medium text-elastic-text-primary mb-2">
                  Storage Class
                </label>
                <select
                  value={formData.storageClass}
                  onChange={(e) => handleChange('storageClass', e.target.value)}
                  className="w-full px-4 py-2 bg-elastic-dark-600 border border-elastic-dark-500 rounded text-elastic-text-primary focus:outline-none focus:border-elastic-blue-600"
                  disabled={storageClassesLoading}
                >
                  <option value="">
                    {storageClassesLoading ? 'Loading storage classes...' : 'Select storage class'}
                  </option>
                  {storageClasses.map((sc) => (
                    <option key={sc.name} value={sc.name}>
                      {sc.name} {sc.isDefault ? '(default)' : ''}
                    </option>
                  ))}
                </select>
                {formData.storageClass && (
                  <p className="text-xs text-elastic-text-secondary mt-1">
                    {storageClasses.find(sc => sc.name === formData.storageClass)?.provisioner}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-elastic-text-primary mb-2">
                  Storage Size per Node
                </label>
                <select
                  value={formData.storageSize}
                  onChange={(e) => handleChange('storageSize', e.target.value)}
                  className="w-full px-4 py-2 bg-elastic-dark-600 border border-elastic-dark-500 rounded text-elastic-text-primary focus:outline-none focus:border-elastic-blue-600"
                  disabled={!formData.storageClass}
                >
                  <option value="5Gi">5 GB</option>
                  <option value="10Gi">10 GB</option>
                  <option value="20Gi">20 GB</option>
                  <option value="50Gi">50 GB</option>
                  <option value="100Gi">100 GB</option>
                  <option value="200Gi">200 GB</option>
                  <option value="500Gi">500 GB</option>
                </select>
                {!formData.storageClass && (
                  <p className="text-xs text-elastic-text-secondary mt-1">
                    Select a storage class first
                  </p>
                )}
              </div>
            </div>
          </Panel>

          {/* Summary */}
          <Panel>
            <PanelTitle className="mb-4">Summary</PanelTitle>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-elastic-text-secondary">Cluster Name:</span>
                <span className="text-elastic-text-primary font-medium">{formData.name || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-elastic-text-secondary">Namespace:</span>
                <span className="text-elastic-text-primary font-medium">
                  {finalNamespace || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-elastic-text-secondary">Version:</span>
                <span className="text-elastic-text-primary font-medium">{formData.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-elastic-text-secondary">Nodes:</span>
                <span className="text-elastic-text-primary font-medium">{formData.nodeCount} × {formData.memory}</span>
              </div>
              {formData.storageClass && (
                <>
                  <div className="flex justify-between">
                    <span className="text-elastic-text-secondary">Storage Class:</span>
                    <span className="text-elastic-text-primary font-medium">{formData.storageClass}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-elastic-text-secondary">Storage per Node:</span>
                    <span className="text-elastic-text-primary font-medium">{formData.storageSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-elastic-text-secondary">Total Storage:</span>
                    <span className="text-elastic-text-primary font-medium">
                      {parseInt(formData.storageSize) * formData.nodeCount} GB
                    </span>
                  </div>
                </>
              )}
            </div>
          </Panel>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button variant="secondary" type="button" onClick={() => navigate('/')}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isLoading || !formData.name || !finalNamespace}>
              {createMutation.isLoading ? 'Creating...' : 'Create Cluster'}
            </Button>
          </div>

          {createMutation.isError && (
            <div className="p-4 bg-elastic-danger/20 border border-elastic-danger rounded text-elastic-danger">
              Error creating cluster: {createMutation.error.message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ClusterCreate;
