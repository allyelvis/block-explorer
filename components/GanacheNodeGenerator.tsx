import React, { useState, useEffect, useRef } from 'react';
import { CopyIcon, CheckIcon, XIcon, PlayIcon, StopIcon, CogIcon } from './Icons';
import toast from 'react-hot-toast';
import { LocalNodeStatus } from '../hooks/useLocalNodeManager';

interface LocalNodeManagerProps {
    isOpen: boolean;
    onClose: () => void;
    status: LocalNodeStatus;
    logs: string[];
    onStart: (command: string) => void;
    onStop: () => void;
}

const Label: React.FC<{ htmlFor: string, children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-300 mb-1">{children}</label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-white font-mono focus:ring-brand-orange focus:border-brand-orange transition"
    />
);

const StatusIndicator: React.FC<{ status: LocalNodeStatus }> = ({ status }) => {
    const statusMap = {
        stopped: { text: 'Stopped', color: 'bg-red-500' },
        starting: { text: 'Starting...', color: 'bg-yellow-500 animate-pulse' },
        running: { text: 'Running', color: 'bg-green-500' },
        stopping: { text: 'Stopping...', color: 'bg-yellow-500 animate-pulse' },
        error: { text: 'Error', color: 'bg-red-500' },
    };
    const { text, color } = statusMap[status];
    return (
        <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${color}`}></span>
            <span className="text-sm font-semibold">{text}</span>
        </div>
    );
}

export const LocalNodeManager: React.FC<LocalNodeManagerProps> = ({ isOpen, onClose, status, logs, onStart, onStop }) => {
    const [config, setConfig] = useState({
        host: '127.0.0.1',
        port: '7545',
        chainId: '5777',
        accounts: '10',
        balance: '1000',
        blockTime: '2',
    });
    const [command, setCommand] = useState('');
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const parts = ['ganache'];
        if (config.host) parts.push(`--server.host "${config.host}"`);
        if (config.port) parts.push(`--server.port ${config.port}`);
        if (config.chainId) parts.push(`--chain.chainId ${config.chainId}`);
        if (config.accounts) parts.push(`--wallet.totalAccounts ${config.accounts}`);
        if (config.balance) parts.push(`--wallet.defaultBalance ${config.balance}`);
        if (config.blockTime) parts.push(`--miner.blockTime ${config.blockTime}`);
        
        const formattedCommand = parts.join(' \\\n        ');
        setCommand(formattedCommand);
    }, [config]);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };
    
    const handleStart = () => {
        const singleLineCommand = command.replace(/ \\\n\s*/g, ' ');
        onStart(singleLineCommand);
    }
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl transform transition-all border border-gray-700" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                     <div className="flex items-center space-x-3">
                        <CogIcon className="w-6 h-6 text-brand-orange"/>
                        <h2 className="text-xl font-bold text-white">Local Node Manager</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-700">
                        <h3 className="font-bold text-lg text-white mb-4">Configuration</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="host">Host</Label>
                                <Input type="text" name="host" id="host" value={config.host} onChange={handleChange} />
                                <p className="text-xs text-gray-500 mt-1">Use '0.0.0.0' for network access.</p>
                            </div>
                            <div>
                                <Label htmlFor="port">Port</Label>
                                <Input type="number" name="port" id="port" value={config.port} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="chainId">Chain ID</Label>
                                <Input type="number" name="chainId" id="chainId" value={config.chainId} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="accounts">Number of Accounts</Label>
                                <Input type="number" name="accounts" id="accounts" value={config.accounts} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="balance">Default Balance (ETH)</Label>
                                <Input type="number" name="balance" id="balance" value={config.balance} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="blockTime">Block Time (s)</Label>
                                <Input type="number" name="blockTime" id="blockTime" value={config.blockTime} onChange={handleChange} />
                                <p className="text-xs text-gray-500 mt-1">Use '0' for instant mining.</p>
                            </div>
                        </div>
                    </div>
                     <div className="p-6">
                        <h3 className="font-bold text-lg text-white mb-4">Controls & Status</h3>
                        <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg">
                             <div className="flex space-x-2">
                                <button onClick={handleStart} disabled={status === 'running' || status === 'starting'} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                                    <PlayIcon /> <span>Start Node</span>
                                </button>
                                <button onClick={onStop} disabled={status !== 'running'} className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                                    <StopIcon /> <span>Stop Node</span>
                                </button>
                            </div>
                            <StatusIndicator status={status} />
                        </div>
                        <div className="mt-4">
                            <Label htmlFor="command">Live Terminal</Label>
                            <div className="bg-gray-900 rounded-md p-3 text-gray-300 font-mono text-xs overflow-y-auto h-48 border border-gray-600 custom-scrollbar">
                                {logs.length === 0 && <p className="text-gray-500">Node is stopped. Press 'Start Node' to see output.</p>}
                                {logs.map((log, i) => (
                                    <p key={i} className="whitespace-pre-wrap leading-relaxed">{typeof log === 'string' && log.includes('RPC Listening') ? <span className="text-green-400">{log}</span> : log}</p>
                                ))}
                                <div ref={logsEndRef} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #1f2937;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #4b5563;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #6b7280;
                }
            `}</style>
        </div>
    );
};