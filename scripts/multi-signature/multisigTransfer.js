const {
    Client,
    PrivateKey,
    AccountCreateTransaction,
    TransferTransaction,
    Hbar,
    KeyList,
} = require('@hashgraph/sdk');
const { balanceOf } = require('../../utils/balance');
const { accountsPath } = require('../../config/constants');
const { createClient } = require('../../lib/client');
const [account1, account2, account3, account4] = require(accountsPath);

// Create a Hedera Client
const client = createClient();



function publicKeyOf(account) {
    return PrivateKey.fromString(account.privateKey).publicKey
}

async function main() {
    console.log('Gathering account public keys')
    // Create list of multi sig account public keys
    const publicKeys = [account1, account2, account3].map(publicKeyOf);

    // Create a Key list with 3 keys and require 2 signatures
    const keyList = new KeyList(publicKeys, 2);
    console.log(`Created a KeyList of 3 with 2 minimum key requirment`)
    //Create a multi signature account with 20 Hbar starting balance
    const multiSigAccount = await new AccountCreateTransaction()
        .setKey(keyList)
        .setInitialBalance(Hbar.from(20))
        .execute(client);

    // Get the new account ID
    const receipt = await multiSigAccount.getReceipt(client);
    const multiSigAccountID = receipt.accountId;

    console.log(`Created Multi Signature Wallet Account ID is ${multiSigAccountID}`);


    // Logging initial balances
    console.log(`Balance of multi sig wallet ${multiSigAccountID} is ${await balanceOf(multiSigAccountID)}`)
    console.log(`Balance of receiver wallet ${account4.accountId} is ${await balanceOf(account4.accountId)}`)

    // Creating a Transaction to send 10 HBAR to another account from MultiSig account
    const transaction = new TransferTransaction()
        .addHbarTransfer(multiSigAccountID, Hbar.fromString(`-10`))
        .addHbarTransfer(account4.accountId, Hbar.fromString('10'))
        .freezeWith(client);

    // Sign transaction with first account of three
    let signTx = await transaction.sign(
        PrivateKey.fromString(account1.privateKey)
    );

    console.log(`Send the transaction with 1 of 2 required keys signed`)

    // Sign with the client operator key to pay for the transaction and submit to a Hedera network
    const txResponseFail = await signTx.execute(client);

    //Trying to get the receipt of the transaction
    try {
        // Check if the transaction is success
        await txResponseFail.getReceipt(client);
    } catch (err) {
        // Log the error
        console.error(`The transfer Transaction has failed with stauts ${err.status}`);
    }


    // Creating a Transaction to send 10 HBAR to another account from MultiSig account
    const transactionTwo = new TransferTransaction()
        .addHbarTransfer(multiSigAccountID, Hbar.fromString(`-10`))
        .addHbarTransfer(account4.accountId, Hbar.fromString('10'))
        .freezeWith(client);

    // Sign transaction with first account key of two
    let signTx2 = await transactionTwo.sign(
        PrivateKey.fromString(account1.privateKey)
    );


    // Sign with second key of two
    signTx2 = await signTx2.sign(
        PrivateKey.fromString(account2.privateKey)
    );


    // Sign with the client operator key to pay for the transaction and submit to a Hedera network
    const txResponseSuccess = await signTx2.execute(client);

    //Trying to get the receipt of the transaction
    try {
        // Check if the transaction is success
        const receipt = await txResponseSuccess.getReceipt(client);
        console.log(`Transaction has completed with status ${receipt.status}`)
    } catch (err) {
        // Log the error if any
        console.error(`The Transaction has failed with stauts ${err.status}`);
    }
    // Logging final balances
    console.log(`Balance of multi sig wallet ${multiSigAccountID} is ${await balanceOf(multiSigAccountID)}`)
    console.log(`Balance of receiver wallet ${account4.accountId} is ${await balanceOf(account4.accountId)}`)

    process.exit();
};


main();