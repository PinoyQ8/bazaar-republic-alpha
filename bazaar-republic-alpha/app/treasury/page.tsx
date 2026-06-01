// app/treasury/page.tsx
import { pioneerClient } from '../lib/pioneer-client';

export default async function TreasurySector() {
  // Execute the client fetch
  const data = await pioneerClient('LOCAL_DEV_PIONEER_01'); 
  
  return (
    <main>
      <h1>Treasury Registry</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}