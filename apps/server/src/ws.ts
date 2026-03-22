import type { ServerWebSocket } from "bun";
import { getSessionsForProject, type WSMessage } from "./sessions";

export interface WSData {
  projectId: string;
  userId: string;
}

export const wsHandler = {
  open(ws: ServerWebSocket<WSData>) {
    ws.subscribe(`project:${ws.data.projectId}`);
    const sessions = getSessionsForProject(ws.data.projectId);
    const msg: WSMessage = { type: "snapshot", sessions };
    ws.send(JSON.stringify(msg));
  },
  message(_ws: ServerWebSocket<WSData>, _message: string | Buffer) {},
  close(ws: ServerWebSocket<WSData>) {
    ws.unsubscribe(`project:${ws.data.projectId}`);
  },
};
