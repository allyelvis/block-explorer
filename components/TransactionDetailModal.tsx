import React, { useState, useEffect } from 'react';
import { XIcon, SparklesIcon, CopyIcon, CheckIcon } from './Icons';
import type { TransactionResponse } from 'ethers';
import { useGemini } from '../hooks/useGemini';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import { marked } from 'marked';

interface TransactionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    blockNumber: number | null;
    fetchTransactions: (blockNumber: number) => Promise<TransactionResponse[]>;
}

const TransactionRow: React.FC<{ tx: TransactionResponse }> = ({ tx }) => {
    const { isLoading, explainTransaction, isConfigured } = useGemini();
    const [explanation, setExplanation] = useState<string | null>(null);
    const [isExplained, setIsExplained] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleExplain = async () => {
        if (explanation && !isExplained) {
            setIsExplained(true);
            return;
        }
        if (isExplained) {
            setIsExplained(false);
            return;
        }
        const result = await explainTransaction(tx);
        if (result) {
            setExplanation(result);
            setIsExplained(true);
        }
    };
    
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Hash copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <tr className="border-b border-gray-700 bg-gray-800 hover:bg-gray-700/60">
                <td className="p-3 font-mono text-sm">
                    <div className="flex items-center space-x-2">
                         <span className="text-indigo-400">{tx.hash.slice(0, 10)}...</span>
                        <button onClick={() => handleCopy(tx.hash)} className="text-gray-400 hover:text-white">
                            {copied ? <CheckIcon className="w-4 h-4"/> : <CopyIcon className="w-4 h-4"/>}
                        </button>
                    </div>
                </td>
                <td className="p-3 font-mono text-sm hidden md:table-cell text-gray-300">{tx.from.slice(0, 10)}...</td>
                <td className="p-3 font-mono text-sm hidden md:table-cell text-gray-300">{tx.to ? tx.to.slice(0, 10) + '...' : 'Contract Creation'}</td>
                <td className="p-3 font-mono text-sm text-brand-orange">{parseFloat(ethers.formatEther(tx.value)).toFixed(4)} ETH</td>
                <td className="p-3 text-center">
                    {isConfigured && (
                        <button onClick={handleExplain} disabled={isLoading} className="p-1.5 bg-indigo-600/20 text-indigo-300 rounded-full hover:bg-indigo-600/40 disabled:opacity-50 disabled:cursor-wait transition-colors">
                           <SparklesIcon className="w-5 h-5"/>
                        </button>
                    )}
                </td>
            </tr>
            {isExplained && (
                <tr className="bg-gray-800">
                    <td colSpan={5} className="p-4 border-b border-gray-700">
                         <div className="bg-gray-900/70 p-4 rounded-lg border border-indigo-500/30">
                            <div className="prose prose-invert text-gray-300" dangerouslySetInnerHTML={{ __html: explanation ? marked(explanation) : '' }} />
                            <p className="text-xs text-gray-500 mt-2 text-right">Powered by Gemini</p>
                         </div>
                    </td>
                </tr>
            )}
        </>
    );
};

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ isOpen, onClose, blockNumber, fetchTransactions }) => {
    const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && blockNumber !== null) {
            setIsLoading(true);
            setTransactions([]);
            fetchTransactions(blockNumber)
                .then(setTransactions)
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, blockNumber, fetchTransactions]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all border border-gray-700" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-700 sticky top-0 bg-gray-800">
                    <h2 className="text-xl font-bold text-white">Transactions in Block #{blockNumber}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                         <div className="text-center p-10 text-gray-400">Loading transactions...</div>
                    ) : transactions.length > 0 ? (
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700/50 sticky top-0">
                                <tr>
                                    <th className="p-3">Hash</th>
                                    <th className="p-3 hidden md:table-cell">From</th>
                                    <th className="p-3 hidden md:table-cell">To</th>
                                    <th className="p-3">Value</th>
                                    <th className="p-3 text-center">Explain</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(tx => <TransactionRow key={tx.hash} tx={tx} />)}
                            </tbody>
                        </table>
                    ) : (
                         <div className="text-center p-10 text-gray-400">No transactions found in this block.</div>
                    )}
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