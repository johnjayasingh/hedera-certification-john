const { PrivateKey, Client } = require('@hashgraph/sdk');

const { envPath } = require("../config/constants");

// Load environment variables
require('dotenv').config({
    path: envPath
});

const { CLIENT_ID, CLIENT_PRIVATE_KEY } = process.env;

/**
 * Create client for general purpose with master account
 * @returns 
 */
exports.createClient = () => {
    // Check if the required accounts are present
    if (CLIENT_ID == null || CLIENT_PRIVATE_KEY == null) {
        throw new Error(
            'Both CLIENT_ID and CLIENT_PRIVATE_KEY must be present'
        );
    }
    const client = Client.forTestnet();
    client.setOperator(CLIENT_ID, PrivateKey.fromString(CLIENT_PRIVATE_KEY));
    return client;
}


/**
 * Create client for signing purpose
 * @param {*} accountId 
 * @param {*} privateKey 
 * @returns 
 */
exports.createAccountClient = (accountId, privateKey) => {
    // Check if the required accounts are present
    if (accountId == null || privateKey == null) {
        throw new Error(
            'Both accountId and privateKey must be present'
        );
    }
    const client = Client.forTestnet();
    client.setOperator(accountId, PrivateKey.fromString(privateKey));
    return client;
}

/**
 * Create client for data fetch purpose
 * @returns 
 */
exports.createSimpleClient = () => {
    const client = Client.forTestnet();
    return client;
}