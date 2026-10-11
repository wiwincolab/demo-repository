import { createMapClusterEngine, type ClusterRequest, type ClusterResponse } from '../utils/map-cluster-engine.ts';

const engine = createMapClusterEngine();
let revision = 0;
const scope = self as unknown as { onmessage: (event: MessageEvent<ClusterRequest>) => void; postMessage: (data: ClusterResponse) => void };
scope.onmessage = ({ data }) => {
  try {
    if (data.type === 'load') { engine.load(data.points, data.options, data.state); revision = data.revision; }
    else if (data.type === 'select') { engine.select(data.state); revision = data.revision; }
    else {
      if (data.revision === revision) scope.postMessage({ type: 'result', revision, request: data.request, features: engine.query(data.bounds, data.zoom) });
      return;
    }
    scope.postMessage({ type: 'ready', revision });
  } catch { scope.postMessage({ type: 'error', revision: data.revision }); }
};
