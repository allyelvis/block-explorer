import React from 'react';
import { BlockInfo, NodeInfo } from '../types';
import { CubeIcon } from './Icons';

const StatCard: React.FC<{ label: string; value: React.ReactNode; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-gray-800 p-4 rounded-lg flex items-center space-x-4">
        <div className="bg-gray-700 p-3 rounded-lg text-brand-orange">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400">{label}</p>
            <p className="text-xl font-semibold text-white font-mono">{value}</p>
        </div>
    </div>
);

const NodeInfoPanel: React.FC<{ nodeInfo: NodeInfo | null }> = ({ nodeInfo }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Chain ID" value={nodeInfo?.chainId ?? '...'} icon={<CubeIcon className="w-6 h-6"/>} />
        <StatCard label="Latest Block" value={nodeInfo?.blockNumber ?? '...'} icon={<CubeIcon className="w-6 h-6"/>} />
        <StatCard label="Gas Price (Gwei)" value={nodeInfo && nodeInfo.gasPrice ? parseFloat(nodeInfo.gasPrice).toFixed(2) : '...'} icon={<CubeIcon className="w-6 h-6"/>} />
    </div>
);

const LatestBlocks: React.FC<{ blocks: BlockInfo[], onBlockSelect: (blockNumber: number) => void }> = ({ blocks, onBlockSelect }) => {
    const BlockRow: React.FC<{ block: BlockInfo }> = ({ block }) => (
        <tr className="border-b border-gray-700 hover:bg-gray-800/80">
            <td className="p-3 font-mono">
                 <button onClick={() => onBlockSelect(block.number)} className="text-brand-orange hover:underline focus:outline-none">
                    {block.number}
                </button>
            </td>
            <td className="p-3 font-mono text-gray-300 hidden md:table-cell">{block.hash.slice(0,10)}...</td>
            <td className="p-3 text-gray-400">{block.txCount}</td>
            <td className="p-3 font-mono text-gray-300 hidden lg:table-cell">{block.gasUsed}</td>
            <td className="p-3 text-gray-400 hidden lg:table-cell">{new Date(block.timestamp * 1000).toLocaleTimeString()}</td>
            <td className="p-3 font-mono text-gray-300 hidden md:table-cell">{block.miner.slice(0,10)}...</td>
        </tr>
    );

    return (
         <div className="bg-gray-800/50 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">Latest Blocks</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                        <tr>
                            <th className="p-3">Block</th>
                            <th className="p-3 hidden md:table-cell">Hash</th>
                            <th className="p-3">Txs</th>
                            <th className="p-3 hidden lg:table-cell">Gas Used</th>
                            <th className="p-3 hidden lg:table-cell">Time</th>
                            <th className="p-3 hidden md:table-cell">Miner</th>
                        </tr>
                    </thead>
                    <tbody>
                        {blocks.length > 0 ? blocks.map(block => (
                            <BlockRow key={block.number} block={block} />
                        )) : (
                           <tr>
                             <td colSpan={6} className="text-center p-8 text-gray-500">
                                Waiting for blocks...
                             </td>
                           </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

interface ExplorerViewProps {
    nodeInfo: NodeInfo | null;
    latestBlocks: BlockInfo[];
    onBlockSelect: (blockNumber: number) => void;
}

export const ExplorerView: React.FC<ExplorerViewProps> = ({ nodeInfo, latestBlocks, onBlockSelect }) => {
    return (
        <>
            <NodeInfoPanel nodeInfo={nodeInfo} />
            <LatestBlocks blocks={latestBlocks} onBlockSelect={onBlockSelect} />
        </>
    );
};
