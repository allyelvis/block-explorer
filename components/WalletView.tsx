import React from 'react';
import { Account, WalletAccount } from '../types';
import { useWallet } from '../hooks/useWallet';
import { CopyIcon, CheckIcon, SendIcon, KeyIcon, ExclamationTriangleIcon, TrashIcon } from './Icons';
import toast from 'react-hot-toast';

interface WalletViewProps {
    unlockedAccounts: Account[];
    currentNodeSupportsAccounts: boolean;
    wallet: ReturnType<typeof useWallet>;
}

const AccountCard: React.FC<{ 
    account: Account | WalletAccount; 
    type: 'unlocked' | 'imported';
    onRemove?: (address: string) => void;
}> = ({ account, type, onRemove }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Address copied!");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-gray-800 p-3 rounded-lg flex items-center justify-between hover:bg-gray-700/50 transition-colors duration-200">
            <div className="flex items-center space-x-3 overflow-hidden">
                <span className="text-xs font-mono text-gray-500">{type === 'unlocked' ? 'NODE' : 'IMP'}</span>
                <p className="font-mono text-gray-300 text-sm truncate">{account.address}</p>
            </div>
            <div className="flex items-center space-x-4 flex-shrink-0">
                <p className="font-mono text-base text-white">{account.balance} <span className="text-brand-orange text-xs">ETH</span></p>
                <button onClick={() => handleCopy(account.address)} className="text-gray-400 hover:text-white transition-colors">
                    {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                </button>
                {type === 'imported' && onRemove && (
                    <button onClick={() => onRemove(account.address)} className="text-gray-400 hover:text-red-400 transition-colors">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

const SendTransaction: React.FC<{
    accounts: (Account | WalletAccount)[];
    onSend: (from: string, to: string, amount: string) => void;
}> = ({ accounts, onSend }) => {
    const [from, setFrom] = React.useState('');
    const [to, setTo] = React.useState('');
    const [amount, setAmount] = React.useState('');

    React.useEffect(() => {
        if (accounts.length > 0 && !from) setFrom(accounts[0].address);
        if (accounts.length > 1 && !to) setTo(accounts[1].address);
        else if (accounts.length > 0 && !to) setTo(accounts[0].address);
    }, [accounts, from, to]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSend(from, to, amount);
        setAmount('');
    };

    if (accounts.length === 0) return null;

    return (
        <div className="bg-gray-800/50 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">Send ETH</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">From</label>
                    <select value={from} onChange={e => setFrom(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white font-mono text-sm">
                        {accounts.map(acc => <option key={acc.address} value={acc.address}>{acc.address.slice(0, 20)}... ({acc.balance} ETH)</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">To</label>
                    <input type="text" value={to} onChange={e => setTo(e.target.value)} placeholder="Recipient address" className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white font-mono" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Amount (ETH)</label>
                    <input type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.1" className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white font-mono" />
                </div>
                <button type="submit" className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors">
                    <SendIcon />
                    <span>Send Transaction</span>
                </button>
            </form>
        </div>
    );
};

const ImportAccount: React.FC<{ onImport: (pk: string) => void }> = ({ onImport }) => {
    const [pk, setPk] = React.useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pk) {
            onImport(pk);
            setPk('');
        }
    };
    return (
        <div className="bg-gray-800/50 rounded-lg p-6 shadow-lg">
             <h2 className="text-xl font-bold text-white mb-4">Import Account</h2>
             <div className="bg-red-900/50 border border-red-500/50 text-red-300 p-3 rounded-lg mb-4 flex items-start space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-xs">Never use private keys from mainnet accounts. This feature is for development purposes only and is not secure.</p>
             </div>
             <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                <input
                    type="password"
                    value={pk}
                    onChange={e => setPk(e.target.value)}
                    placeholder="Enter private key"
                    className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white font-mono flex-grow"
                    aria-label="Private Key"
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center space-x-2">
                    <KeyIcon className="w-5 h-5"/>
                    <span>Import</span>
                </button>
            </form>
        </div>
    )
}

const AddressWatcher: React.FC<{ onAdd: (address: string) => void }> = ({ onAdd }) => {
    const [address, setAddress] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (address) {
            onAdd(address);
            setAddress('');
        }
    };

    return (
        <div className="bg-gray-800/50 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">Watch Address</h2>
            <p className="text-sm text-gray-400 mb-4">Monitor the balance of any external address.</p>
            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"
                    className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white font-mono flex-grow"
                    aria-label="Ethereum Address"
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                    Add
                </button>
            </form>
        </div>
    );
};


export const WalletView: React.FC<WalletViewProps> = ({ unlockedAccounts, currentNodeSupportsAccounts, wallet }) => {
    const { importedAccounts, importAccount, removeImportedAccount, watchedAccounts, addWatchedAccount, removeWatchedAccount, sendTransaction } = wallet;
    const manageableAccounts = [...unlockedAccounts, ...importedAccounts];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-8">
                <div className="bg-gray-800/50 rounded-lg p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-white mb-4">Managed Accounts</h2>
                    {manageableAccounts.length > 0 ? (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {unlockedAccounts.map(acc => <AccountCard key={acc.address} account={acc} type="unlocked" />)}
                            {importedAccounts.map(acc => <AccountCard key={acc.address} account={acc} type="imported" onRemove={removeImportedAccount} />)}
                        </div>
                    ) : (
                        <p className="text-center py-4 text-gray-500 text-sm">No accounts found. Import an account or connect to a node that provides them (like Ganache).</p>
                    )}
                </div>
                
                {manageableAccounts.length > 0 && (
                    <SendTransaction accounts={manageableAccounts} onSend={sendTransaction} />
                )}

                <ImportAccount onImport={importAccount} />

            </div>
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-gray-800/50 rounded-lg p-6 shadow-lg">
                     <h2 className="text-xl font-bold text-white mb-4">Watched Accounts</h2>
                      {watchedAccounts.length > 0 ? (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                           {watchedAccounts.map(acc => <AccountCard key={acc.address} account={acc} type="unlocked" onRemove={removeWatchedAccount} />)}
                        </div>
                    ) : (
                        <p className="text-center py-4 text-gray-500 text-sm">No addresses being watched.</p>
                    )}
                </div>
                 <AddressWatcher onAdd={addWatchedAccount} />
            </div>
        </div>
    );
};
