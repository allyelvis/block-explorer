import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

export type LocalNodeStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

// This is a mock implementation. In a real desktop app (e.g., Electron),
// this would use ipcRenderer to communicate with the main process to spawn/kill a child process.
const MOCK_GANACHE_LOGS = [
    "Ganache v7.9.2 (@ganache/cli: 2.10.2, @ganache/core: 2.13.2)",
    "Starting RPC server",
    "Available Accounts",
    "==================",
    "(0) 0x...",
    "(1) 0x...",
    "(2) 0x...",
    "(3) 0x...",
    "(4) 0x...",
    "(5) 0x...",
    "(6) 0x...",
    "(7) 0x...",
    "(8) 0x...",
    "(9) 0x...",
    "Private Keys",
    "==================",
    "(0) 0x...",
    "(1) 0x...",
    "(2) 0x...",
    "(3) 0x...",
    "(4) 0x...",
    "(5) 0x...",
    "(6) 0x...",
    "(7) 0x...",
    "(8) 0x...",
    "(9) 0x...",
    "HD Wallet",
    "==================",
    "Mnemonic:      myth like bonus scare over problem client...",
    "Base HD Path:  m/44'/60'/0'/0/{account_index}",
    "Gas Price:     20 gwei",
    "Gas Limit:     30000000",
    "Call Gas Limit: 30000000",
    "RPC Listening on 127.0.0.1:7545"
];

export const useLocalNodeManager = () => {
    const [status, setStatus] = useState<LocalNodeStatus>('stopped');
    const [logs, setLogs] = useState<string[]>([]);
    const logIntervalRef = useRef<any>(null);


    const startNode = useCallback(async (command: string) => {
        if (logIntervalRef.current) clearInterval(logIntervalRef.current);
        setStatus('starting');
        setLogs([`$ ${command.replace(/ \\\n\s*/g, ' ')}`, '---']);
        toast.loading('Starting local node...', { id: 'node-status' });

        // Simulate startup delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // In a real app, you'd check if the process spawned successfully.
        // Here, we'll assume it worked and transition to running.
        setStatus('running');
        toast.success('Local node running!', { id: 'node-status' });

        // Simulate log output
        let i = 0;
        logIntervalRef.current = setInterval(() => {
            if (i < MOCK_GANACHE_LOGS.length) {
                setLogs(prev => [...prev, MOCK_GANACHE_LOGS[i]]);
                i++;
            } else {
                clearInterval(logIntervalRef.current);
            }
        }, 100);
    }, []);

    const stopNode = useCallback(async () => {
        if (logIntervalRef.current) clearInterval(logIntervalRef.current);
        setStatus('stopping');
        toast.loading('Stopping local node...', { id: 'node-status' });
        
        // Simulate stop delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStatus('stopped');
        setLogs([]);
        toast.success('Local node stopped.', { id: 'node-status' });

    }, []);

    return { status, logs, startNode, stopNode };
}