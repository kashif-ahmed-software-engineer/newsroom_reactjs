// src/util/useRundownSocket.ts
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { api } from '../services/api';

/**
 * Subscribes to the /ws/rundowns channel and invalidates
 * the RTK Query `Rundown` tag whenever the server broadcasts an update.
 *
 * The invalidation causes all `useGetRundownsQuery` / `useGetDashboardQuery`
 * consumers to refetch automatically — no polling needed.
 */
export function useRundownSocket() {
  const dispatch = useDispatch();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number | null>(null);

  useEffect(() => {
    // Derive WS URL from the API base URL
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const wsBase = apiBase.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}ws/rundowns`;

    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // eslint-disable-next-line no-console
        console.log('[WS] rundowns connected');
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.event === 'rundown_update') {
            // Force RTK Query to refetch the `Rundown` tag
            dispatch(api.util.invalidateTags(['Rundown']));
          }
        } catch {
          /* ignore malformed payloads */
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (cancelled) return;
        // Auto-reconnect after a short delay
        reconnectRef.current = window.setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        // Let onclose handle reconnection
        ws.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [dispatch]);
}