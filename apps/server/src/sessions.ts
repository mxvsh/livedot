import type { Server } from "bun";
import type { VisitorSession, WSMessage } from "@latty/shared";

export { type VisitorSession, type WSMessage };

// Key: `${projectId}:${sessionId}`
const activeSessions = new Map<string, VisitorSession>();

export function upsertSession(session: VisitorSession, server: Server | null) {
  const key = `${session.projectId}:${session.sessionId}`;
  activeSessions.set(key, session);

  const msg: WSMessage = { type: "upsert", session };
  server?.publish(`project:${session.projectId}`, JSON.stringify(msg));
}

export function getSessionsForProject(projectId: string): VisitorSession[] {
  const sessions: VisitorSession[] = [];
  for (const [key, session] of activeSessions) {
    if (key.startsWith(`${projectId}:`)) {
      sessions.push(session);
    }
  }
  return sessions;
}

// Sweep expired sessions every 5 seconds
const SESSION_TIMEOUT = 30_000;

export function startSweep(getServer: () => Server | null) {
  setInterval(() => {
    const now = Date.now();
    const server = getServer();
    for (const [key, session] of activeSessions) {
      if (now - session.lastSeen > SESSION_TIMEOUT) {
        activeSessions.delete(key);
        const msg: WSMessage = { type: "remove", sessionId: session.sessionId };
        server?.publish(`project:${session.projectId}`, JSON.stringify(msg));
      }
    }
  }, 5_000);
}
