import http from 'http';
import qrcodeTerminal from 'qrcode-terminal';

const req = http.get('http://localhost:7331/api/info', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const info = JSON.parse(data);
      console.log('\n========================================================');
      console.log('            ClipSync Status & Pairing QR');
      console.log('========================================================');
      console.log('\n[STATUS] ClipSync Background Service is RUNNING!');
      console.log(` - Local Port:        ${info.port}`);
      console.log(` - Active Wi-Fi IP:   ${info.localIp}`);
      console.log(` - Phone Access URL:  ${info.accessUrl}`);
      console.log(` - Connected Devices: ${info.connectedDevices}`);
      console.log(` - Total Saved Clips: ${info.stats.total} / 500 (Pinned: ${info.stats.pinnedCount})`);
      console.log('\nScan this QR Code with your phone camera or mobile browser to connect:\n');
      qrcodeTerminal.generate(info.accessUrl, { small: true });
      console.log('\nTip: On your phone, tap "Add to Home Screen" to install it as an app!\n');
    } catch(e) {
      console.log('Error reading server response:', e.message);
    }
  });
});

req.on('error', () => {
  console.log('\n========================================================');
  console.log('            ClipSync Status');
  console.log('========================================================');
  console.log('\n[STATUS] ClipSync service is currently NOT running.');
  console.log('Double-click START_SILENT.bat to launch it silently in the background!\n');
});
