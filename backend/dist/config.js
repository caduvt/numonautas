"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WS_PORT = exports.BAUD_RATE = void 0;
exports.getDefaultSerialPort = getDefaultSerialPort;
const os_1 = __importDefault(require("os"));
exports.BAUD_RATE = 115200;
exports.WS_PORT = 8000;
function getDefaultSerialPort() {
    const platform = os_1.default.platform();
    if (platform === 'win32') {
        return 'COM3'; // Default for Windows
    }
    else if (platform === 'linux') {
        return '/dev/ttyUSB0'; // Default for Linux
    }
    else if (platform === 'darwin') {
        return '/dev/tty.usbserial'; // Default for Mac
    }
    return '/dev/ttyUSB0';
}
