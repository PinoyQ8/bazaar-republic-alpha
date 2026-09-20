import fs from 'fs';
import path from 'path';

const file = path.resolve('services/bazaarVaultService.ts');
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf-8');

  // Exact 2-arg match for release_funds(escrow_id, consumer)
  const targetRegex = /async\s+releaseFunds\s*\([\s\S]*?return\s+this\.executeContractCall[\s\S]*?\}/;
  
  const verifiedMethod = `async releaseFunds(
    escrowId: string,
    consumerAddress: string,
    signer: Keypair | ((txXdr: string) => Promise<string>)
  ): Promise<StellarRpc.Api.GetTransactionResponse> {
    const sanitizedId = escrowId.replace(/-/g, '_');
    // On-Chain ABI Verified: release_funds(escrow_id: Symbol, consumer: Address)
    const callOp = this.contract.call(
      'release_funds',
      nativeToScVal(sanitizedId, { type: 'symbol' }),
      Address.fromString(consumerAddress).toScVal()
    );
    return this.executeContractCall(consumerAddress, callOp, signer);
  }`;

  if (targetRegex.test(content)) {
    content = content.replace(targetRegex, verifiedMethod);
    fs.writeFileSync(file, content, 'utf-8');
    console.log('✅ services/bazaarVaultService.ts aligned to on-chain ABI (escrow_id, consumer).');
  } else {
    console.log('ℹ️ releaseFunds signature already aligned.');
  }
}
