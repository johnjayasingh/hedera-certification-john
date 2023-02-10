const { AccountBalanceQuery } = require("@hashgraph/sdk");
const { createSimpleClient } = require("../lib/client");

// Create a new Hedera client
const client = createSimpleClient();


/**
 * Check account and given token balance
 * @param {*} accountId 
 * @param {*} tokenId 
 * @returns AccountBalance | TokenBalance
 */
exports.balanceOf = async (accountId, tokenId) => {
    //Create the account balance query
    const query = new AccountBalanceQuery()
        .setAccountId(accountId);

    //Submit the query to a Hedera network
    const accountBalance = await query.execute(client);

    // If the user needs a particular token balance retreive it
    if (tokenId) {
        return accountBalance.tokens.get(tokenId);
    }
    // Else return the account balance
    return accountBalance;
}



