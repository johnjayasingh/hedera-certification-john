const { TransferTransaction, ScheduleDeleteTransaction, PrivateKey, ScheduleInfoQuery, ScheduleCreateTransaction, ScheduleSignTransaction, Hbar } = require("@hashgraph/sdk");
const { accountsPath } = require("../../config/constants");
const { createAccountClient, createClient } = require("../../lib/client");
const [account1, account2, admin] = require(accountsPath);


// Create a Hedera Client
const client = createClient();

/**
 * Create a simple transfer transaction and create schedule transaction with it
 * @returns scheduleId
 */
async function createScheduleTransfer() {
    // Create a transaction to schedule
    const transaction = new TransferTransaction()
        .addHbarTransfer(account1.accountId, Hbar.fromString('-2'))
        .addHbarTransfer(account2.accountId, Hbar.fromString('2'));
    console.log('Created a tranfer transaction without any signatures')

    const adminKey = PrivateKey.fromString(admin.privateKey);
    // Schedule a transaction without signing the transfer 
    const scheduleTransaction = new ScheduleCreateTransaction()
        .setScheduledTransaction(transaction)
        // Make each transaction unique
        .setScheduleMemo(`Scheduled Transaction From Account 1 to Account 2 on ${new Date().toISOString()}`)
        .setAdminKey(adminKey.publicKey)
        .freezeWith(client);
    console.log('Creating a schedule transaction for the transfer')

    // Sign the scheduled transaction
    const signTx = await scheduleTransaction.sign(adminKey);

    //Sign with the account 1 key and submit the transaction to a Hedera network
    const txResponse = await signTx.execute(client);

    //Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    //Get the schedule ID
    const scheduleId = receipt.scheduleId;
    console.log(`Schedule transaction is created ${scheduleId}`);
    return scheduleId;
}


/**
 * Delete the schedule transaction if it's not executed by Hedera yet
 * @param {*} scheduleId 
 */
async function deleteSchedule(scheduleId) {
    // Create a delete schedule transaction with schedule id
    const scheduleTransaction = new ScheduleDeleteTransaction({
        scheduleId
    }).freezeWith(client);


    // Sign with the account 1 key and submit the delete transaction to a Hedera network
    const signTx = await scheduleTransaction.sign(PrivateKey.fromString(admin.privateKey))
    const txResponse = await signTx.execute(client);

    //Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    //Get the schedule ID
    console.log(`Schedule transaction  ${scheduleId} is deleted ${receipt.status}`);
}

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
        `);
}


async function executeSchedule(scheduleId) {
    try {
        // Get the schedule transaction
        const transaction = new ScheduleSignTransaction({
            scheduleId
        }).freezeWith(client);
        // Sign the transaction with required key
        const signTx = await transaction.sign(PrivateKey.fromString(account1.privateKey));
        const txResponse = await signTx.execute(client);
        const receipt = await txResponse.getReceipt(client);
        console.log(
            `Schedule Transaction ${scheduleId} status is ${receipt.status}`
        );

    } catch (error) {
        console.log(`Failed to execute transaction ${error.message}`)
    }
}

async function main() {
    // Create a transfer schedule 
    const scheduleId = await createScheduleTransfer();
    // Delete the schedule transaction before execution
    await deleteSchedule(scheduleId);
    // Schedule transaction info
    await printInfo(scheduleId);
    // Try and Execute the schedule transaction with signature
    await executeSchedule(scheduleId);
    process.exit();
}

main();