#!/bin/bash
set -e

echo "Installing ECK Operator..."

# Install CRDs
echo "1. Installing CRDs..."
kubectl create -f https://download.elastic.co/downloads/eck/2.12.0/crds.yaml

# Install operator
echo "2. Installing operator..."
kubectl apply -f https://download.elastic.co/downloads/eck/2.12.0/operator.yaml

# Wait for operator to be ready
echo "3. Waiting for operator to be ready..."
kubectl wait --for=condition=ready pod -l control-plane=elastic-operator -n elastic-system --timeout=300s

echo "✅ ECK Operator installed successfully!"
kubectl get pods -n elastic-system
