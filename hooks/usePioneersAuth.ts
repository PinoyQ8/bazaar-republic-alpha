import { useState } from 'react';
import { rpc, Contract, Address, TransactionBuilder, Memo, Account } from '@stellar/stellar-sdk';

export const usePioneersAuth = () => {
  const [isFounder, setIsFounder] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuthorization = async (userAddress: string) => {
    setLoading(true);
    try {
      const server = new rpc.Server(process.env.NEXT_PUBLIC_RPC_URL!);
      const contract = new Contract(process.env.NEXT_PUBLIC_PIONEER_CONTRACT_ID!);
      
      const dummySourceAddress = new Address(userAddress).toString();
      
      // FIX: Use the 'Account' class instance instead of an object literal
      const sourceAccount = new Account(dummySourceAddress, '0');

      // 2. Build the transaction
      const tx = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE!,
        timebounds: { minTime: 0, maxTime: 0 }
      })
      .addOperation(contract.call('get_founder', new Address(userAddress).toScVal()))
      .addMemo(Memo.none())
      .build();

      // 3. Simulate the Transaction
      const result = await server.simulateTransaction(tx);
      
      // 4. Validate result
      setIsFounder(true); 
    } catch (error) {
      console.error("Auth Handshake Failed:", error);
      setIsFounder(false);
    } finally {
      setLoading(false);
    }
  };

  return { isFounder, loading, checkAuthorization };
};