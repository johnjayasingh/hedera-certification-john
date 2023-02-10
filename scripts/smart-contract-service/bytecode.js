const path = require('path');
const fs = require('fs');
const solc = require('solc');

const contractPath = path.resolve(__dirname, 'contracts', 'CertificationC1.sol');
const source = fs.readFileSync(contractPath, 'utf-8');

const input = {
    language: 'Solidity',
    sources: {
        'CertificationC1.sol': {
            content: source
        }
    },
    settings: {
        outputSelection: {
            '*': {
                '*': ['*']
            }
        }
    }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

const interface = output.contracts['CertificationC1.sol'].CertificationC1.abi;
const bytecode = output.contracts['CertificationC1.sol'].CertificationC1.evm.bytecode.object;

module.exports = {
    interface,
    bytecode,
};
