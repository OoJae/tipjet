// Ambient types for @particle-network/universal-account-sdk (pinned to the locked
// SDK version — currently V2, 2.0.x). The package ships a top-level "types" field but
// its `exports` map omits a "types" condition, so moduleResolution:"bundler" cannot
// discover its declarations, and a `paths` mapping would redirect the BUNDLER to this
// type-only file (breaking runtime). So we inline the SDK's declarations in an ambient
// `declare module` block. TYPE-ONLY; the bundler loads dist/index.mjs at runtime.
// Regenerate after any SDK version bump by re-copying node_modules/.../dist/index.d.ts.
/* eslint-disable */
declare module "@particle-network/universal-account-sdk" {
import { TransactionInstruction, PublicKey } from '@solana/web3.js';

declare const AXIOS_REQUEST_TIMEOUT = 15000;
declare enum CHAIN_ID {
    SOLANA_MAINNET = 101,
    ETHEREUM_MAINNET = 1,
    BSC_MAINNET = 56,
    BASE_MAINNET = 8453,
    XLAYER_MAINNET = 196,
    ARBITRUM_MAINNET_ONE = 42161
}
declare enum SUPPORTED_TOKEN_TYPE {
    ETH = "eth",
    USDT = "usdt",
    USDC = "usdc",
    BNB = "bnb",
    SOL = "sol"
}
declare const SUPPORTED_TOKEN_TYPES: SUPPORTED_TOKEN_TYPE[];
declare const ZeroAddress = "0x0000000000000000000000000000000000000000";
declare const UNIVERSALX_RPC_URL = "https://universal-rpc-proxy.particle.network";
declare const UNIVERSALX_RPC_URL_STAGING = "https://universal-rpc-staging.particle.network";
declare const UNIVERSAL_ACCOUNT_VERSION_V2 = "2.0.1";
declare const UNIVERSAL_ACCOUNT_VERSION = "2.0.1";
declare const UNIVERSAL_ACCOUNT_VERSION_V2_SUPPORTED_CHAIN_IDS: CHAIN_ID[];
declare const UNIVERSAL_ACCOUNT_VERSION_V2_SUPPORTED_TOKEN_TYPES: SUPPORTED_TOKEN_TYPE[];
declare enum UA_TRANSACTION_STATUS {
    INITIALIZING = 0,
    DEPOSIT_LOCAL = 1,
    DEPOSIT_PENDING = 2,
    WAIT_TO_REFUND = 3,
    EXECUTION_LOCAL = 4,
    EXECUTION_PENDING = 5,
    EXECUTION_FAILED = 6,
    FINISHED = 7,
    REFUND_LOCAL = 8,
    REFUND_PENDING = 9,
    REFUND_FAILED = 10,
    REFUND_FINISHED = 11,
    PENNY_LOCAL = 12,
    PENNY_PENDING = 13,
    PENNY_FAILED = 14
}
declare enum MEV_PROTECTION_TYPE {
    MEV_PROTECTION_OFF = 0,
    MEV_PROTECTION_REDUCE = 1,
    MEV_PROTECTION_SECURITY = 2
}
declare const MEV_PROTECTION_TYPES: MEV_PROTECTION_TYPE[];
declare enum PREFER_TOKEN_TYPE {
    USD = 0,
    NATIVE = 1
}
declare const PREFER_TOKEN_TYPES: PREFER_TOKEN_TYPE[];
declare enum SOLANA_ACCOUNT_INDEX {
    CLASSIC = 1,
    EIP7702 = 11
}

interface IBasicToken {
    chainId: number;
    address: string;
}
interface IBuyTransaction {
    token: IBasicToken;
    amountInUSD: string;
}
interface ISellTransaction {
    token: IBasicToken;
    amount: string;
}
interface ITransferTransaction {
    token: IBasicToken;
    amount: string;
    receiver: string;
}
interface IConvertTransaction {
    chainId: number;
    expectToken: IExpectToken;
}
interface IExpectToken {
    type: SUPPORTED_TOKEN_TYPE;
    amount: string;
}
interface EVMTransaction {
    to: string;
    data: string;
    value?: string;
}
interface SolanaTransaction {
    accounts: {
        pubkey: string;
        isSigner: boolean;
        isWritable: boolean;
    }[];
    programId: string;
    data: string;
}
type Transaction = EVMTransaction | SolanaTransaction;
interface IUniversalTransaction {
    chainId: number;
    expectTokens: IExpectToken[];
    transactions: Transaction[];
}
interface ITokenPair {
    address: string;
    factory: string;
}
interface ITradeConfig {
    slippageBps?: number;
    solanaMEVTipAmount?: number;
    usePrimaryTokens?: SUPPORTED_TOKEN_TYPE[];
    addressLookupTableAccountAddresses?: string[];
    priorityFeeRatio?: number;
    tokenPair?: ITokenPair;
    mevProtection?: MEV_PROTECTION_TYPE;
    preferTokenType?: PREFER_TOKEN_TYPE;
}
interface ISmartAccountOptions {
    name: string;
    version: string;
    ownerAddress: string;
    smartAccountAddress?: string;
    solanaSmartAccountAddress?: string;
    options?: any;
    useEIP7702?: boolean;
    solanaAccountIndex?: SOLANA_ACCOUNT_INDEX;
}
interface IUniversalAccountConfig {
    projectId: string;
    projectClientKey: string;
    projectAppUuid: string;
    smartAccountOptions?: ISmartAccountOptions;
    tradeConfig?: ITradeConfig;
    rpcUrl?: string;
}
type SignMessage = (message: string) => Promise<string>;
interface IToken {
    assetId?: string;
    type?: SUPPORTED_TOKEN_TYPE;
    chainId: number;
    address: string;
    decimals: number;
    realDecimals: number;
    name?: string;
    symbol?: string;
    image?: string;
    isMultiChain?: boolean;
    isMultiChainDefault?: boolean;
    isPrimaryToken?: boolean;
    price?: number;
    isToken2022?: boolean;
    createdAt?: string;
    rank?: number;
}
interface ITokenWithUSD {
    token: IToken;
    amount: string;
    amountInUSD: string;
    senderAddress: string;
    isTokenAccountExist?: boolean;
}
interface ISwap {
    aggregator: string;
    fromToken: ITokenWithUSD;
    toToken: ITokenWithUSD;
}
interface ITokenChanges {
    from: string;
    fromChains: number[];
    to: string;
    toChains: number[];
    decr: ITokenWithUSD[];
    incr: ITokenWithUSD[];
    swaps: ISwap[];
    tokenBalances: ITokenWithUSD[];
    totalFeeInUSD: string;
    slippage: number;
    totalDecrAmountInUSD: string;
    totalIncrAmountInUSD: string;
    totalPaidAmountInUSD: string;
    priceImpact: number;
    priceImpactInUSD: string;
    feeLoss: number;
    feeLossInUSD?: string;
    valueLoss: number;
    minReceiveAmountInUSD: string;
    dexFeeBps?: number;
}
interface IFeeTotals {
    feeTokenAmountInUSD: string;
    gasFeeTokenAmountInUSD: string;
    transactionFeeTokenAmountInUSD: string;
    transactionServiceFeeTokenAmountInUSD: string;
    transactionLPFeeTokenAmountInUSD: string;
    solanaRentFeeAmountInUSD?: string;
    solanaMevTipFee?: string | null;
    solanaRentFee?: string | null;
    solanaMevTipFeeInUSD?: string | null;
    solanaRentFeeInUSD?: string | null;
}
interface IFees {
    totals: IFeeTotals;
    feeTokens: ITokenWithUSD[];
    freeGasFee: boolean;
    freeServiceFee: boolean;
}
interface ITransactionTxEVM {
    uaType: string;
    to: string;
    data: string;
    value?: string;
}
interface ITransactionTxSolana {
    uaType: string;
    programId: string;
    data: string;
    accounts: {
        pubkey: string;
        isSigner: boolean;
        isWritable: boolean;
    }[];
}
type ITransactionTx = ITransactionTxEVM | ITransactionTxSolana;
interface IUserOpEVM {
    sender: string;
    nonce: string;
    initCode: string;
    callData: string;
    paymasterAndData: string;
    signature: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    verificationGasLimit: string;
    callGasLimit: string;
    preVerificationGas: string;
    eip7702AuthSignature?: string;
    eip7702Delegated?: boolean;
    eip7702Auth?: {
        chainId: number;
        nonce: number;
        address: string;
    };
}
interface IUserOpSolana {
    sender: string;
    metaAddress: string;
    credentialId: string;
    nonce: string;
    accountIndex: string;
    accountDeployed: boolean;
    insArgs: {
        accountLen: number;
        data: number[];
    }[];
    expiredAt: string;
    signature: string;
    tipAmount: number;
    txUnitsConsumed: number;
    txUnitPrice: number;
    lastValidBlockHeight: string | null;
    serializedRemainingAccountMetas: {
        pubkey: string;
        isSigner: boolean;
        isWritable: boolean;
    }[];
    serializedAddressLookupTableAccounts: any[];
}
type IUserOp = IUserOpEVM | IUserOpSolana;
interface IUserOpWithChain {
    chainId: number;
    userOp: IUserOp;
    txs: ITransactionTx[];
    feeDeductions: ITokenWithUSD[];
    gasFeeInUSD: string;
    userOpHash: string;
    expiredAt: number;
    startBlock: number;
    gasCostLimitInUSD?: string;
    mevProtection?: boolean;
    solanaTxUnitPrice?: number;
    solanaUnitsConsumed?: number;
    eip7702Auth?: {
        chainId: number;
        nonce: number;
        address: string;
    };
    eip7702Delegated?: boolean;
}
interface IFeeQuote {
    fees: IFees;
    userOps: IUserOpWithChain[];
}
interface ITransactionFees {
    freeGasFee: boolean;
    freeServiceFee: boolean;
    transactionServiceFeeAmountInUSD: string;
    transactionLPFeeAmountInUSD: string;
}
interface ITransaction {
    type: string;
    mode: string;
    sender: string;
    receiver: string;
    smartAccountOptions: ITransactionSmartAccountOptions;
    transactionId: string;
    depositTokens: ITokenWithUSD[];
    lendingTokens: ITokenWithUSD[];
    feeQuotes: IFeeQuote[];
    gasless?: IFeeQuote | null;
    transactionFees: ITransactionFees;
    totalDepositTokenAmountInUSD: string;
    tag: string;
    tokenChanges: ITokenChanges;
    data: any[];
    rootHash: string;
    userOps: IUserOpWithChain[];
    fallback?: boolean;
    solanaPriorityFeeAmount?: string;
    quotedAt?: string;
    additionalData?: Record<string, any>;
}
interface IChainAggregation {
    token: IToken;
    amount: number;
    amountInUSD: number;
    rawAmount: number;
}
interface IAsset {
    tokenType: SUPPORTED_TOKEN_TYPE;
    price: number;
    amount: number;
    amountInUSD: number;
    chainAggregation: IChainAggregation[];
}
interface IAssetsResponse {
    assets: IAsset[];
    totalAmountInUSD: number;
}
interface ITransactionSmartAccountOptions {
    name: string;
    version: string;
    ownerAddress: string;
    senderAddress: string;
    senderSolanaAddress: string;
}
interface EIP7702Authorization {
    userOpHash: string;
    signature: string;
}

declare class UniversalAccount {
    private readonly smartAccountOptions;
    private tradeConfig;
    private readonly projectId;
    private readonly projectClientKey;
    private readonly rpcUrl?;
    constructor(config: IUniversalAccountConfig);
    getPrimaryAssets(): Promise<IAssetsResponse>;
    createBuyTransaction(payload: IBuyTransaction, tradeConfig?: ITradeConfig): Promise<ITransaction>;
    createSellTransaction(payload: ISellTransaction, tradeConfig?: ITradeConfig): Promise<ITransaction>;
    createTransferTransaction(payload: ITransferTransaction): Promise<ITransaction>;
    createUniversalTransaction(payload: IUniversalTransaction, tradeConfig?: ITradeConfig): Promise<ITransaction>;
    createConvertTransaction(payload: IConvertTransaction, tradeConfig?: ITradeConfig): Promise<ITransaction>;
    getSmartAccountOptions(): Promise<ISmartAccountOptions>;
    sendTransaction(transaction: ITransaction, signature: string, authorizations?: EIP7702Authorization[]): Promise<any>;
    getTransaction(transactionId: string): Promise<any>;
    getTransactions(page?: number, limit?: number, tag?: string): Promise<any>;
    getEIP7702Deployments(): Promise<any>;
    getEIP7702Auth(chainIds: number[]): Promise<any>;
    getTokenTransactions(token: IBasicToken, pageToken?: number): Promise<any>;
    getTokenPair(token: IBasicToken): Promise<any>;
    warmUpToken(token: IBasicToken): Promise<any>;
    private injectRootHash;
    private getTradeConfig;
    private getTokenConfig;
    private assertSupportedChain;
    private getTradeOptions;
    private request;
}

declare class UniversalError extends Error {
    readonly code: number;
    readonly data?: unknown;
    constructor(code: number, message: string, data?: unknown);
    toString(): string;
}

declare function getSupportedToken(chainId: number, address: string): IToken | null;
declare function createMultiChainUnsignedData(multiChainUserOps: any[]): any;
declare function injectMultiChainSignature(transaction: ITransaction, signature: string, authorizations?: EIP7702Authorization[]): void;
declare function serializeInstruction(instruction: TransactionInstruction): {
    accounts: {
        pubkey: string;
        isSigner: boolean;
        isWritable: boolean;
    }[];
    programId: string;
    data: string;
};
declare function createCloseTokenAccountInstruction(owner: PublicKey, tokenAccount: PublicKey): Promise<TransactionInstruction>;
declare function createCloseToken2022AccountInstruction(owner: PublicKey, tokenAccount: PublicKey): Promise<TransactionInstruction>;

declare const SOLANA_NATIVE_ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
declare const SUPPORTED_PRIMARY_TOKENS: IToken[];

export { AXIOS_REQUEST_TIMEOUT, CHAIN_ID, MEV_PROTECTION_TYPE, MEV_PROTECTION_TYPES, PREFER_TOKEN_TYPE, PREFER_TOKEN_TYPES, SOLANA_ACCOUNT_INDEX, SOLANA_NATIVE_ADDRESS_ZERO, SUPPORTED_PRIMARY_TOKENS, SUPPORTED_TOKEN_TYPE, SUPPORTED_TOKEN_TYPES, UA_TRANSACTION_STATUS, UNIVERSALX_RPC_URL, UNIVERSALX_RPC_URL_STAGING, UNIVERSAL_ACCOUNT_VERSION, UNIVERSAL_ACCOUNT_VERSION_V2, UNIVERSAL_ACCOUNT_VERSION_V2_SUPPORTED_CHAIN_IDS, UNIVERSAL_ACCOUNT_VERSION_V2_SUPPORTED_TOKEN_TYPES, UniversalAccount, UniversalError, ZeroAddress, createCloseToken2022AccountInstruction, createCloseTokenAccountInstruction, createMultiChainUnsignedData, getSupportedToken, injectMultiChainSignature, serializeInstruction };
export type { EIP7702Authorization, EVMTransaction, IAsset, IAssetsResponse, IBasicToken, IBuyTransaction, IChainAggregation, IConvertTransaction, IExpectToken, IFeeQuote, IFeeTotals, IFees, ISellTransaction, ISmartAccountOptions, ISwap, IToken, ITokenChanges, ITokenPair, ITokenWithUSD, ITradeConfig, ITransaction, ITransactionFees, ITransactionTx, ITransactionTxEVM, ITransactionTxSolana, ITransferTransaction, IUniversalAccountConfig, IUniversalTransaction, IUserOp, IUserOpEVM, IUserOpSolana, IUserOpWithChain, SignMessage, SolanaTransaction, Transaction };

}
