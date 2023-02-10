const { PrivateKey, AccountCreateTransaction, Hbar } = require('@hashgraph/sdk');
const { writeFile } = require('fs/promises');
const { join } = require('path');
const { accountsPath, envPath } = require('../config/constants');
const { createClient } = require('../lib/client');
const { balanceOf } = require('../utils/balance');

// Load environment variables
require('dotenv').config({
    path: envPath
});

// new accounts to created using provided master account
const masterAccountId = process.env.CLIENT_ID;
const masterPrivateKey = process.env.CLIENT_PRIVATE_KEY;

// no of accounts to be created and amount of hbar to transfer as initial balance
const seedCount = process.env.SEED_COUNT || 5;
const seedAmount = process.env.SEED_AMOUNT || '1000';

// Create a new Hedera client
const client = createClient(masterAccountId, masterPrivateKey);

/**
 * Creates new hbar funded hedera account
 */
async function createAccount() {
    const _privateKey = PrivateKey.generateED25519();
    const account = await new AccountCreateTransaction()
        .setKey(_privateKey.publicKey)
        .setInitialBalance(Hbar.fromString(seedAmount))
        .execute(client);

    // Get the new account ID
    const getReceipt = await account.getReceipt(client);
    const accountId = getReceipt.accountId;

    return { accountId: `${accountId}`, privateKey: `${_privateKey}` };
};

async function main() {
    let accounts = [];
    const masterBalance = await balanceOf(masterAccountId);
    console.log(`Master Account ${masterAccountId} has balance ${masterBalance.hbars}`);
    // Repeat the account creation as per the seed count
    for (let index = 0; index < seedCount; index++) {
        const account = await createAccount();
        const accountBalance = await balanceOf(account.accountId)

        //Print the balance of hbars
        console.log(`Account ${index + 1} : ${account.accountId} balance ${accountBalance.hbars}`);
        accounts.push(account);
    }
    // Write the seed accounts to a JSON file and reuse it 
    await writeFile(accountsPath, JSON.stringify(accounts, null, 3))
    process.exit();
}

main();