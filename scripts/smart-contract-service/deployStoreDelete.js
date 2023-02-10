const { ContractCreateFlow, ContractExecuteTransaction, ContractFunctionParameters, ContractDeleteTransaction, PrivateKey } = require('@hashgraph/sdk')
const { hethers } = require('@hashgraph/hethers');

const { bytecode } = require('./bytecode')
const { createClient } = require('../../lib/client');

// Create a new Hedera client
const client = createClient();


/**
 * Deploy Solidity smart contract to Hedera with contract create flow
 * @returns contractId
 */
async function deployContract() {
    console.log(`Compiled smart contract and deploying to hedera network`)
    // Create contract with the bytecode created for the solidity smart contract
    const contractCreation = new ContractCreateFlow()
        .setAdminKey(PrivateKey.fromString(process.env.CLIENT_PRIVATE_KEY).publicKey)
        .setGas(100000)
        .setBytecode(`${bytecode}`);

    // Sign the transaction with the client operator key and submit to a Hedera network
    const txResponse = await contractCreation.execute(client);

    // Get the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    // Get the new contract ID
    const contractId = receipt.contractId;

    console.log(`The Deployed Contract ID is ${contractId}`);
    return contractId;
}

/**
 * Store the test values to the created smart contract
 * @param {*} contractId 
 * @param {*} num1 
 * @param {*} num2 
 */
async function storeValues(contractId, num1, num2) {
    console.log(`Calling the function1 with parameters ${num1} and ${num2} `)
    //Create the transaction to call function1
    const storeFunction = new ContractExecuteTransaction()
        //Set the ID of the contract
        .setContractId(contractId)
        //Set the gas for the contract call
        .setGas(100000)
        //Set the contract function to call
        .setFunction('function1', new ContractFunctionParameters()
            .addUint16(num1)
            .addUint16(num2)
        );

    //Submit the transaction to a Hedera network and store the response  with client operator keys
    const storeFunctionResponse = await storeFunction.execute(client);

    // Get the result record of the transaction
    const record = await storeFunctionResponse.getRecord(client);

    // Encode the result with the help of ABI and result string
    const encodedResult1 = '0x' + record.contractFunctionResult.bytes.toString('hex');
    const abicoder = new hethers.utils.AbiCoder();
    const result = abicoder.decode(['uint16'], encodedResult1);

    console.log(`function1 has been executed and the result is ${result}`);

}


/**
 * Delete the deployed smart contract
 * @param {*} contractId 
 */
async function deleteContract(contractId) {
    // Create a delete transaction
    const deleteFunction = new ContractDeleteTransaction({
        contractId,
        transferAccountId: process.env.CLIENT_ID
    })

    // Submit the delete transaction to a Hedera network with client operator keys
    const txResponse = await deleteFunction.execute(client);

    // Transaction status
    const receipt = await txResponse.getReceipt(client);

    console.log(`Smart contract has been deleted ${receipt.status}`);
}

async function main() {
    // Deploy solidity smart contract
    const contractId = await deployContract();
    // Store values to contract
    await storeValues(contractId, 5, 6)
    // Delete smart contract
    await deleteContract(contractId);
    process.exit();
}

main();