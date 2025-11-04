#!/bin/bash
set -e

echo "Deploying test Elasticsearch cluster..."

# Create namespace
kubectl create namespace elastic-test --dry-run=client -o yaml | kubectl apply -f -

# Deploy Elasticsearch cluster
kubectl apply -f - <<EOF
apiVersion: elasticsearch.k8s.elastic.co/v1
kind: Elasticsearch
metadata:
  name: quickstart
  namespace: elastic-test
spec:
  version: 8.13.0
  nodeSets:
  - name: default
    count: 2
    config:
      node.store.allow_mmap: false
    podTemplate:
      spec:
        containers:
        - name: elasticsearch
          resources:
            limits:
              memory: 2Gi
              cpu: 1
            requests:
              memory: 2Gi
              cpu: 0.5
EOF

echo "Waiting for Elasticsearch cluster to be ready (this may take 5-10 minutes)..."
kubectl wait --for=jsonpath='{.status.health}'=green elasticsearch/quickstart -n elastic-test --timeout=600s || true

echo "✅ Elasticsearch cluster deployed!"
echo ""
echo "Cluster status:"
kubectl get elasticsearch -n elastic-test

echo ""
echo "To get the password:"
echo "kubectl get secret quickstart-es-elastic-user -n elastic-test -o go-template='{{.data.elastic | base64decode}}'"
