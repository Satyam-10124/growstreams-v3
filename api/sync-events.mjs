import { GearApi } from '@gear-js/api';

async function main() {
  const api = await GearApi.create({ providerAddress: 'wss://rpc.vara.network' });
  console.log('Listening for events...');
  
  api.query.system.events((events) => {
    events.forEach((record) => {
      const { event, phase } = record;
      
      // We only care about gear events
      if (event.section === 'gear') {
        const method = event.method;
        if (method === 'MessageQueued' || method === 'UserMessageSent' || method === 'MessageWaited') {
          // ignore
        } else {
          console.log(\\n[\] \.\\);
          console.log(event.data.toHuman());
        }
      }
    });
  });
}
main().catch(console.error);

