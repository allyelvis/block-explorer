import { useState, useCallback, useEffect } from 'react';
import { Account, WalletAccount } from '../types';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';

const { formatEther, parseEther } = ethers;

const usePersistentState = <T,>(key: string, initialValue: T): [T, (value: T) => void] => {
    const [state, setState] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setPersistentState = (value: T) => {
        try {
            const valueToStore = JSON.stringify(value);
            window.localStorage.setItem(key, valueToStore);
            setState(value);
        } catch (error) {
            console.error(error);
        }
    };

    return [state, setPersistentState];
};

export const useWallet = (provider: ethers.JsonRpcProvider | null) => {
    const [importedAccounts, setImportedAccounts] = usePersistentState<Omit<WalletAccount, 'balance'>[]>('importedAccounts', []);
    const [hydratedImportedAccounts, setHydratedImportedAccounts] = useState<WalletAccount[]>([]);
    
    const [watchedAccounts, setWatchedAccounts] = usePersistentState<Omit<Account, 'balance'>[]>('watchedAccounts', []);
    const [hydratedWatchedAccounts, setHydratedWatchedAccounts] = useState<Account[]>([]);

    const updateBalances = useCallback(async () => {
        if (!provider) return;

        if (importedAccounts.length > 0) {
            const impAccPromises = importedAccounts.map(async (acc) => {
                const balance = await provider.getBalance(acc.address);
                return { ...acc, balance: parseFloat(formatEther(balance)).toFixed(4) };
            });
            const settledImported = await Promise.all(impAccPromises);
            setHydratedImportedAccounts(settledImported);
        } else {
            setHydratedImportedAccounts([]);
        }

        if (watchedAccounts.length > 0) {
             const watAccPromises = watchedAccounts.map(async (acc) => {
                const balance = await provider.getBalance(acc.address);
                return { ...acc, balance: parseFloat(formatEther(balance)).toFixed(4) };
            });
            const settledWatched = await Promise.all(watAccPromises);
            setHydratedWatchedAccounts(settledWatched);
        } else {
             setHydratedWatchedAccounts([]);
        }
    }, [provider, importedAccounts, watchedAccounts]);

    useEffect(() => {
        if (provider) {
            updateBalances();
            provider.on('block', updateBalances);
        }
        return () => {
            provider?.off('block', updateBalances);
        }
    }, [provider, updateBalances]);

    const importAccount = useCallback((privateKey: string) => {
        try {
            if (!privateKey.startsWith('0x')) {
                privateKey = '0x' + privateKey;
            }
            const wallet = new ethers.Wallet(privateKey);
            const address = wallet.address;

            if (importedAccounts.some(acc => acc.address.toLowerCase() === address.toLowerCase())) {
                toast.error("Account already imported.");
                return;
            }
            
            const newAccount = { address, privateKey };
            setImportedAccounts([...importedAccounts, newAccount]);
            toast.success("Account imported successfully!");
        } catch (e) {
            console.error(e);
            toast.error("Invalid private key.");
        }
    }, [importedAccounts, setImportedAccounts]);

    const removeImportedAccount = useCallback((address: string) => {
        setImportedAccounts(importedAccounts.filter(acc => acc.address.toLowerCase() !== address.toLowerCase()));
        toast.success("Account removed.");
    }, [importedAccounts, setImportedAccounts]);

    const addWatchedAccount = useCallback((address: string) => {
        if (!ethers.isAddress(address)) {
            toast.error("Invalid Ethereum address.");
            return;
        }
        if (watchedAccounts.some(acc => acc.address.toLowerCase() === address.toLowerCase()) || importedAccounts.some(acc => acc.address.toLowerCase() === address.toLowerCase())) {
            toast.success("Address is already being managed or watched.");
            return;
        }
        setWatchedAccounts([...watchedAccounts, { address }]);
        toast.success("Address added to watch list!");
    }, [watchedAccounts, setWatchedAccounts, importedAccounts]);
    
    const removeWatchedAccount = useCallback((address: string) => {
        setWatchedAccounts(watchedAccounts.filter(acc => acc.address.toLowerCase() !== address.toLowerCase()));
        toast.success("Address removed from watch list.");
    }, [watchedAccounts, setWatchedAccounts]);

    const sendTransaction = useCallback(async (from: string, to: string, amount: string) => {
        if (!provider || !from || !to || !amount) {
            toast.error("All transaction fields are required.");
            return;
        }

        const toastId = toast.loading("Preparing transaction...");
        try {
            let signer: ethers.Signer;
            const imported = importedAccounts.find(acc => acc.address.toLowerCase() === from.toLowerCase());

            if (imported) {
                signer = new ethers.Wallet(imported.privateKey, provider);
            } else {
                signer = await provider.getSigner(from);
            }
            
            const tx = {
                to,
                value: parseEther(amount)
            };

            toast.loading("Sending transaction...", { id: toastId });
            const txResponse = await signer.sendTransaction(tx);
            
            toast.loading("Waiting for confirmation...", { id: toastId });
            await txResponse.wait();
            
            toast.success("Transaction confirmed!", { id: toastId });
            updateBalances(); // Manually trigger balance update
        } catch (e: any) {
            console.error("Transaction failed:", e);
            toast.error(e.reason || "Transaction failed.", { id: toastId });
        }
    }, [provider, importedAccounts, updateBalances]);

    return { 
        importedAccounts: hydratedImportedAccounts, 
        importAccount, 
        removeImportedAccount,
        watchedAccounts: hydratedWatchedAccounts,
        addWatchedAccount,
        removeWatchedAccount,
        sendTransaction 
    };
};