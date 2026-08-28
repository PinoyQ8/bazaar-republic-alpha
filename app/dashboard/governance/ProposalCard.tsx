// Location: J:\Project-Bazaar\bazaar-republic\bazaar-republic-alpha\app\dashboard\governance\ProposalCard.tsx

type ProposalProps = {
  proposal: {
    id: number;
    title: string;
    description: string;
    requiredWeight: number;
    status: string;
    voteCount: number;
  };
};

// 🛡️ THE CRITICAL CAPACITOR: Ensure "export default" is exactly written here
export default function ProposalCard({ proposal }: ProposalProps) {
  
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE": return "text-green-400 border-green-400 bg-green-950/20";
      case "BUFFER": return "text-yellow-400 border-yellow-400 bg-yellow-950/20";
      case "LOCKED": return "text-red-400 border-red-400 bg-red-950/20";
      default: return "text-gray-400 border-gray-400 bg-gray-900";
    }
  };

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded p-6 flex flex-col justify-between hover:border-gray-700 transition-colors duration-200 font-mono">
      <div>
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs text-gray-500 font-bold tracking-wider">
            ID: #{proposal.id.toString().padStart(3, '0')}
          </span>
          <span className={`text-xs px-2 py-0.5 border rounded font-bold tracking-widest ${getStatusColor(proposal.status)}`}>
            {proposal.status}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
          {proposal.title}
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3">
          {proposal.description}
        </p>
      </div>

      <div className="border-t border-gray-800/80 pt-4 mt-auto">
        <div className="flex justify-between items-center text-xs font-semibold text-gray-400">
          <div>
            VOTES ANCHORED: <span className="text-white">{proposal.voteCount}</span>
          </div>
          <div>
            REQ WEIGHT: <span className="text-white">{proposal.requiredWeight}</span>
          </div>
        </div>
        
        <div className="w-full bg-gray-800 h-1 mt-2 rounded-full overflow-hidden">
          <div 
            className="bg-green-500 h-full transition-all duration-500" 
            style={{ width: proposal.voteCount > 0 ? `${Math.min((proposal.voteCount / proposal.requiredWeight) * 100, 100)}%` : '2%' }}
          />
        </div>
      </div>
    </div>
  );
}