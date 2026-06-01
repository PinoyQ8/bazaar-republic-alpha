// app/treasury/page.tsx
import { pioneerFetch } from '../lib/pioneer-client'; // Import only

export default async function TreasurySector() {
  // Use the imported function
  const response = await pioneerFetch('treasury', {
    method: 'POST',
    body: JSON.stringify({ action: 'AUDIT_BALANCES' })
  });

  return (
    <div className="p-8">
      <h1>[TREASURY CORE]</h1>
      <pre>{JSON.stringify(response, null, 2)}</pre>
    </div>
  );
}