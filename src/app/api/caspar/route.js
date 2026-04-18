import net from 'net';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { command, data } = await request.json();
    
    // CasparCG standard configuration
    const channel = 1;
    const layer = 20;

    return new Promise((resolve) => {
      const client = new net.Socket();
      client.setTimeout(3000); // 3 second timeout

      client.connect(5250, '127.0.0.1', () => {
        let amcpCmd = '';
        
        // Ensure accurate stringification and escaping of JSON for AMCP commands
        const payload = data ? JSON.stringify(data).replace(/"/g, '\\"') : '';

        if (command === 'play') {
          // Play triggers the graphic to load with the payload data
          // We assume local caspar server running on the same machine
          const url = 'http://127.0.0.1:3000/template';
          amcpCmd = `CG ${channel}-${layer} ADD 1 "${url}" 1 "${payload}"\r\n`;
        } else if (command === 'update') {
          amcpCmd = `CG ${channel}-${layer} UPDATE 1 "${payload}"\r\n`;
        } else if (command === 'stop') {
          amcpCmd = `CG ${channel}-${layer} STOP 1\r\n`;
        } else if (command === 'clear') {
          amcpCmd = `CLEAR ${channel}-${layer}\r\n`;
        } else {
          client.destroy();
          return resolve(NextResponse.json({ success: false, error: 'Unknown command' }, { status: 400 }));
        }

        client.write(amcpCmd);
        
        setTimeout(() => {
          client.destroy();
          resolve(NextResponse.json({ success: true, cmdSent: amcpCmd.trim() }));
        }, 100);
      });

      client.on('error', (err) => {
        client.destroy();
        resolve(NextResponse.json({ success: false, error: err.message }, { status: 500 }));
      });
      
      client.on('timeout', () => {
        client.destroy();
        resolve(NextResponse.json({ success: false, error: 'Connection timed out to 127.0.0.1:5250' }, { status: 504 }));
      });
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
