# ECK UI - Elastic Cloud on Kubernetes Management Dashboard

A modern, user-friendly web interface for managing Elastic Stack deployments on Kubernetes using the ECK (Elastic Cloud on Kubernetes) operator.

## Overview

ECK UI provides a centralized dashboard similar to Elastic Cloud Enterprise (ECE) but designed specifically for self-managed Kubernetes environments. It fills the gap left by the official ECK operator, which currently only provides command-line (kubectl) management.

### Key Features

- **Cluster Management**: Create, view, update, and delete Elasticsearch clusters
- **Visual Monitoring**: Real-time health status and metrics dashboards
- **Multi-Namespace Support**: Manage clusters across different namespaces
- **Kibana Integration**: Deploy and manage Kibana instances
- **Modern UI**: Built with Elastic UI Framework for a consistent experience
- **Production-Ready**: TypeScript, Docker, and Kubernetes deployment support

## Architecture

```
┌─────────────────────────────────────────────┐
│     React + TypeScript + EUI Frontend       │
│              (Port 3000)                     │
└─────────────────┬───────────────────────────┘
                  │ REST API
┌─────────────────▼───────────────────────────┐
│      Node.js + Express Backend API          │
│              (Port 4000)                     │
└────────┬──────────────────────┬─────────────┘
         │                      │
         │ K8s API             │ ES API
         │                      │
┌────────▼──────────┐  ┌────────▼────────────┐
│  ECK Operator     │  │  Elasticsearch      │
│  (CRDs)           │  │  Clusters           │
└───────────────────┘  └─────────────────────┘
```

## Prerequisites

- **Kubernetes Cluster**: 1.30+ (or OpenShift 4.15+)
- **ECK Operator**: Installed and running ([Installation Guide](https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-deploy-eck.html))
- **Node.js**: 20+ (for local development)
- **Docker**: 20+ (for containerized deployment)
- **kubectl**: Configured to access your cluster

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/blakebholden/ECK_UI.git
   cd ECK_UI
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   npm install
   ```

3. **Configure environment**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env if needed
   ```

4. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

5. **Access the UI**
   - Open http://localhost:3000
   - Backend API: http://localhost:4000

### Docker Compose

```bash
docker-compose up
```

Access at http://localhost:3000

### Kubernetes Deployment

1. **Apply RBAC permissions**
   ```bash
   kubectl apply -f deploy/kubernetes/rbac.yaml
   ```

2. **Build and push Docker images**
   ```bash
   # Frontend
   docker build -f deploy/docker/Dockerfile.frontend -t your-registry/eck-ui-frontend:latest ./frontend
   docker push your-registry/eck-ui-frontend:latest

   # Backend
   docker build -f deploy/docker/Dockerfile.backend -t your-registry/eck-ui-backend:latest ./backend
   docker push your-registry/eck-ui-backend:latest
   ```

3. **Update image references in deployment.yaml**
   ```bash
   # Edit deploy/kubernetes/deployment.yaml
   # Change image: eck-ui-backend:latest to your-registry/eck-ui-backend:latest
   ```

4. **Deploy to Kubernetes**
   ```bash
   kubectl apply -f deploy/kubernetes/deployment.yaml
   kubectl apply -f deploy/kubernetes/service.yaml
   kubectl apply -f deploy/kubernetes/ingress.yaml
   ```

5. **Access the UI**
   ```bash
   # Get the service URL
   kubectl get svc -n eck-ui eck-ui-frontend

   # Or port-forward for testing
   kubectl port-forward -n eck-ui svc/eck-ui-frontend 8080:80
   ```

## Project Structure

```
ECK_UI/
├── frontend/              # React + TypeScript frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client
│   │   └── types/        # TypeScript types
│   └── package.json
│
├── backend/              # Node.js + Express backend
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Express middleware
│   │   └── utils/        # Utilities
│   └── package.json
│
├── deploy/               # Deployment configs
│   ├── docker/          # Dockerfiles
│   └── kubernetes/      # K8s manifests
│
└── docs/                # Documentation
```

## API Documentation

### Clusters

- `GET /api/v1/clusters` - List all clusters
- `GET /api/v1/clusters?namespace=default` - List clusters in namespace
- `GET /api/v1/clusters/:namespace/:name` - Get cluster details
- `POST /api/v1/clusters/:namespace` - Create cluster
- `PUT /api/v1/clusters/:namespace/:name` - Update cluster
- `DELETE /api/v1/clusters/:namespace/:name` - Delete cluster
- `GET /api/v1/clusters/:namespace/:name/health` - Get cluster health
- `GET /api/v1/clusters/:namespace/:name/stats` - Get cluster stats

### Kibana

- `GET /api/v1/kibana` - List all Kibana instances
- `GET /api/v1/kibana/:namespace/:name` - Get Kibana details

### Namespaces

- `GET /api/v1/namespaces` - List all namespaces

## Development

### Frontend

```bash
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # TypeScript checks
```

### Backend

```bash
cd backend
npm run dev          # Start dev server with watch
npm run build        # Build TypeScript
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript checks
```

## Configuration

### Backend Environment Variables

```bash
PORT=4000                              # Server port
NODE_ENV=development                   # Environment
KUBECONFIG=/path/to/kubeconfig        # Optional: Kubeconfig path
LOG_LEVEL=info                         # Logging level
CORS_ORIGIN=http://localhost:3000     # CORS origin
```

### Frontend Build Configuration

Edit `frontend/vite.config.ts` for proxy and build settings.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

### Phase 1 - Core Features (Current)
- ✅ Cluster listing and details
- ✅ Dashboard with health metrics
- ✅ Basic cluster creation
- 🚧 Cluster creation wizard
- 🚧 Real-time status updates

### Phase 2 - Advanced Management
- Cluster scaling operations
- Configuration updates
- Version upgrades
- APM Server support
- Beats management

### Phase 3 - Enterprise Features
- Security & RBAC UI
- Index lifecycle management
- Snapshot management
- Cross-cluster search
- Cost optimization

### Phase 4 - Developer Experience
- GitOps integration
- Terraform provider
- CLI companion tool
- Webhook notifications

## Troubleshooting

### Backend can't connect to Kubernetes

- Ensure kubectl is configured: `kubectl cluster-info`
- Check RBAC permissions: `kubectl get clusterrole eck-ui`
- View logs: `kubectl logs -n eck-ui deployment/eck-ui-backend`

### Frontend shows no clusters

- Check backend is running: `curl http://localhost:4000/health`
- Verify ECK operator is installed: `kubectl get pods -n elastic-system`
- Check for ECK clusters: `kubectl get elasticsearch --all-namespaces`

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- [Elastic Cloud on Kubernetes (ECK)](https://github.com/elastic/cloud-on-k8s)
- [Elastic UI Framework](https://github.com/elastic/eui)
- [ECK Manager PoC](https://github.com/robrotheram/eckmanager) - Initial inspiration

## Support

- [GitHub Issues](https://github.com/blakebholden/ECK_UI/issues)
- [Documentation](./docs/)

---

**Built with ❤️ for the Kubernetes and Elastic communities**
