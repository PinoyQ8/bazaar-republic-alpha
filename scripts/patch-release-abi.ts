import fs from 'fs';
import path from 'path';

const file = path.resolve('services/bazaarVaultService.ts');
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf-8');

  // Replace releaseFunds to ensure it calls with single Symbol argument
  const oldMethodRegex = /async\s+releaseFunds\s*\([\s\S]*?return\s+this\.executeContractCall[\s\S]*?\}/;
  
  const updatedMethod = `async releaseFunds(
    escrowId: string,
    consumerAddress: string,
    signer: Keypair | ((txXdr: string) => Promise<string>)
  ): Promise<StellarRpc.Api.GetTransactionResponse> {
    const sanitizedId = escrowId.replace(/-/g, '_');
    // On-Chain ABI Protocol 28: release_funds(escrow_id)
    const callOp = this.contract.call(
      'release_funds',
      nativeToScVal(sanitizedId, { type: 'symbol' })
    );
    return this.executeContractCall(consumerAddress, callOp, signer);
  }`;

  if (oldMethodRegex.test(content)) {
    content = content.replace(oldMethodRegex, updatedMethod);
    fs.writeFileSync(file, content, 'utf-8');
    console.log('✅ services/bazaarVaultService.ts updated with 1-arg release_funds ABI.');
  } else {
    console.log('ℹ️ releaseFunds signature already updated or pattern not matched.');
  }
}
