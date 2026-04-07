"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.wsManager = void 0;
const ws_1 = __importStar(require("ws"));
class ConnectionManager {
    activeConnections = [];
    wss = null;
    init(port) {
        this.wss = new ws_1.WebSocketServer({ port });
        console.log(`WebSocket server listening on ws://localhost:${port}/ws`);
        this.wss.on('connection', (ws, req) => {
            // Very basic path routing mock
            if (req.url !== '/ws') {
                ws.close();
                return;
            }
            this.connect(ws);
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleClientMessage(data);
                }
                catch (e) {
                    console.error("Invalid JSON from client:", message);
                }
            });
            ws.on('close', () => {
                this.disconnect(ws);
            });
        });
    }
    connect(ws) {
        this.activeConnections.push(ws);
        console.log("Client connected. Total:", this.activeConnections.length);
    }
    disconnect(ws) {
        this.activeConnections = this.activeConnections.filter(c => c !== ws);
        console.log("Client disconnected. Total:", this.activeConnections.length);
    }
    broadcast(message) {
        const payload = JSON.stringify(message);
        for (const connection of this.activeConnections) {
            if (connection.readyState === ws_1.default.OPEN) {
                connection.send(payload);
            }
        }
    }
    // To be assigned from index.ts by the main logic layer
    onClientMessage = null;
    handleClientMessage(data) {
        if (this.onClientMessage) {
            this.onClientMessage(data);
        }
    }
}
exports.wsManager = new ConnectionManager();
