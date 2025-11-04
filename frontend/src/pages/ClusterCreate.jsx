import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Panel, PanelTitle } from '../components/ui';

const ClusterCreate = () => {
  const navigate = useNavigate();

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
          <Button variant="secondary" onClick={() => navigate('/clusters')}>
            Cancel
          </Button>
        </div>

        <div className="mt-8">
          <Panel>
            <PanelTitle className="mb-4">Cluster Creation Wizard</PanelTitle>
            <p className="text-elastic-text-secondary">
              Cluster creation form will be implemented in the next phase.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default ClusterCreate;
