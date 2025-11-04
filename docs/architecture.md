# ECK UI Architecture

## Overview

ECK UI is designed as a three-tier application that provides a web-based management interface for Elastic Cloud on Kubernetes deployments.

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Presentation Layer                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │   React 18 + TypeScript                                │  │
│  │   - Elastic UI Framework (EUI) Components              │  │
│  │   - React Query for state management                   │  │
│  │   - React Router for navigation                        │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTPS/REST
┌────────────────────────▼─────────────────────────────────────┐
│                    Application Layer                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │   Node.js + Express + TypeScript                       │  │
│  │   - RESTful API endpoints                              │  │
│  │   - Authentication & Authorization middleware          │  │
│  │   - Request validation                                 │  │
│  │   - Error handling                                     │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────┬────────────────────────────┬───────────────────────┘
          │                            │
          │ Kubernetes API             │ Elasticsearch API
          │                            │
┌─────────▼──────────────┐   ┌─────────▼─────────────────────┐
│   Data/Control Layer   │   │    Monitoring Layer           │
│  ┌──────────────────┐  │   │  ┌─────────────────────────┐  │
│  │  ECK Operator    │  │   │  │  Elasticsearch REST API │  │
│  │  - CRDs          │  │   │  │  - Cluster health       │  │
│  │  - Events        │  │   │  │  - Statistics           │  │
│  │  - Metrics       │  │   │  │  - Index info           │  │
│  └──────────────────┘  │   │  └─────────────────────────┘  │
└────────────────────────┘   └───────────────────────────────┘
```

## Component Details

### Frontend Layer

**Technology Stack:**
- React 18.2+ with TypeScript
- Elastic UI Framework (EUI) 95.0+
- React Query for server state
- React Router v6 for routing
- Vite for build tooling

**Key Responsibilities:**
- Render user interface using EUI components
- Handle user interactions and form submissions
- Manage client-side routing
- Cache and synchronize server state
- Display real-time cluster status updates

**Key Components:**
- `Dashboard`: Overview of all clusters
- `ClusterList`: Paginated table of clusters
- `ClusterDetail`: Detailed cluster information
- `ClusterCreate`: Wizard for creating new clusters
- `Layout`: Common layout with header and navigation

### Backend Layer

**Technology Stack:**
- Node.js 20+ with TypeScript
- Express.js for HTTP server
- @kubernetes/client-node for K8s API
- @elastic/elasticsearch for ES API
- Winston for logging

**Key Responsibilities:**
- Expose RESTful API endpoints
- Proxy requests to Kubernetes API
- Query Elasticsearch clusters for metrics
- Handle authentication and authorization
- Validate and sanitize requests
- Log all operations

**Services:**
- `KubernetesService`: Manages CRD operations
- `ElasticsearchService`: Queries cluster health and stats

**Routes:**
- `/api/v1/clusters`: Cluster CRUD operations
- `/api/v1/kibana`: Kibana instance operations
- `/api/v1/namespaces`: Namespace listing

### Data Flow

#### Listing Clusters

```
User → Frontend → GET /api/v1/clusters
                      ↓
                  Backend validates request
                      ↓
                  KubernetesService.listElasticsearchClusters()
                      ↓
                  K8s API: GET /apis/elasticsearch.k8s.elastic.co/v1/elasticsearches
                      ↓
                  Backend enriches response
                      ↓
                  Frontend receives cluster list
                      ↓
                  React Query caches data
                      ↓
                  ClusterList component renders table
```

#### Getting Cluster Health

```
User → ClusterDetail page → GET /api/v1/clusters/:ns/:name/health
                                  ↓
                              Backend validates request
                                  ↓
                              ElasticsearchService.getClusterHealth()
                                  ↓
                              K8s API: GET secret (credentials)
                                  ↓
                              ES API: GET /_cluster/health
                                  ↓
                              Backend returns health data
                                  ↓
                              Frontend displays health badge
