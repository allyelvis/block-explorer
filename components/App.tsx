import React, { useState, useEffect } from 'react';
import { useGanache, RPC_ENDPOINTS } from '../hooks/useGanache';
import { RpcEndpoint } from '../types';
import { CubeIcon, CogIcon, WalletIcon } from './Icons';
import { LocalNodeManager } from './GanacheNodeGenerator';
import { useLocalNodeManager } from '../hooks/useLocalNodeManager';
import { TransactionDetailModal } from './TransactionDetailModal';
import { useWallet } from '../hooks/useWallet';
import { ExplorerView } from './ExplorerView';
import { WalletView } from './WalletView';
import toast from 'react-hot-toast';

type ActiveTab = 'explorer' | 'wallet';

const RpcEndpointSelector: React.FC<{
    endpoints: RpcEndpoint[];
    activeEndpoint: RpcEndpoint;
    onChange: (endpoint: RpcEndpoint) => void;
    apiKey: string;
    onApiKeyChange: (key: string) => void;
    onConnect: () => void;
    isConnected: boolean;
}> = ({ endpoints, activeEndpoint, onChange, apiKey, onApiKeyChange, onConnect, isConnected }) => (
    <div className="flex items-center space-x-2 bg-gray-700/50 p-1 rounded-lg">
        <select
            id="rpc-select"
            value={activeEndpoint.url}
            onChange={(e) => {
                const newEndpoint = endpoints.find(ep => ep.url === e.target.value);
                if (newEndpoint) onChange(newEndpoint);
            }}
            disabled={isConnected}
            className="bg-gray-700 border-transparent rounded-md p-1.5 text-white font-mono text-xs focus:ring-brand-orange focus:border-brand-orange transition-all disabled:opacity-70"
        >
            {endpoints.map(ep => <option key={ep.url} value={ep.url}>{ep.name}</option>)}
        </select>
        {activeEndpoint.requiresKey && (
            <input
                type="password"
                placeholder="API Key"
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                disabled={isConnected}
                className="bg-gray-800 border-gray-600 rounded-md p-1.5 text-white font-mono text-xs w-28 sm:w-40 focus:ring-brand-orange focus:border-brand-orange transition-all disabled:opacity-70"
            />
        )}
        <button onClick={onConnect} disabled={isConnected} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${isConnected ? 'bg-green-500/20 text-green-300 cursor-default' : 'bg-brand-orange hover:bg-orange-600 text-white'} disabled:bg-gray-600 disabled:cursor-not-allowed`}>
           {isConnected ? 'Connected' : 'Connect'}
        </button>
    </div>
);


const Header: React.FC<{
    isConnected: boolean;
    onConnect: () => void;
    activeEndpoint: RpcEndpoint;
    onEndpointChange: (newUrl: RpcEndpoint) => void;
    apiKey: string;
    onApiKeyChange: (key: string) => void;
}> = ({ isConnected, onConnect, activeEndpoint, onEndpointChange, apiKey, onApiKeyChange }) => (
    <header className="bg-gray-800/50 backdrop-blur-sm p-4 sticky top-0 z-20 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center gap-4">
            <div className="flex items-center space-x-3 flex-shrink-0">
                <CubeIcon className="h-8 w-8 text-brand-orange"/>
                <h1 className="text-2xl font-bold text-white hidden md:block">Block Explorer</h1>
            </div>
            <div className="flex items-center space-x-4">
                 <RpcEndpointSelector
                    endpoints={RPC_ENDPOINTS}
                    activeEndpoint={activeEndpoint}
                    onChange={onEndpointChange}
                    apiKey={apiKey}
                    onApiKeyChange={onApiKeyChange}
                    onConnect={onConnect}
                    isConnected={isConnected}
                 />
                 <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="relative flex h-3 w-3">
                        {isConnected ? (
                            <>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </>
                        ) : (
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        )}
                    </span>
                    <span className={isConnected ? "text-green-400" : "text-red-400"}>
                        {isConnected ? 'Live' : 'Offline'}
                    </span>
                </div>
            </div>
        </div>
    </header>
);

const TabButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
            isActive
                ? 'border-brand-orange text-white'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const App: React.FC = () => {
    const { provider, isConnected, error, nodeInfo, unlockedAccounts, latestBlocks, connect, fetchTransactionsForBlock, currentNodeSupportsAccounts } = useGanache();
    const { status: localNodeStatus, logs: localNodeLogs, startNode, stopNode } = useLocalNodeManager();
    const wallet = useWallet(provider);

    const [isManagerOpen, setIsManagerOpen] = useState(false);
    const [activeEndpoint, setActiveEndpoint] = useState<RpcEndpoint>(RPC_ENDPOINTS[0]);
    const [apiKey, setApiKey] = useState('');
    const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('explorer');

    const handleConnect = () => {
        connect(activeEndpoint, apiKey);
    };
    
    const handleEndpointChange = (endpoint: RpcEndpoint) => {
        setActiveEndpoint(endpoint);
        // We don't auto-connect here anymore to let the user decide.
    };

    useEffect(() => {
        if (localNodeStatus === 'running' && !isConnected) {
            const localGanacheEndpoint = RPC_ENDPOINTS[0];
            if (activeEndpoint.url !== localGanacheEndpoint.url) {
                setActiveEndpoint(localGanacheEndpoint);
            }
            connect(localGanacheEndpoint);
        }
    }, [localNodeStatus, isConnected, connect, activeEndpoint.url]);
    
    const handleBlockSelect = (blockNumber: number) => {
        if (!isConnected) {
            toast.error("Connect to a node first to see block details.");
            return;
        }
        setSelectedBlock(blockNumber);
    };
    
    const handleCloseModal = () => {
        setSelectedBlock(null);
    };

    const renderContent = () => {
        if (!isConnected) {
            return (
                <div className="text-center py-20">
                    <CubeIcon className="w-16 h-16 mx-auto text-gray-600" />
                    <h2 className="mt-4 text-2xl font-semibold text-gray-400">Welcome to the Block Explorer</h2>
                    <p className="mt-2 text-gray-500 max-w-xl mx-auto">Select an RPC endpoint from the header and click "Connect" to start.</p>
                    <p className="mt-4 text-sm text-gray-500">
                        Need a local test node?
                    </p>
                    <button 
                        onClick={() => setIsManagerOpen(true)}
                        className="mt-2 inline-flex items-center space-x-2 bg-gray-700 text-gray-200 font-semibold px-4 py-2 rounded-md hover:bg-gray-600 transition-colors">
                        <CogIcon className="w-5 h-5"/>
                        <span>Local Node Manager</span>
                    </button>
                </div>
            );
        }

        return (
            <>
                <div className="border-b border-gray-700 mb-8">
                    <nav className="flex space-x-2">
                        <TabButton label="Explorer" icon={<CubeIcon className="w-5 h-5"/>} isActive={activeTab === 'explorer'} onClick={() => setActiveTab('explorer')} />
                        <TabButton label="Wallet" icon={<WalletIcon className="w-5 h-5"/>} isActive={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} />
                    </nav>
                </div>
                {activeTab === 'explorer' && (
                    <ExplorerView 
                        nodeInfo={nodeInfo}
                        latestBlocks={latestBlocks}
                        onBlockSelect={handleBlockSelect}
                    />
                )}
                {activeTab === 'wallet' && (
                    <WalletView
                        unlockedAccounts={unlockedAccounts}
                        currentNodeSupportsAccounts={currentNodeSupportsAccounts}
                        wallet={wallet}
                    />
                )}
            </>
        )
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
            <Header
              isConnected={isConnected}
              onConnect={handleConnect}
              activeEndpoint={activeEndpoint}
              onEndpointChange={handleEndpointChange}
              apiKey={apiKey}
              onApiKeyChange={setApiKey}
            />
            <main className="container mx-auto p-4 md:p-8">
                {error && !isConnected && (
                    <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg mb-8">
                        <h3 className="font-bold">Connection Error</h3>
                        <p className="font-mono text-sm whitespace-pre-wrap">{error}</p>
                    </div>
                )}
                {renderContent()}
            </main>
            <LocalNodeManager 
                isOpen={isManagerOpen} 
                onClose={() => setIsManagerOpen(false)} 
                status={localNodeStatus}
                logs={localNodeLogs}
                onStart={startNode}
                onStop={stopNode}
            />
            {fetchTransactionsForBlock && (
              <TransactionDetailModal 
                  isOpen={selectedBlock !== null}
                  onClose={handleCloseModal}
                  blockNumber={selectedBlock}
                  fetchTransactions={fetchTransactionsForBlock}
              />
            )}
        </div>
    );
};

export default App;