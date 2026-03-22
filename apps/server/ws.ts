import type { ServerWebSocket } from "bun";
import { getSessionsForWebsite, type WSMessage } from "./sessions";

export interface WSData {
  websiteId: string;
  userId: string;
}

export const wsHandler = {
  open(ws: ServerWebSocket<WSData>) {
    ws.subscribe(`website:${ws.data.websiteId}`);
    const sessions = getSessionsForWebsite(ws.data.websiteId);
    const msg: WSMessage = { type: "snapshot", sessions };
    ws.send(JSON.stringify(msg));
  },
  message(_ws: ServerWebSocket<WSData>, _message: string | Buffer) {},
  close(ws: ServerWebSocket<WSData>) {
    ws.unsubscribe(`website:${ws.data.websiteId}`);
  },
};
