import type { ServerWebSocket } from "bun";
import { getSessionsForWebsite, getHistoryForWebsite, getEventsForWebsite, type WSMessage } from "./sessions";
import type { SupportedRecentWindow } from "@livedot/shared/recent";

export interface WSData {
  websiteId: string;
  userId: string;
  recent?: SupportedRecentWindow | null;
}

export const wsHandler = {
  async open(ws: ServerWebSocket<WSData>) {
    ws.subscribe(`website:${ws.data.websiteId}`);
    ws.subscribe(ws.data.recent ? `website:${ws.data.websiteId}:history:${ws.data.recent}` : `website:${ws.data.websiteId}:history`);
    const [sessions, history, events] = await Promise.all([
      getSessionsForWebsite(ws.data.websiteId),
      getHistoryForWebsite(ws.data.websiteId, ws.data.recent),
      getEventsForWebsite(ws.data.websiteId),
    ]);
    const msg: WSMessage = { type: "snapshot", sessions, history, events };
    ws.send(JSON.stringify(msg));
  },
  message(_ws: ServerWebSocket<WSData>, _message: string | Buffer) {},
  close(ws: ServerWebSocket<WSData>) {
    ws.unsubscribe(`website:${ws.data.websiteId}`);
    ws.unsubscribe(ws.data.recent ? `website:${ws.data.websiteId}:history:${ws.data.recent}` : `website:${ws.data.websiteId}:history`);
  },
};
