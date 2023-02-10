const {
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    PrivateKey,
    Wallet,
    TokenAssociateTransaction,
    TransferTransaction,
    TokenGrantKycTransaction,

} = require('@hashgraph/sdk');
const { accountsPath } = require("../../config/constants");
const { createAccountClient, createClient } = require("../../lib/client");
const { balanceOf } = require('../../utils/balance');
const [admin, treasury, account3] = require(accountsPath);

const adminUser = PrivateKey.fromString(admin.privateKey);
const treasuryUser = PrivateKey.fromString(treasury.privateKey);

// Create a Hedera Client
const client = createClient();

/**
 * Create a Token with KYC enabled and a fixed supply
 * @returns 
 */
async function createToken() {
    console.log(`Creating a Token with KYC Key enabled`)
    //Create the token creation transaction
    const transaction = new TokenCreateTransaction()
        .setTokenName('Accubits Hedera')
        .setTokenSymbol('AH')
        .setTokenType(TokenType.FungibleCommon)
        .setTreasuryAccountId(treasury.accountId)
        .setSupplyType(TokenSupplyType.Finite)
        // Maximum and Fixed supply of 1000 with 2 decimal points
        .setInitialSupply(100000)
        .setMaxSupply(100000)
        .setDecimals(2)
        .setAdminKey(adminUser.publicKey)
        .setKycKey(adminUser.publicKey)
        .freezeWith(client);

    // Sign the transaction with the client, as admin account
    let signTx = await transaction.sign(adminUser);
    // Sign the transaction with the client, as treasury account
    signTx = await signTx.sign(treasuryUser);

    // Submit to a Hedera network
    const txResponse = await signTx.execute(client);

    // Get the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    // Get the transaction consensus status
    console.log(`The token create transaction status is: ${receipt.status} \n`);

    // Get the token ID from the receipt
    tokenId = receipt.tokenId;

    console.log(`Created Token ID is ${tokenId}`);
    return tokenId;
};

/**
 * In order to operate/receive token it has to be associated with the user
 * @param {*} tokenId 
 * @param {*} account 
 */
async function associateToken(tokenId, account) {
    // Associate
    const associateTransaction = new TokenAssociateTransaction()
        .setAccountId(account.accountId)
        .setTokenIds([tokenId])
        .freezeWith(client)
    // Sign with the user private key
    const signTx = await associateTransaction.sign(PrivateKey.fromString(account.privateKey));

    //Submit the transaction to a Hedera network
    const txResponse = await signTx.execute(client);

    //Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    //Get the transaction consensus status
    console.log(`User ${account.accountId} is associated with ${tokenId} was ${receipt.status}`);
};

/**
 * Transfer hbar from one account to another
 * @param {*} tokenId 
 * @param {*} sender 
 * @param {*} receiver 
 * @param {*} amount 
 */
async function transferToken(tokenId, sender, receiver, amount) {
    // Create the transfer transaction
    try {
        const transaction = new TransferTransaction()
            .addTokenTransfer(tokenId, sender.accountId, -amount)
            .addTokenTransfer(tokenId, receiver, amount)
            .freezeWith(client);

        // Sign with the supply private key of the token
        const signTx = await transaction.sign(PrivateKey.fromString(sender.privateKey));

        // Submit the transaction to a Hedera network
        const txResponse = await signTx.execute(client);

        // Request the receipt of the transaction
        const receipt = await txResponse.getReceipt(client);

        console.log(`The transfer transaction status ${receipt.status}`);
    } catch (err) {
        // Log the error
        console.error('The transaction errored with message ' + err.status.toString());
    }
};

async function grantKyc(tokenId, accountId) {
    // Create the Token KYC Grant transaction
    const transaction = await new TokenGrantKycTransaction()
        .setAccountId(accountId)
        .setTokenId(tokenId)
        .freezeWith(client);

    // Sign with the supply private key for the kyc 
    const signTx = await transaction.sign(adminUser);

    //Submit the transaction to a Hedera network
    const txResponse = await signTx.execute(client);

    //Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    //Get the transaction consensus status
    const transactionStatus = receipt.status;

    console.log(`KYC Granted for the user ${accountId} for token ${tokenId}`);
};


async function main() {
    // Token Creation
    const tokenId = await createToken();
    // Check Balance Before 
    console.log(`Balance of Treasury ${treasury.accountId} is ${await balanceOf(treasury.accountId, tokenId)}`)

    // Associate The account to the token
    await associateToken(tokenId, account3);

    // Try to do transfer without KYC
    await transferToken(tokenId, treasury, account3.accountId, 1299)

    // Grant KYC
    await grantKyc(tokenId, account3.accountId);

    // Try to do transfer after doing KYC
    await transferToken(tokenId, treasury, account3.accountId, 1299)

    // Check Balance After transfer
    console.log(`Balance of Treasury ${treasury.accountId} is ${await balanceOf(treasury.accountId, tokenId)}`)
    console.log(`Balance of Account#3 ${account3.accountId} is ${await balanceOf(account3.accountId, tokenId)}`)

    process.exit();
}

main();
