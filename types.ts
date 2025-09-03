export interface Account {
  address: string;
  balance: string;
}

export interface WalletAccount {
  address: string;
  privateKey: string;
  balance: string;
}

export interface BlockInfo {
  number: number;
  timestamp: number;
  miner: string;
  txCount: number;
  gasUsed: string;
  gasLimit: string;
  hash: string;
}

export interface NodeInfo {
    chainId: string;
    blockNumber: number;
    gasPrice: string;
}

export interface RpcEndpoint {
  name: string;
  url: string;
  requiresKey?: boolean;
}
