import { layoutMapDetails, type DetailRequest, type DetailResponse } from '../utils/map-detail-layout.ts';

const scope = self as unknown as { onmessage: (event: MessageEvent<DetailRequest>) => void; postMessage: (data: DetailResponse) => void };
scope.onmessage = ({ data }) => scope.postMessage({ request: data.request, ids: layoutMapDetails(data.view) });
