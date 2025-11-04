#!/bin/bash
set -e

echo "Deploying Kibana..."

kubectl apply -f - <<EOF
apiVersion: kibana.k8s.elastic.co/v1
kind: Kibana
metadata:
  name: quickstart
  namespace: elastic-test
spec:
  version: 8.13.0
  count: 1
  elasticsearchRef:
    name: quickstart
    namespace: elastic-test
  podTemplate:
    spec:
      containers:
      - name: kibana
        resources:
          limits:
            memory: 1Gi
            cpu: 1
          requests:
            memory: 1Gi
            cpu: 0.5
EOF

echo "Waiting for Kibana to be ready..."
kubectl wait --for=condition=ready pod -l kibana.k8s.elastic.co/name=quickstart -n elastic-test --timeout=300s || true

echo "✅ Kibana deployed!"
echo ""
echo "Kibana status:"
kubectl get kibana -n elastic-test

echo ""
echo "To access Kibana, run:"
echo "kubectl port-forward -n elastic-test svc/quickstart-kb-http 5601"
