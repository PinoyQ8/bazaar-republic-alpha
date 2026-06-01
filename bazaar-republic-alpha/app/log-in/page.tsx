'use client';

export default function LogInPage() {
  return (
    <div style={{ background: '#000', color: '#0f0', padding: '50px', height: '100vh', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1>[REPUBLIC EMERGENCY SHELL]</h1>
      <p>Status: Manual Override Active</p>
      
      {/* Direct-Render Button (Bypassing external component) */}
      <button 
        onClick={() => {
          console.log("Navigating to Academy...");
          window.location.href = '/academy';
        }}
        style={{ padding: '20px', background: '#0f0', color: '#000', fontWeight: 'bold', fontSize: '20px', cursor: 'pointer' }}
      >
        FORCE NAVIGATE TO ACADEMY
      </button>
    </div>
  );
}