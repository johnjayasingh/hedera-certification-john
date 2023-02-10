# Hedera Certification - John Jayasingh

Follow the below steps to setup the codebase 

1. Clone the repo `git clone https://github.com/johnjayasingh/hedera-mock.git`
2. Run `npm install` to install the dependency

## Task: 4 - Consensus Service
Create a script to create a consensus transaction on the Hedera
Consensus Service using Account1. Write the current time in the
message of the transaction and submit.

### Steps
1. To run atomic swap `npm run task:consensus`
2. After running there will a new topic created
3. After which the subscription to topic starts
4. As soon a message is sent to the topic it is listened and printed in output

### Output
![swap output](./scripts//consensus-service/output.png)

---
