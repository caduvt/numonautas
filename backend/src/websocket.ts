import WebSocket, { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';

class ConnectionManager {
  private activeConnections: WebSocket[] = [];
  public wss: WebSocketServer | null = null;

  public init(port: number) {
    this.wss = new WebSocketServer({ port });
    console.log(`WebSocket server listening on ws://localhost:${port}/ws`);

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      // Very basic path routing mock
      if (req.url !== '/ws') {
        ws.close();
        return;
      }

      this.connect(ws);

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(data);
        } catch (e) {
          console.error("Invalid JSON from client:", message);
        }
      });

      ws.on('close', () => {
        this.disconnect(ws);
      });
    });
  }

  private connect(ws: WebSocket) {
    this.activeConnections.push(ws);
    console.log("Client connected. Total:", this.activeConnections.length);
  }

  private disconnect(ws: WebSocket) {
    this.activeConnections = this.activeConnections.filter(c => c !== ws);
    console.log("Client disconnected. Total:", this.activeConnections.length);
  }

  public broadcast(message: object) {
    const payload = JSON.stringify(message);
    for (const connection of this.activeConnections) {
      if (connection.readyState === WebSocket.OPEN) {
        connection.send(payload);
      }
    }
  }

  // To be assigned from index.ts by the main logic layer
  public onClientMessage: ((data: any) => void) | null = null;

  private handleClientMessage(data: any) {
    if (this.onClientMessage) {
      this.onClientMessage(data);
    }
  }
}

export const wsManager = new ConnectionManager();
