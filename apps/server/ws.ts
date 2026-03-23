import type { ServerWebSocket } from "bun";
import { getSessionsForWebsite, getHistoryForWebsite, getEventsForWebsite, type WSMessage } from "./sessions";

export interface WSData {
  websiteId: string;
  userId: string;
}

export const wsHandler = {
  async open(ws: ServerWebSocket<WSData>) {
    ws.subscribe(`website:${ws.data.websiteId}`);
    const [sessions, history, events] = await Promise.all([
      getSessionsForWebsite(ws.data.websiteId),
      getHistoryForWebsite(ws.data.websiteId),
      getEventsForWebsite(ws.data.websiteId),
    ]);
    const msg: WSMessage = { type: "snapshot", sessions, history, events };
    ws.send(JSON.stringify(msg));
  },
  message(_ws: ServerWebSocket<WSData>, _message: string | Buffer) {},
  close(ws: ServerWebSocket<WSData>) {
    ws.unsubscribe(`website:${ws.data.websiteId}`);
  },
};
