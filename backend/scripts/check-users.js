const mongoose = require('mongoose');

async function check() {
  const m = await mongoose.connect('mongodb://127.0.0.1:27017');
  const admin = m.connection.db.admin();
  const dbs = await admin.listDatabases();
  console.log('Databases:', dbs.databases.map(d => d.name));
  for (const dbInfo of dbs.databases) {
    if (['admin', 'config', 'local'].includes(dbInfo.name)) continue;
    const db = m.connection.useDb(dbInfo.name);
    const collections = await db.db.listCollections().toArray();
    for (const col of collections) {
      if (col.name === 'users') {
        const users = await db.collection('users').find({}).toArray();
        console.log(`DB ${dbInfo.name} has ${users.length} users:`);
        for (const u of users) {
          console.log(` - name: ${u.name}, email: ${u.email}, phone: ${u.phone}, vehicleNumber: ${u.vehicleNumber}, vehicles: ${JSON.stringify(u.vehicles)}`);
        }
      }
    }
  }
  process.exit(0);
}

check().catch(console.error);