```

#### Creating a Cluster

```
User → ClusterCreate form → Submit
                                ↓
                            Frontend validates input
                                ↓
                            POST /api/v1/clusters/:namespace
                                ↓
                            Backend validates spec
                                ↓
                            KubernetesService.createElasticsearchCluster()
                                ↓
                            K8s API: POST Elasticsearch CRD
                                ↓
                            ECK Operator reconciles
                                ↓
                            Backend returns created cluster
                                ↓
                            Frontend navigates to cluster detail
```

## Security Architecture

### Authentication

Currently uses Kubernetes ServiceAccount tokens for authentication:
- Backend runs with ServiceAccount in cluster
- ServiceAccount has RBAC permissions to manage ECK resources
- Future: OAuth2/OIDC integration for user authentication

### Authorization

RBAC model:
- ClusterRole defines permissions for ECK resources
- ClusterRoleBinding grants permissions to ServiceAccount
- Namespace-scoped permissions can be added for multi-tenancy

### Network Security

- Frontend → Backend: CORS-protected API
- Backend → K8s API: TLS with ServiceAccount token
- Backend → Elasticsearch: TLS with credentials from secrets

### Data Security

- Elasticsearch credentials stored in Kubernetes Secrets
- Never expose secrets to frontend
- Backend acts as secure proxy
- TLS for all communications

## Scalability Considerations

### Frontend

- Static assets served via CDN (production)
- Client-side caching with React Query
- Code splitting for reduced initial load
- Lazy loading of components

### Backend

- Stateless API (horizontal scaling)
- Request caching for expensive operations
- Rate limiting to prevent abuse
- Connection pooling for K8s API

### Database

- No persistent database required (stateless)
- Kubernetes API server is source of truth
- Optional: Redis for caching (future)

## Monitoring & Observability

### Logging

- Winston logger with structured JSON output
- Log levels: error, warn, info, debug
- Request/response logging with morgan
- Correlation IDs for request tracing

### Metrics

- Backend exposes /health endpoint
- Kubernetes liveness/readiness probes
- Future: Prometheus metrics endpoint

### Error Tracking

- Global error handler in Express
- Error boundaries in React
- User-friendly error messages
- Detailed server-side logging

## Deployment Architecture

### Development

```
Docker Compose
├── Frontend (Vite dev server on :3000)
└── Backend (tsx watch on :4000)
```

### Production - Kubernetes

```
Namespace: eck-ui
├── ServiceAccount: eck-ui
├── ClusterRole: eck-ui (RBAC)
├── Deployment: eck-ui-frontend
│   ├── Nginx serving static files
│   └── Proxy /api to backend
├── Deployment: eck-ui-backend
│   ├── Node.js Express server
│   └── Connects to K8s API
├── Service: eck-ui-frontend (LoadBalancer)
├── Service: eck-ui-backend (ClusterIP)
└── Ingress: eck-ui (optional)
```

## Technology Decisions

### Why React?

- Industry standard with large ecosystem
- Component-based architecture
- Strong TypeScript support
- Excellent tooling

### Why Elastic UI Framework?

- Consistent with Elastic products
- Production-ready components
- Accessibility built-in
- Theme support

### Why Node.js Backend?

- TypeScript shared between frontend/backend
- Good Kubernetes client library
- Fast development iteration
- Easy containerization

### Alternative: Go Backend

Considered but deferred:
- Pros: Better K8s ecosystem, lower memory
- Cons: Different language from frontend
- Decision: Start with Node.js, migrate if needed

## Future Enhancements

### WebSocket Support

Real-time updates:
- Subscribe to K8s events
- Stream cluster status changes
- Live log tailing

### Caching Layer

Add Redis:
- Cache expensive K8s API calls
- Session storage
- Rate limiting state

### Multi-Cluster

Support multiple K8s clusters:
- Cluster switcher in UI
- Federated view
- Cross-cluster operations
