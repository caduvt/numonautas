import os from 'os';

export const BAUD_RATE = 115200;
export const WS_PORT = 8000;

export function getDefaultSerialPort(): string {
  
  const platform = os.platform();
  if (platform === 'win32') {
    return 'COM3'; // Default for Windows
  } else if (platform === 'linux') {
    return '/dev/ttyUSB0'; // Default for Linux
  } else if (platform === 'darwin') {
    return '/dev/tty.usbserial'; // Default for Mac
  }
  
  return '/dev/ttyUSB0';
}
