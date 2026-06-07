// models/PioneerLedger.ts
import mongoose from 'mongoose';

// 🛡️ BAZAAR TECH: Internal state tracking for Treasury allocations
const PioneerLedgerSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
});

// 🛡️ HOT-RELOAD SHIELD: Prevents Mongoose from crashing during Next.js recompilations
export default mongoose.models.PioneerLedger || mongoose.model('PioneerLedger', PioneerLedgerSchema);