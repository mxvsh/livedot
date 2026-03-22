# Livedot — Minimal PRD

Livedot is a lightweight web app that allows users to see their website visitors live on a world map. Users create a project and receive a small JavaScript tracking snippet that they embed on their website. This script sends basic visit events to the backend, which processes and broadcasts active sessions in real time. The frontend dashboard displays these sessions as live points on a map, giving an immediate visual sense of user presence across the globe.

Each project has a unique project ID. The tracking script captures the current page URL, a generated session ID stored in localStorage, and sends events to the backend. The backend resolves the visitor’s IP to approximate latitude and longitude, stores active sessions in memory (preferably Redis), and considers a session active if it has sent an event within the last 30 seconds. Inactive sessions are automatically removed.

Livedot uses a WebSocket connection to stream real-time updates to the dashboard. The frontend listens for updates and renders users as points on a world map using a WebGL-based map library such as MapLibre. The interface is minimal, consisting of a full-screen map, a live count of active users, and basic project selection if needed. New users appear instantly, and inactive users disappear smoothly to maintain a real-time feel.

The MVP does not include authentication, historical analytics, page-level tracking, or billing. The primary goal is speed, simplicity, and a visually engaging real-time experience. The system should handle at least 1000 concurrent users smoothly and allow users to install the tracking script and see results within minutes.
