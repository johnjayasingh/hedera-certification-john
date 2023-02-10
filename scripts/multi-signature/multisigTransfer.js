const {
    PrivateKey,
    AccountCreateTransaction,
    TransferTransaction,
    Hbar,
    KeyList,
    ScheduleInfoQuery,
    ScheduleSignTransaction,
} = require('@hashgraph/sdk');
const { balanceOf } = require('../../utils/balance');
const { accountsPath } = require('../../config/constants');
const { createClient } = require('../../lib/client');
const [account1, account2, account3, account4] = require(accountsPath);

// Create a Hedera Client
const client = createClient();


/**
 * Print the schedule Id info
 * @param {*} scheduleId 
 */
async function printInfo(scheduleId) {
    const info = await new ScheduleInfoQuery().setScheduleId(scheduleId)
        .execute(client);
    console.log(`\n\n
            Scheduled Transaction Info 
            ID               : ${scheduleId} 
            Memo             : ${info.scheduleMemo}
            Creator          : ${info.creatorAccountId}
            Payer            : ${info.payerAccountId}
            Expiration Time  : ${info.expirationTime}
            Execution Status : ${info.executed}
        `);

    console.log(`${info.executed ?'Transaction Executed': 'Transaction Pending to be executed'} - ${new Date().toISOString()}`)
}


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
        .schedule()
        .freezeWith(client);

    // Sign transaction with first account of three
    let signTx = await transaction.sign(
        PrivateKey.fromString(account1.privateKey)
    );

    console.log(`Send the transaction with 1 of 2 required keys signed`)

    // Sign with the client operator key to pay for the transaction and submit to a Hedera network
    const txResponse1 = await signTx.execute(client);

    //Trying to get the receipt of the transaction
    const receipt1 = await txResponse1.getReceipt(client);

    // Check if the transaction is success
    await printInfo(receipt1.scheduleId);

    console.log(`Adding the signature by Account 2`);
    // Add Signature by Account 2
    const txScheduleSign2 = await (
        await new ScheduleSignTransaction()
            .setScheduleId(receipt1.scheduleId)
            .freezeWith(client)
            .sign(PrivateKey.fromString(account2.privateKey))
    ) 

    const txResponse2 = await txScheduleSign2.execute(client);
    const receipt2 = await txResponse2.getReceipt(client);
    console.log(
        `Creating and executing transaction ${txResponse2.transactionId.toString()} status: ${receipt2.status
        }`
    );


    await printInfo(receipt1.scheduleId);


    // Logging final balances
    console.log(`Balance of multi sig wallet ${multiSigAccountID} is ${await balanceOf(multiSigAccountID)}`)
    console.log(`Balance of receiver wallet ${account4.accountId} is ${await balanceOf(account4.accountId)}`)

    process.exit();
};


main();