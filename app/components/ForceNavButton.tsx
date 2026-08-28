'use client'; // This directive is the key

export default function ForceNavButton() {
  return (
    <button 
      onClick={() => window.location.href = '/academy'}
      style={{ padding: '10px', background: '#0f0', cursor: 'pointer' }}
    >
      FORCE NAVIGATE TO ACADEMY
    </button>
  );
}