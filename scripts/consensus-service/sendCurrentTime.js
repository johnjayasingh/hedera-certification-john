const {
    Client,
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
    TopicMessageQuery,
} = require("@hashgraph/sdk");
const { accountsPath } = require("../../config/constants");
const { createAccountClient } = require("../../lib/client");
const [accountOne] = require(accountsPath);

// Create a Hedera Client
const client = createAccountClient(accountOne.accountId, accountOne.privateKey);

//Main function
async function main() {
    // create a new topic to submit message
    const topicId = await createTopic();

    //Creating a delay before subscribing
    await new Promise((resolve) => setTimeout(resolve, 5000));

    //Subscribing to the topic
    await subscribeTopic(topicId.toString());

    //Calculate current time
    const currentTime = new Date().toUTCString();

    //Submitting message to the topic
    await submitMsg(topicId, currentTime);

    process.exit();
}

//To create a topic and return the topic ID
async function createTopic() {
    try {

        //Create a new topic
        let txResponse = await new TopicCreateTransaction().execute(client);

        //Get the receipt of the transaction
        let receipt = await txResponse.getReceipt(client);

        console.log(`Topic ${receipt.topicId} created with Account 1 ${accountOne.accountId}`);

        //Grab the new topic ID from the receipt
        return receipt.topicId;
    } catch (err) {
        console.log("Error in topic creation : " + err);
    }
}

//To subscribe a topic and console the incoming messages
async function subscribeTopic(topicId) {
    try {
        //Create the query to subscribe to a topic
        new TopicMessageQuery()
            .setTopicId(topicId)
            .setStartTime(0)
            .subscribe(client, null, (message) => {
                let messageAsString = Buffer.from(message.contents, "utf8").toString();
                console.log(
                    `${message.consensusTimestamp.toDate()} Received: ${messageAsString}`
                );
            });
    } catch (err) {
        console.log("Error in subscribe topic : " + err);
    }
}

//To submit a message to the topic
async function submitMsg(topicId, message) {
    try {
        // Send one message
        const sendResponse = await new TopicMessageSubmitTransaction({
            topicId,
            message,
        }).execute(client);

        //Get the receipt of the transaction
        const getReceipt = await sendResponse.getReceipt(client);

        //Get the status of the transaction
        const transactionStatus = getReceipt.status;
        console.log(
            "The message transaction status: " + transactionStatus.toString()
        );

        return true;
    } catch (err) {
        console.log("Error in Submit Message : " + err);
    }
}

main();
