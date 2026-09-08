import selfsignedPkg from 'selfsigned';
const { generate: generateCert } = selfsignedPkg;
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const attrs = [{ name: 'commonName', value: 'parksmart.local' }];
const pems = await generateCert(attrs, {
  keySize: 2048,
  days: 3650,
  algorithm: 'sha256',
  extensions: [
    { name: 'subjectAltName', altNames: [
      { type: 2, value: 'localhost' },
      { type: 7, ip: '127.0.0.1' },
      { type: 7, ip: '192.168.1.9' },
    ]},
  ],
});

const dir = resolve(process.cwd(), '.certs');
mkdirSync(dir, { recursive: true });
writeFileSync(resolve(dir, 'key.pem'), pems.private);
writeFileSync(resolve(dir, 'cert.pem'), pems.cert);
console.log('Certs written to frontend/.certs (SANs: localhost, 127.0.0.1, 192.168.1.9)');
