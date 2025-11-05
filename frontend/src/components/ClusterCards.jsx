import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from './ui';

const ClusterCards = ({ clusters }) => {
  const navigate = useNavigate();

  const getStatusColor = (phase, health) => {
    if (phase === 'Ready' && health === 'green') return { bg: 'bg-elastic-success/20', pulse: 'bg-elastic-success' };
    if (phase === 'Ready' && health === 'yellow') return { bg: 'bg-elastic-warning/20', pulse: 'bg-elastic-warning' };
    if (phase === 'ApplyingChanges') return { bg: 'bg-elastic-warning/20', pulse: 'bg-elastic-warning' };
    return { bg: 'bg-elastic-danger/20', pulse: 'bg-elastic-danger' };
  };

  const getIntTypeInfo = (namespace) => {
    const intTypeMap = {
      'production': { type: 'CIP-FUSION', icon: '🎯', bg: '#fff1f0', text: '#cf1322', desc: 'All-source fusion center' },
      'staging': { type: 'HUMINT', icon: '👤', bg: '#e6f4ff', text: '#0958d9', desc: 'Human intelligence' },
      'development': { type: 'SIGINT', icon: '📡', bg: '#f0f5ff', text: '#531dab', desc: 'Signals intelligence' },
      'elastic-test': { type: 'OSINT', icon: '🌐', bg: '#f6ffed', text: '#389e0d', desc: 'Open-source intelligence' },
      'analytics': { type: 'MASINT', icon: '📊', bg: '#fff0f6', text: '#c41d7f', desc: 'Measurement & signature' },
      'logging': { type: 'IMINT', icon: '🛰️', bg: '#e6fffb', text: '#006d75', desc: 'Imagery intelligence' },
    };
    return intTypeMap[namespace] || { type: 'ECK', icon: '⚙️', bg: '#f0f0f0', text: '#595959', desc: 'Kubernetes cluster' };
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {clusters?.map((cluster) => {
        const statusColors = getStatusColor(cluster.status?.phase, cluster.status?.health);
        const intType = getIntTypeInfo(cluster.metadata?.namespace);

        return (
          <div
            key={`${cluster.metadata?.namespace}-${cluster.metadata?.name}`}
            onClick={() => navigate(`/clusters/${cluster.metadata?.namespace}/${cluster.metadata?.name}`)}
            className="bg-elastic-dark-700 border border-elastic-dark-600 rounded-lg p-5 cursor-pointer transition-all hover:border-elastic-blue-600 hover:shadow-lg hover:shadow-elastic-blue-600/20 hover:-translate-y-1"
          >
            {/* Header with Status Indicator */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className={`w-3 h-3 rounded-full ${statusColors.pulse} animate-pulse`}></span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-elastic-text-primary">
                    {cluster.metadata?.name}
                  </h3>
                  <p className="text-xs text-elastic-text-tertiary">{cluster.metadata?.namespace}</p>
                </div>
              </div>
              <span className="text-xs bg-elastic-dark-600 text-elastic-text-secondary px-2 py-1 rounded">
                🔧 Self-Managed
              </span>
            </div>

            {/* INT Type Badge */}
            <div
              className="mb-4 py-2 px-3 rounded-md text-center text-sm font-bold border-2"
              style={{
                backgroundColor: intType.bg,
                color: intType.text,
                borderColor: intType.text
              }}
            >
              <span className="mr-2">{intType.icon}</span>
              {intType.type}
            </div>

            {/* Cluster Info */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-elastic-text-secondary">Version:</span>
                <span className="text-elastic-text-primary font-medium">{cluster.spec?.version}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-elastic-text-secondary">Status:</span>
                <Badge status={cluster.status?.phase === 'Ready' && cluster.status?.health === 'green' ? 'healthy' : 'warning'}>
                  {cluster.status?.phase || 'Unknown'}
                </Badge>
              </div>
            </div>

            {/* Health Metrics */}
            {cluster.status && (
              <div className="pt-4 border-t border-elastic-dark-600">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-elastic-text-secondary font-medium">HEALTH</span>
                  <Badge
                    status={
                      cluster.status.health === 'green' ? 'healthy' :
                      cluster.status.health === 'yellow' ? 'warning' :
                      'error'
                    }
                    className="uppercase text-xs"
                  >
                    {cluster.status.health || 'unknown'}
                  </Badge>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-elastic-blue-600">
                      {cluster.status.availableNodes || 0}
                    </div>
                    <div className="text-xs text-elastic-text-tertiary uppercase tracking-wide">Nodes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-elastic-blue-600">
                      {cluster.spec?.nodeSets?.reduce((sum, ns) => sum + ns.count, 0) || 0}
                    </div>
                    <div className="text-xs text-elastic-text-tertiary uppercase tracking-wide">Sets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-elastic-blue-600">
                      {cluster.spec?.nodeSets?.length || 0}
                    </div>
                    <div className="text-xs text-elastic-text-tertiary uppercase tracking-wide">Types</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ClusterCards;
