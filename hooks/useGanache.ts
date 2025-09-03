import { useState, useCallback, useRef } from 'react';
import { Account, BlockInfo, NodeInfo, RpcEndpoint } from '../types';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import type { TransactionResponse } from 'ethers';

export const RPC_ENDPOINTS: RpcEndpoint[] = [
  { name: 'Ganache Local', url: 'http://localhost:7545' },
  { name: 'Ganache Local (Secure)', url: 'https://127.0.0.1:7545' },
  { name: 'Public EVM', url: 'https://evm.aenzbi.com' },
  { name: 'Google Cloud Mainnet', url: 'https://blockchain.googleapis.com/v1/projects/aenzbi-cloud/locations/us-central1/endpoints/ethereum-mainnet/rpc', requiresKey: true },
];

const MAX_BLOCKS = 15;

const { JsonRpcProvider, formatEther } = ethers;

export const useGanache = () => {
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);
  const [unlockedAccounts, setUnlockedAccounts] = useState<Account[]>([]);
  const [latestBlocks, setLatestBlocks] = useState<BlockInfo[]>([]);
  const [currentNodeSupportsAccounts, setCurrentNodeSupportsAccounts] = useState(false);
  
  const fetchingRef = useRef(new Set());
  const providerRef = useRef<ethers.JsonRpcProvider | null>(null);

  const disconnect = useCallback(() => {
      if (providerRef.current) {
        providerRef.current.removeAllListeners('block');
      }
      setIsConnected(false);
      setProvider(null);
      providerRef.current = null;
      setCurrentNodeSupportsAccounts(false);
  }, []);

  const fetchBlock = useCallback(async (blockNumber: number, currentProvider: any) => {
    if (fetchingRef.current.has(blockNumber)) return null;

    try {
      fetchingRef.current.add(blockNumber);
      const block = await currentProvider.getBlock(blockNumber);
      if (!block) return null;
      
      const blockInfo: BlockInfo = {
        number: block.number,
        timestamp: block.timestamp,
        miner: block.miner,
        txCount: block.transactions.length,
        gasUsed: ethers.formatUnits(block.gasUsed, 'wei'),
        gasLimit: ethers.formatUnits(block.gasLimit, 'wei'),
        hash: block.hash,
      };
      return blockInfo;
    } catch (e) {
      console.error(`Failed to fetch block ${blockNumber}:`, e);
      return null;
    } finally {
      fetchingRef.current.delete(blockNumber);
    }
  }, []);

  const updateUnlockedAccountBalances = useCallback(async (currentProvider: any, addresses: string[]) => {
      if (addresses.length === 0) {
        setUnlockedAccounts([]);
        return;
      }
      try {
          const balancePromises = addresses.map(address => currentProvider.getBalance(address));
          const balances = await Promise.all(balancePromises);
          const updatedAccounts = addresses.map((address, i) => ({
              address,
              balance: parseFloat(formatEther(balances[i])).toFixed(4),
          }));
          setUnlockedAccounts(updatedAccounts);
      } catch (e) {
          console.error("Failed to update balances:", e);
          toast.error("Could not update account balances.");
      }
  }, []);
  
  const fetchTransactionsForBlock = useCallback(async (blockNumber: number): Promise<TransactionResponse[]> => {
    if (!providerRef.current) {
        toast.error("Not connected to a node.");
        return [];
    }

    const toastId = toast.loading(`Fetching transactions for block #${blockNumber}...`);
    try {
        const block = await providerRef.current.getBlock(blockNumber, true); // `true` prefetches transactions
        toast.dismiss(toastId);
        if (block && block.prefetchedTransactions) {
             return block.prefetchedTransactions;
        }
        return [];
    } catch (e) {
        console.error(`Failed to fetch transactions for block ${blockNumber}:`, e);
        toast.error(`Could not fetch transactions for block ${blockNumber}.`, { id: toastId });
        return [];
    }
  }, []);


  const connect = useCallback(async (endpoint: RpcEndpoint, apiKey?: string) => {
    disconnect();
    setError(`Connecting to ${endpoint.name}...`);
    setUnlockedAccounts([]);

    let finalUrl = endpoint.url;
    if (endpoint.requiresKey) {
        if (!apiKey) {
            setError(`API Key is required for ${endpoint.name}.`);
            return;
        }
        finalUrl += `?key=${apiKey}`;
    }

    try {
      const rpcProvider = new JsonRpcProvider(finalUrl, undefined, { staticNetwork: true });
      await rpcProvider.send('eth_chainId', []);
      
      setProvider(rpcProvider);
      providerRef.current = rpcProvider;
      setIsConnected(true);
      setError(null);
      toast.success(`Connected to ${endpoint.name}!`);

      let supportsAccounts = false;
      try {
        const result = await rpcProvider.send("eth_accounts", []);
        if (Array.isArray(result)) {
          supportsAccounts = true;
        }
      } catch (e) {
        console.warn(`Node does not appear to support 'eth_accounts'. Assuming public node.`);
        supportsAccounts = false;
      }
      setCurrentNodeSupportsAccounts(supportsAccounts);

      const onNewBlock = async (blockNumber: number) => {
          setNodeInfo(prev => prev ? { ...prev, blockNumber } : null);
          const newBlock = await fetchBlock(blockNumber, rpcProvider);
          if (newBlock) {
              setLatestBlocks(prevBlocks => [newBlock, ...prevBlocks].slice(0, MAX_BLOCKS));
          }
          setUnlockedAccounts(currentAccounts => {
            if (currentAccounts.length > 0) {
                updateUnlockedAccountBalances(rpcProvider, currentAccounts.map(a => a.address));
            }
            return currentAccounts;
          });
      };
      rpcProvider.on('block', onNewBlock);

      const network = await rpcProvider.getNetwork();
      const blockNumber = await rpcProvider.getBlockNumber();
      const feeData = await rpcProvider.getFeeData();
      
      setNodeInfo({
        chainId: network.chainId.toString(),
        blockNumber,
        gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : '0',
      });
      
      if (supportsAccounts) {
        const accountResults = await rpcProvider.listAccounts();
        const accountAddresses = accountResults.map((acc: any) => acc.address);
        if (accountAddresses.length > 0) {
          await updateUnlockedAccountBalances(rpcProvider, accountAddresses);
        }
      }

      const blockPromises = [];
      for (let i = 0; i < Math.min(blockNumber, MAX_BLOCKS); i++) {
        blockPromises.push(fetchBlock(blockNumber - i, rpcProvider));
      }
      const initialBlocks = (await Promise.all(blockPromises)).filter(Boolean) as BlockInfo[];
      setLatestBlocks(initialBlocks);

    } catch (e) {
      console.error(`Connection to ${finalUrl} failed:`, e);
       const detailedError = `Failed to connect to ${endpoint.name}.

- Please ensure the endpoint is correct and the node is running.
- For local nodes, check for CORS issues. You may need to restart your node with flags like --server.host "0.0.0.0".
- For endpoints requiring a key, ensure it is correct.`;
      setError(detailedError);
      disconnect();
    }
  }, [disconnect, fetchBlock, updateUnlockedAccountBalances]);
  
  return { provider, isConnected, error, nodeInfo, unlockedAccounts, latestBlocks, connect, fetchTransactionsForBlock, currentNodeSupportsAccounts };
};