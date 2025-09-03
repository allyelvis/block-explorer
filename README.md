# Block Explorer

A sleek and modern block explorer with a built-in local node manager and AI-powered transaction analysis. This application allows you to connect to public EVM endpoints or a local Ganache node, inspect blockchain data, manage wallets, and get plain-English explanations of blockchain transactions powered by Google Gemini.

## ✨ Features

-   **Connect to any EVM Node**: Easily switch between a local Ganache instance, public endpoints, or private nodes that require an API key.
-   **Real-time Blockchain Data**: View live updates on the latest block number, chain ID, and current gas prices.
-   **Live Block Feed**: See new blocks as they are mined in a clean, auto-updating table.
-   **Transaction Inspector**: Click on a block to view all transactions within it, including hash, sender, receiver, and value.
-   **AI-Powered Analysis**: Leverage Google Gemini to get simple, markdown-formatted explanations of complex transactions with a single click.
-   **Local Node Manager**: A UI to configure and simulate starting/stopping a local `ganache` test node. *(Note: This is a simulation and does not actually spawn a process.)*
-   **Integrated Wallet**:
    -   **Send ETH**: Transfer funds between accounts connected to the node or accounts you've imported.
    -   **Import Accounts**: Add your own development accounts by providing a private key. Balances are updated in real-time.
    -   **Watch Addresses**: Monitor the balance of any external address without needing its private key.
-   **Modern Tech Stack**: Built with React, TypeScript, and Ethers.js for a robust and type-safe experience.
-   **Zero Build Setup**: Runs directly in the browser using ES Modules via an import map. No `npm install` or bundler required.

## 🚀 Getting Started

This project is designed to run without a complex build process. All you need is a local web server.

### Prerequisites

-   A modern web browser (Chrome, Firefox, Edge, etc.).
-   A local web server. If you have Node.js, you can use `serve`. If you have Python, you can use its built-in server.

### Running the Application

1.  **Clone the repository or download the files.**

2.  **Serve the files:**
    Navigate to the project's root directory in your terminal and start a local server.

    *Using Node.js/npx:*
    ```bash
    npx serve
    ```

    *Using Python 3:*
    ```bash
    python -m http.server
    ```

3.  **Open the app:**
    Open your web browser and navigate to the URL provided by your local server (e.g., `http://localhost:3000` or `http://localhost:8000`).

### Configuration

#### Google Gemini API Key

To enable the AI-powered transaction explanation feature, you must provide a Google Gemini API key.

The application is designed to read the key from the `process.env.API_KEY` environment variable. The execution environment where this application is hosted is responsible for making this variable accessible to the browser's runtime.

## 🛠️ Technologies Used

-   **Frontend**: React, TypeScript, Tailwind CSS
-   **Blockchain Interaction**: Ethers.js
-   **AI**: Google Gemini API (`@google/genai`)
-   **Notifications**: React Hot Toast
-   **Markdown Rendering**: Marked

## 📂 Project Structure

```
.
├── components/         # React components
│   ├── App.tsx             # Main application component
│   ├── ExplorerView.tsx    # UI for block/node info
│   ├── GanacheNodeGenerator.tsx # UI for local node manager
│   ├── Icons.tsx           # SVG icons
│   ├── TransactionDetailModal.tsx # Modal for block transactions
│   └── WalletView.tsx      # UI for wallet management
├── hooks/              # Custom React hooks
│   ├── useGanache.ts       # Logic for connecting to an EVM node
│   ├── useGemini.ts        # Logic for interacting with the Gemini API
│   ├── useLocalNodeManager.ts # Mock logic for the node manager
│   └── useWallet.ts        # Logic for wallet state and actions
├── index.html          # Main HTML entry point with import map
├── index.tsx           # React application root
├── metadata.json       # Application metadata
├── types.ts            # TypeScript type definitions
└── README.md           # This file
```