import React, { useEffect, useRef } from 'react';
import {
  Viewer,
  Cartesian3,
  Color,
  VerticalOrigin,
  Ion,
  HorizontalOrigin,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Set Cesium Ion access token (use your own or this demo token)
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzYWNiOGJhMi1lZDgxLTQyYWItODQ1Yy1hNjA5MzM0ZTgwMDUiLCJpZCI6MzUwODk0LCJpYXQiOjE3NjA1NTY3OTl9.zKUY6nRKwF90Kuptuh-h3FcRZtcjTto7ZJcRrUK_KpI';

const ClusterMap = ({ clusters, onClusterClick }) => {
  const cesiumContainer = useRef(null);
  const viewerRef = useRef(null);
  const entitiesRef = useRef(new Map());

  // Map namespaces to geographic locations
  const getClusterLocation = (namespace) => {
    const locations = {
      'production': { lon: -104.9903, lat: 39.7392, name: 'Denver, CO' }, // CIP-FUSION
      'staging': { lon: -77.0369, lat: 38.9072, name: 'Washington, DC' }, // HUMINT
      'development': { lon: -122.4194, lat: 37.7749, name: 'San Francisco, CA' }, // SIGINT
      'elastic-test': { lon: -118.2437, lat: 34.0522, name: 'Los Angeles, CA' }, // OSINT
      'analytics': { lon: -87.6298, lat: 41.8781, name: 'Chicago, IL' }, // MASINT
      'logging': { lon: -95.3698, lat: 29.7604, name: 'Houston, TX' }, // IMINT
    };
    return locations[namespace] || { lon: -98.5795, lat: 39.8283, name: 'USA' };
  };

  const getIntTypeInfo = (namespace) => {
    const intTypeMap = {
      'production': { type: 'CIP-FUSION', icon: '🎯', color: '#cf1322' },
      'staging': { type: 'HUMINT', icon: '👤', color: '#0958d9' },
      'development': { type: 'SIGINT', icon: '📡', color: '#531dab' },
      'elastic-test': { type: 'OSINT', icon: '🌐', color: '#389e0d' },
      'analytics': { type: 'MASINT', icon: '📊', color: '#c41d7f' },
      'logging': { type: 'IMINT', icon: '🛰️', color: '#006d75' },
    };
    return intTypeMap[namespace] || { type: 'ECK', icon: '⚙️', color: '#595959' };
  };

  const getHealthColor = (health) => {
    if (health === 'green') return Color.fromCssColorString('#52c41a');
    if (health === 'yellow') return Color.fromCssColorString('#faad14');
    return Color.fromCssColorString('#f5222d');
  };

  // Initialize Cesium Viewer
  useEffect(() => {
    if (!cesiumContainer.current || viewerRef.current) return;

    const viewer = new Viewer(cesiumContainer.current, {
      animation: false,
      baseLayerPicker: true,
      fullscreenButton: true,
      vrButton: false,
      geocoder: true,
      homeButton: true,
      infoBox: true,
      sceneModePicker: true,
      selectionIndicator: true,
      timeline: false,
      navigationHelpButton: true,
      scene3DOnly: false,
    });

    // Set initial camera position to view North America
    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(-98.5795, 39.8283, 4000000),
    });

    viewerRef.current = viewer;

    // Cleanup
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
      entitiesRef.current.clear();
    };
  }, []);

  // Update cluster markers
  useEffect(() => {
    if (!viewerRef.current || !clusters) return;

    const viewer = viewerRef.current;
    const entities = entitiesRef.current;

    // Remove old entities
    entities.forEach((entity) => {
      viewer.entities.remove(entity);
    });
    entities.clear();

    // Add new cluster markers
    clusters.forEach((cluster) => {
      const location = getClusterLocation(cluster.metadata?.namespace);
      const intType = getIntTypeInfo(cluster.metadata?.namespace);
      const healthColor = getHealthColor(cluster.status?.health);

      const entity = viewer.entities.add({
        position: Cartesian3.fromDegrees(location.lon, location.lat, 100000),
        point: {
          pixelSize: 20,
          color: healthColor,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
          heightReference: 0,
        },
        label: {
          text: `${intType.icon} ${cluster.metadata?.name}\n${location.name}`,
          font: '14px sans-serif',
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: 0,
          verticalOrigin: VerticalOrigin.BOTTOM,
          horizontalOrigin: HorizontalOrigin.CENTER,
          pixelOffset: new Cartesian3(0, -30, 0),
          heightReference: 0,
        },
        description: `
          <div style="padding: 10px; font-family: sans-serif;">
            <h3 style="margin: 0 0 10px 0;">${intType.icon} ${cluster.metadata?.name}</h3>
            <p style="margin: 5px 0;"><strong>Type:</strong> ${intType.type}</p>
            <p style="margin: 5px 0;"><strong>Namespace:</strong> ${cluster.metadata?.namespace}</p>
            <p style="margin: 5px 0;"><strong>Version:</strong> ${cluster.spec?.version}</p>
            <p style="margin: 5px 0;"><strong>Health:</strong> ${cluster.status?.health || 'unknown'}</p>
            <p style="margin: 5px 0;"><strong>Phase:</strong> ${cluster.status?.phase || 'unknown'}</p>
            <p style="margin: 5px 0;"><strong>Nodes:</strong> ${cluster.status?.availableNodes || 0}</p>
            <p style="margin: 5px 0;"><strong>Location:</strong> ${location.name}</p>
          </div>
        `,
      });

      entities.set(cluster.metadata?.name, entity);
    });
  }, [clusters]);

  return (
    <div
      ref={cesiumContainer}
      style={{
        width: '100%',
        height: '600px',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    />
  );
};

export default ClusterMap;
