import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clustersApi, capacityApi } from '../services/api';

const ClusterDetail = () => {
  const { namespace, name } = useParams();
  const navigate = useNavigate();
  const [selectedView, setSelectedView] = useState('grid'); // grid or list
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['cluster-details', namespace, name],
    queryFn: () => clustersApi.getDetails(namespace, name),
    enabled: !!namespace && !!name,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: capacity } = useQuery({
    queryKey: ['capacity'],
    queryFn: () => capacityApi.get(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: credentials } = useQuery({
    queryKey: ['cluster-credentials', namespace, name],
    queryFn: () => clustersApi.getCredentials(namespace, name),
    enabled: !!namespace && !!name,
  });

  const { data: kibanaUrlData } = useQuery({
    queryKey: ['kibana-url', namespace, name],
    queryFn: () => clustersApi.getKibanaUrl(namespace, name),
    enabled: !!namespace && !!name,
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const handleDeleteCluster = async () => {
    try {
      await clustersApi.delete(namespace, name);
      navigate('/');
    } catch (error) {
      console.error('Failed to delete cluster:', error);
      alert('Failed to delete cluster. Please try again.');
    }
  };

  const handleEditDeployment = () => {
    // Navigate to edit page or open edit modal
    alert('Edit deployment functionality coming soon!');
    setShowActionsMenu(false);
  };

  const handleResetPassword = () => {
    // Reset password functionality
    alert('Reset password functionality coming soon!');
    setShowActionsMenu(false);
  };

  const getHealthStatus = (cluster) => {
    const phase = cluster?.status?.phase;
    const health = cluster?.status?.health;

    if (phase === 'Ready' && health === 'green') {
      return { status: 'HEALTHY', color: 'green', hasWarnings: false };
    }
    if (phase === 'Ready' && health === 'yellow') {
      return { status: 'HEALTHY, WITH WARNINGS', color: 'yellow', hasWarnings: true };
    }
    if (phase === 'Pending' || phase === 'ApplyingChanges') {
      return { status: 'DEPLOYING', color: 'blue', hasWarnings: false };
    }
    return { status: 'UNHEALTHY', color: 'red', hasWarnings: true };
  };

  const getPodZone = (pod) => {
    // Extract zone from pod topology or node affinity
    const zone = pod.spec?.nodeSelector?.['topology.kubernetes.io/zone'] ||
                 pod.spec?.nodeName?.split('-').pop() ||
                 'default';
    return zone;
  };

  const groupPodsByZone = (pods) => {
    const grouped = {};
    pods.forEach(pod => {
      const zone = getPodZone(pod);
      if (!grouped[zone]) {
        grouped[zone] = [];
      }
      grouped[zone].push(pod);
    });
    return grouped;
  };

  const getPodStatus = (pod) => {
    const phase = pod.status?.phase;
    if (phase === 'Running') return { status: 'Healthy', color: 'green' };
    if (phase === 'Pending') return { status: 'Starting', color: 'yellow' };
    return { status: 'Error', color: 'red' };
  };

  const getServiceEndpoint = (service, port = 9200) => {
    if (!service) return null;
    const clusterIP = service.spec?.clusterIP;
    return clusterIP ? `https://${clusterIP}:${port}` : null;
  };

  // Calculate which nodes are hosting this cluster's pods
  const clusterNodeMetrics = useMemo(() => {
    if (!capacity || !data?.pods) return null;

    const clusterPods = data.pods;
    const nodeNames = new Set(clusterPods.map(pod => pod.spec?.nodeName).filter(Boolean));

    const relevantNodes = capacity.nodes.filter(node => nodeNames.has(node.name));

    return {
      nodes: relevantNodes,
      totalNodes: relevantNodes.length,
      totalPods: clusterPods.length,
    };
  }, [capacity, data]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold mb-2 text-elastic-text-primary">
            Error loading cluster
          </h2>
          <p className="text-elastic-text-secondary mb-6">
            {error.message || 'Unable to fetch cluster details'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-elastic-blue-600 text-white rounded hover:bg-elastic-blue-700"
          >
            Back to Dashboard
          </button>
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

  if (!data || !data.cluster) {
    return null;
  }

  const { cluster, pods = [], services = [], events = [], kibana, kibanaService } = data;
  const healthInfo = getHealthStatus(cluster);
  const podsByZone = groupPodsByZone(pods);
  const esService = services.find(s => s.metadata?.name?.includes('-es-http'));
  const esEndpoint = getServiceEndpoint(esService, 9200);
  const kibanaEndpoint = kibanaService ? getServiceEndpoint(kibanaService, 5601) : null;

  // Generate a cluster ID (in real implementation, this would come from the cluster)
  const clusterId = `${name}:${btoa(`${namespace}:${name}:${Math.random().toString(36)}`).substring(0, 40)}`;

  // Filter events to only show those related to this cluster's resources
  const clusterResourceNames = new Set([
    cluster.metadata?.name,
    ...pods.map(p => p.metadata?.name),
    ...services.map(s => s.metadata?.name),
    kibana?.metadata?.name,
    kibanaService?.metadata?.name
  ].filter(Boolean));

  const warningEvents = events
    .filter(e => e.type === 'Warning')
    .filter(e => {
      const involvedName = e.involvedObject?.name;
      const involvedKind = e.involvedObject?.kind;
      // Include events for the cluster itself, its pods, services, and related resources
      return involvedName && (
        clusterResourceNames.has(involvedName) ||
        involvedName.startsWith(`${name}-`) ||
        (involvedKind === 'Elasticsearch' && involvedName === name)
      );
    })
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-elastic-dark-900 flex">
      {/* Left Sidebar */}
      <div className="w-56 bg-elastic-dark-800 border-r border-elastic-dark-700 flex-shrink-0">
        <div className="p-4">
          {/* Self-Managed deployments link */}
          <Link to="/" className="text-elastic-blue-500 hover:text-elastic-blue-400 text-sm block mb-2">
            Self-Managed Deployments
          </Link>

          {/* Cluster name */}
          <div className="mb-4">
            <Link to={`/clusters/${namespace}/${name}`} className="text-elastic-blue-500 hover:text-elastic-blue-400 font-medium block mb-2">
              {name.toUpperCase()}
            </Link>
            <button className="text-sm text-elastic-text-secondary hover:text-elastic-text-primary block mb-2">
              Edit
            </button>
          </div>

          {/* Monitoring section */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <button className="text-elastic-text-primary hover:text-elastic-blue-500 flex items-center gap-2">
                Monitoring
                {healthInfo.hasWarnings && (
                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            <div className="ml-4 space-y-1">
              <button className="text-sm text-elastic-text-secondary hover:text-elastic-text-primary block">
                Logs and metrics
              </button>
              <button className="text-sm text-elastic-text-secondary hover:text-elastic-text-primary block">
                Performance
              </button>
            </div>
          </div>

          {/* Elasticsearch section */}
          <div className="mb-4">
            <button className="text-elastic-text-primary hover:text-elastic-blue-500 mb-2">
              Elasticsearch
            </button>
            <div className="ml-4 space-y-1">
              <button className="text-sm text-elastic-text-secondary hover:text-elastic-text-primary block">
                Snapshots
              </button>
              <button className="text-sm text-elastic-text-secondary hover:text-elastic-text-primary block">
                API console
              </button>
            </div>
          </div>

          {/* Kibana */}
          <button className="text-elastic-text-primary hover:text-elastic-blue-500 mb-2 block">
            Kibana
          </button>

          {/* Integrations Server */}
          <button className="text-elastic-text-primary hover:text-elastic-blue-500 mb-2 block">
            Integrations Server
          </button>

          {/* Activity */}
          <button className="text-elastic-text-primary hover:text-elastic-blue-500 mb-2 block">
            Activity
          </button>

          {/* Security */}
          <button className="text-elastic-text-primary hover:text-elastic-blue-500 mb-4 block">
            Security
          </button>

          {/* Divider */}
          <div className="border-t border-elastic-dark-700 my-4"></div>

          {/* Serverless projects */}
          <button className="text-elastic-text-primary hover:text-elastic-blue-500 mb-2 block">
            Serverless projects
          </button>

          {/* Connected clusters */}
          <button className="text-elastic-text-primary hover:text-elastic-blue-500 mb-4 block">
            Connected clusters
          </button>

          {/* Access and security (expandable) */}
          <div className="mb-2">
            <button className="text-elastic-text-primary hover:text-elastic-blue-500 flex items-center gap-2 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Access and security
            </button>
            <div className="ml-6 space-y-1">
              <button className="text-sm text-elastic-text-secondary hover:text-elastic-text-primary block">
                Network security
              </button>
              <button className="text-sm text-elastic-text-secondary hover:text-elastic-text-primary block">
                Trust management
              </button>
            </div>
          </div>

          {/* Extensions */}
          <button className="text-elastic-text-primary hover:text-elastic-blue-500 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
            Extensions
          </button>

          {/* Organization (expandable) */}
          <div>
            <button className="text-elastic-text-primary hover:text-elastic-blue-500 flex items-center gap-2 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Organization
            </button>
            <div className="ml-6 space-y-1">
              <button className="text-sm text-elastic-text-secondary hover:text-elastic-text-primary block">
                Members
              </button>
              <button className="text-sm text-elastic-text-secondary hover:text-elastic-text-primary block">
                Contacts
              </button>
              <button className="text-sm text-elastic-text-secondary hover:text-elastic-text-primary block">
                API keys
              </button>
              <button className="text-sm text-elastic-text-secondary hover:text-elastic-text-primary block">
                Security
              </button>
            </div>
          </div>

          {/* Billing */}
          <button className="text-elastic-text-primary hover:text-elastic-blue-500 mt-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Billing and subscription
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-auto">
        {/* Breadcrumb */}
        <div className="bg-elastic-dark-800 border-b border-elastic-dark-700 px-8 py-3">
          <div className="flex items-center text-sm text-elastic-text-secondary">
            <Link to="/" className="hover:text-elastic-blue-500">ECK</Link>
            <span className="mx-2">/</span>
            <Link to="/" className="hover:text-elastic-blue-500">Self-Managed Deployments</Link>
            <span className="mx-2">/</span>
            <span className="text-elastic-text-primary">{name.toUpperCase()}</span>
          </div>
        </div>

        {/* Header */}
        <div className="bg-elastic-dark-800 border-b border-elastic-dark-700 px-8 py-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-semibold text-elastic-text-primary mb-3">
              {name.toUpperCase()}
            </h1>
            <div className="flex items-center gap-4">
              {/* Health Status */}
              <div className="flex items-center gap-2">
                {healthInfo.color === 'green' && (
                  <span className="px-3 py-1 bg-green-900/40 text-green-400 border border-green-700 rounded text-sm font-medium">
                    {healthInfo.status}
                  </span>
                )}
                {healthInfo.color === 'yellow' && (
                  <span className="px-3 py-1 bg-yellow-900/40 text-yellow-400 border border-yellow-700 rounded text-sm font-medium">
                    {healthInfo.status}
                  </span>
                )}
                {healthInfo.color === 'blue' && (
                  <span className="px-3 py-1 bg-blue-900/40 text-blue-400 border border-blue-700 rounded text-sm font-medium">
                    {healthInfo.status}
                  </span>
                )}
                {healthInfo.color === 'red' && (
                  <span className="px-3 py-1 bg-red-900/40 text-red-400 border border-red-700 rounded text-sm font-medium">
                    {healthInfo.status}
                  </span>
                )}
                {healthInfo.hasWarnings && (
                  <button className="text-elastic-blue-500 hover:text-elastic-blue-400 text-sm">
                    View issues
                  </button>
                )}
              </div>

              {/* Region Info */}
              <span className="text-elastic-text-secondary text-sm flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {namespace === 'production' && 'AWS - N. Virginia (us-east-1)'}
                {namespace === 'staging' && 'AWS - Washington DC (us-east-2)'}
                {namespace === 'development' && 'AWS - San Francisco (us-west-1)'}
                {!['production', 'staging', 'development'].includes(namespace) && `Namespace: ${namespace}`}
              </span>

              {/* Deployment ID */}
              <span className="text-elastic-text-secondary text-sm">
                Deployment ID <span className="text-elastic-blue-500 hover:text-elastic-blue-400 cursor-pointer">
                  {cluster.metadata?.uid?.substring(0, 6) || 'e69039'}
                </span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-elastic-dark-700 hover:bg-elastic-dark-600 text-elastic-text-primary border border-elastic-dark-600 rounded">
              Open AutoOps
            </button>
            {kibanaUrlData?.available && kibanaUrlData?.url && (
              <button
                onClick={() => window.open(kibanaUrlData.url, '_blank')}
                className="px-4 py-2 bg-elastic-blue-600 hover:bg-elastic-blue-700 text-white rounded"
              >
                Open Kibana
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="px-4 py-2 bg-elastic-dark-700 hover:bg-elastic-dark-600 text-elastic-text-primary border border-elastic-dark-600 rounded flex items-center gap-2"
              >
                Actions
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showActionsMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-elastic-dark-700 border border-elastic-dark-600 rounded shadow-xl z-10">
                  <button
                    onClick={handleEditDeployment}
                    className="w-full px-4 py-2 text-left hover:bg-elastic-dark-600 text-elastic-text-primary"
                  >
                    Edit deployment
                  </button>
                  <button
                    onClick={handleResetPassword}
                    className="w-full px-4 py-2 text-left hover:bg-elastic-dark-600 text-elastic-text-primary"
                  >
                    Reset password
                  </button>
                  <button
                    onClick={() => {
                      setShowActionsMenu(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-elastic-dark-600 text-red-400"
                  >
                    Delete deployment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deployment Info */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <label className="text-elastic-text-secondary block mb-1">Connection alias</label>
                <button className="text-elastic-blue-500 hover:text-elastic-blue-400 flex items-center gap-1">
                  {name}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              <div>
                <label className="text-elastic-text-secondary block mb-1">Hardware profile</label>
                <button className="text-elastic-blue-500 hover:text-elastic-blue-400 flex items-center gap-1">
                  Vector search optimized (ARM)
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              <div>
                <label className="text-elastic-text-secondary block mb-1">Deployment version</label>
                <div className="flex items-center gap-2">
                  <span className="text-elastic-text-primary">v{cluster.spec?.version || '8.11.0'}</span>
                  <button className="text-elastic-blue-500 hover:text-elastic-blue-400 text-sm">
                    Upgrade
                  </button>
                </div>
              </div>
            </div>

            {/* Cluster ID */}
            <div className="bg-elastic-dark-800 border border-elastic-dark-700 rounded p-4">
              <div className="flex justify-between items-start mb-2">
                <label className="text-elastic-text-secondary text-sm">Cluster ID</label>
                <button
                  onClick={() => copyToClipboard(clusterId)}
                  className="text-elastic-blue-500 hover:text-elastic-blue-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <code className="text-elastic-text-primary text-sm break-all font-mono">{clusterId}</code>
            </div>

            {/* Credentials */}
            {credentials && (
              <div className="bg-elastic-dark-800 border border-elastic-dark-700 rounded p-4">
                <label className="text-elastic-text-secondary text-sm block mb-3">Elasticsearch Credentials</label>

                {/* Username */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-elastic-text-secondary">Username</span>
                    <button
                      onClick={() => copyToClipboard(credentials.username)}
                      className="text-elastic-blue-500 hover:text-elastic-blue-400 text-xs"
                    >
                      Copy
                    </button>
                  </div>
                  <code className="text-elastic-text-primary text-sm font-mono">{credentials.username}</code>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-elastic-text-secondary">Password</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-elastic-blue-500 hover:text-elastic-blue-400 text-xs"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => copyToClipboard(credentials.password)}
                        className="text-elastic-blue-500 hover:text-elastic-blue-400 text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <code className="text-elastic-text-primary text-sm font-mono break-all">
                    {showPassword ? credentials.password : '••••••••••••••••••••'}
                  </code>
                </div>
              </div>
            )}

            {/* Applications */}
            <div className="bg-elastic-dark-800 border border-elastic-dark-700 rounded p-6">
              <div className="flex items-center gap-2 mb-6">
                <h3 className="text-elastic-text-primary font-medium text-lg">Applications</h3>
                <svg className="w-5 h-5 text-elastic-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <div className="space-y-4">
                {/* Elasticsearch */}
                <div className="flex justify-between items-start py-3 border-b border-elastic-dark-700">
                  <div className="flex-1">
                    <div className="font-medium text-elastic-text-primary mb-2">Elasticsearch</div>
                    <div className="flex gap-3 text-sm">
                      <button
                        onClick={() => esEndpoint && copyToClipboard(esEndpoint)}
                        className="text-elastic-blue-500 hover:text-elastic-blue-400"
                      >
                        Copy endpoint
                      </button>
                      <button
                        onClick={() => copyToClipboard(cluster.metadata?.name)}
                        className="text-elastic-blue-500 hover:text-elastic-blue-400"
                      >
                        Copy cluster ID
                      </button>
                    </div>
                  </div>
                </div>

                {/* Kibana */}
                {kibana && (
                  <div className="flex justify-between items-start py-3 border-b border-elastic-dark-700">
                    <div className="flex-1">
                      <div className="font-medium text-elastic-text-primary mb-2">Kibana</div>
                      <div className="flex gap-3 text-sm">
                        <button
                          onClick={() => kibanaEndpoint && copyToClipboard(kibanaEndpoint)}
                          className="text-elastic-blue-500 hover:text-elastic-blue-400"
                        >
                          Copy endpoint
                        </button>
                        <button
                          onClick={() => copyToClipboard(kibana.metadata?.name)}
                          className="text-elastic-blue-500 hover:text-elastic-blue-400"
                        >
                          Copy component ID
                        </button>
                        <button
                          onClick={() => window.open(kibanaEndpoint, '_blank')}
                          className="text-elastic-blue-500 hover:text-elastic-blue-400"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* APM (placeholder) */}
                <div className="flex justify-between items-start py-3 border-b border-elastic-dark-700">
                  <div className="flex-1">
                    <div className="font-medium text-elastic-text-primary mb-2">APM</div>
                    <div className="flex gap-3 text-sm">
                      <button className="text-elastic-blue-500 hover:text-elastic-blue-400">
                        Copy endpoint
                      </button>
                      <button className="text-elastic-blue-500 hover:text-elastic-blue-400">
                        Copy component ID
                      </button>
                    </div>
                  </div>
                </div>

                {/* Fleet (placeholder) */}
                <div className="flex justify-between items-start py-3">
                  <div className="flex-1">
                    <div className="font-medium text-elastic-text-primary mb-2">Fleet</div>
                    <div className="flex gap-3 text-sm">
                      <button className="text-elastic-blue-500 hover:text-elastic-blue-400">
                        Copy endpoint
                      </button>
                      <button className="text-elastic-blue-500 hover:text-elastic-blue-400">
                        Copy component ID
                      </button>
                      <button className="text-elastic-blue-500 hover:text-elastic-blue-400">
                        Open
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-elastic-dark-800 border border-elastic-dark-700 rounded p-6">
              <h3 className="text-elastic-text-primary font-medium mb-4">Tags</h3>
              <button className="text-elastic-blue-500 hover:text-elastic-blue-400 text-sm">
                + Add tags
              </button>
            </div>

            {/* Instances */}
            <div className="bg-elastic-dark-800 border border-elastic-dark-700 rounded p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-elastic-text-primary font-medium text-lg">Instances</h3>
                <div className="flex gap-4 items-center">
                  <select className="bg-elastic-dark-700 border border-elastic-dark-600 rounded px-3 py-1 text-sm text-elastic-text-primary">
                    <option>Health</option>
                  </select>
                  <select className="bg-elastic-dark-700 border border-elastic-dark-600 rounded px-3 py-1 text-sm text-elastic-text-primary">
                    <option>Instance configuration</option>
                  </select>
                  <select className="bg-elastic-dark-700 border border-elastic-dark-600 rounded px-3 py-1 text-sm text-elastic-text-primary">
                    <option>Data tier</option>
                  </select>
                  <div className="flex gap-1 border border-elastic-dark-600 rounded">
                    <button
                      onClick={() => setSelectedView('grid')}
                      className={`p-1 ${selectedView === 'grid' ? 'bg-elastic-dark-600' : ''}`}
                    >
                      <svg className="w-5 h-5 text-elastic-text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedView('list')}
                      className={`p-1 ${selectedView === 'list' ? 'bg-elastic-dark-600' : ''}`}
                    >
                      <svg className="w-5 h-5 text-elastic-text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Pod instances grouped by zone */}
              {Object.entries(podsByZone).map(([zone, zonePods]) => (
                <div key={zone} className="mb-6">
                  <h4 className="text-elastic-text-primary font-medium mb-3">Zone {zone}</h4>
                  <div className={selectedView === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-2'}>
                    {zonePods.map((pod, idx) => {
                      const status = getPodStatus(pod);
                      const containers = pod.spec?.containers || [];
                      const memory = containers[0]?.resources?.requests?.memory || '1Gi';
                      const memoryGb = memory.replace('Gi', ' GB').replace('Mi', ' MB');

                      // Mock disk allocation (in real implementation, get from PVC metrics)
                      const diskUsedMb = Math.floor(Math.random() * 2000) + 500;
                      const diskTotalGb = 48;
                      const diskPercent = (diskUsedMb / (diskTotalGb * 1024)) * 100;

                      // Mock instance type
                      const instanceType = idx === 0 ? 'AWS.ES.DATAHOT.R6GD' :
                                          idx === 1 ? 'AWS.ES.ML.C5D-V1' :
                                          'AWS.INTEGRATIONSSERVER.C6GD-V1';

                      // Node roles (mock based on pod name/index)
                      const nodeRoles = idx === 0
                        ? ['data_hot', 'data_content', 'master', 'coordinating', 'ingest']
                        : idx === 1
                        ? ['ml']
                        : ['ingest'];

                      return (
                        <div
                          key={idx}
                          className="bg-elastic-dark-700 border border-elastic-dark-600 rounded p-4"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                status.color === 'green' ? 'bg-green-500' :
                                status.color === 'yellow' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}></div>
                              <span className="text-elastic-text-primary font-medium">
                                Instance #{idx + 1}
                              </span>
                            </div>
                            <button className="text-elastic-text-secondary hover:text-elastic-text-primary">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                          </div>

                          <div className="text-xs text-elastic-text-secondary mb-3">
                            {status.status} • v{cluster.spec?.version || '8.11.0'} • {memoryGb} • {instanceType} • {nodeRoles.join(' • ')}
                          </div>

                          {/* Disk allocation */}
                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-elastic-text-secondary">Disk allocation</span>
                              <span className="text-xs text-elastic-text-primary">
                                {diskPercent.toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-elastic-text-primary font-medium">
                                {diskUsedMb} MB / {diskTotalGb} GB
                              </span>
                            </div>
                            <div className="w-full bg-elastic-dark-900 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  diskPercent > 80 ? 'bg-red-500' :
                                  diskPercent > 60 ? 'bg-yellow-500' :
                                  'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(diskPercent, 100)}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* JVM memory pressure (only for certain instance types) */}
                          {idx === 0 && (
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-elastic-text-secondary">JVM memory pressure</span>
                              </div>
                              <div className="text-xs text-elastic-text-primary mb-1">
                                Normal
                              </div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-elastic-text-primary">16%</span>
                              </div>
                              <div className="w-full bg-elastic-dark-900 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-green-500" style={{ width: '16%' }}></div>
                              </div>
                            </div>
                          )}

                          {/* Native memory pressure for Kibana instances */}
                          {idx === 2 && (
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-elastic-text-secondary">Native memory pressure</span>
                              </div>
                              <div className="text-xs text-elastic-text-primary mb-1">
                                Normal
                              </div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-elastic-text-primary">56%</span>
                              </div>
                              <div className="w-full bg-elastic-dark-900 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-yellow-500" style={{ width: '56%' }}></div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {pods.length === 0 && (
                <div className="text-center py-8 text-elastic-text-secondary">
                  No instances found
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Warnings/Issues */}
            {warningEvents.length > 0 && (
              <div className="bg-elastic-dark-800 border border-yellow-700 rounded p-6">
                <h3 className="text-yellow-400 font-medium mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Recent Warnings
                </h3>
                <div className="space-y-2 text-sm">
                  {warningEvents.map((event, idx) => (
                    <div key={idx} className="text-elastic-text-secondary">
                      • {event.message || event.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Node Metrics */}
            {clusterNodeMetrics && clusterNodeMetrics.nodes.length > 0 && (
              <div className="bg-elastic-dark-800 border border-elastic-dark-700 rounded p-6">
                <h3 className="text-elastic-text-primary font-medium mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                  Node Resources
                </h3>

                <div className="text-sm text-elastic-text-secondary mb-4">
                  Running on {clusterNodeMetrics.totalNodes} {clusterNodeMetrics.totalNodes === 1 ? 'node' : 'nodes'}
                  {' '}({clusterNodeMetrics.totalPods} {clusterNodeMetrics.totalPods === 1 ? 'pod' : 'pods'})
                </div>

                <div className="space-y-4">
                  {clusterNodeMetrics.nodes.map((node, idx) => {
                    const cpuUtil = node.allocatable.cpu > 0
                      ? (node.used.cpu / node.allocatable.cpu) * 100
                      : 0;
                    const memUtil = node.allocatable.memory > 0
                      ? (node.used.memory / node.allocatable.memory) * 100
                      : 0;

                    return (
                      <div key={idx} className="border-t border-elastic-dark-700 pt-4 first:border-t-0 first:pt-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${node.ready ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-elastic-text-primary font-medium text-sm">{node.name}</span>
                          </div>
                          <span className="text-xs text-elastic-text-secondary">
                            {node.used.pods} pods
                          </span>
                        </div>

                        {/* CPU Usage */}
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-elastic-text-secondary">CPU</span>
                            <span className="text-xs text-elastic-text-primary">
                              {node.used.cpu.toFixed(2)} / {node.allocatable.cpu.toFixed(2)} cores
                            </span>
                          </div>
                          <div className="w-full bg-elastic-dark-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                cpuUtil > 80 ? 'bg-red-500' :
                                cpuUtil > 60 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(cpuUtil, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-elastic-text-secondary mt-1">
                            {cpuUtil.toFixed(1)}% utilized
                          </div>
                        </div>

                        {/* Memory Usage */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-elastic-text-secondary">Memory</span>
                            <span className="text-xs text-elastic-text-primary">
                              {node.used.memory.toFixed(2)} / {node.allocatable.memory.toFixed(2)} GB
                            </span>
                          </div>
                          <div className="w-full bg-elastic-dark-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                memUtil > 80 ? 'bg-red-500' :
                                memUtil > 60 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(memUtil, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-elastic-text-secondary mt-1">
                            {memUtil.toFixed(1)}% utilized
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-elastic-dark-800 border border-elastic-dark-600 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-elastic-text-primary mb-4">
              Delete Deployment
            </h3>
            <p className="text-elastic-text-secondary mb-6">
              Are you sure you want to delete <span className="text-elastic-text-primary font-medium">{name}</span>?
              This action cannot be undone and will permanently delete the cluster and all its data.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-elastic-dark-700 hover:bg-elastic-dark-600 text-elastic-text-primary border border-elastic-dark-600 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCluster}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClusterDetail;
