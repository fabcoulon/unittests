[![codecov](https://codecov.io/gh/fabcoulon/unittests/branch/main/graph/badge.svg?token=MFHIKCXHO5)](https://codecov.io/gh/fabcoulon/unittests)


### General Info
***
This is a unit test project based on a basic voting system. Tests are organized by function.
Each function has its own describe. Within it the function is tested as follow:
- Test modifiers
- Test requires
- Test operations
- Test event emit

## Table of Contents
1. [General Info](#general-info)
2. [Technologies](#technologies)
3. [Test Functions organisation](#test-function-organisation)
4. [Installation](#installation)
5. [Code coverage](#code-coverage)

## Technologies
***
A list of technologies and libraries used within the project:
- [Truffle](https://github.com/trufflesuite): compile and run the smart contracts on a local development network
- [Solidity](https://docs.soliditylang.org/en/v0.8.19/): object-oriented, high-level language for implementing  smart contracts
- [ganache](https://github.com/trufflesuite/ganache): A tool for creating a local blockchain for fast Ethereum development
- [Open zeppelin test helpers](https://www.npmjs.com/package/@openzeppelin/test-helpers) Assertion library for Ethereum smart contract testing
- [chai](https://github.com/chaijs): Assertion library

## Test Functions organisation
***
This the tree structure organisation of the unit test voting.test.js:

```
describe
└───functionality
│   │   
Initial test
│   │
└───Should work all the time
│   │ 
Getters tests
│   │
└───Can't add get voter if not owner
└───Can't add get one proposal if not owner
│   │ 
Registration step
│   │
└───Can't add voter if voter registration is not opened
└───Can't add voter if already registred
└───Can't add voter if not owner
└───Can add a voter if owner
└───Should emit the event VoterRegistered with the voter registred
│   │ 
Proposal step
│   │
└───Can't add a proposal if voter is not registred
└───Can't add a proposal if workflow not at startProposalsRegistering
└───Can't add an empty proposal
└───Any registred voter can add one or many proposals and see his/her or other's proposals
└───Should emit the event ProposalRegistered with the proposal position in array
│   │ 
Vote step
│   │
└───Can't vote is not registred
└───Can't vote if workflow not at startProposalsRegistering
└───Can't vote if already voted
└───Voted proposal does not exist
└───Record new vote and record information in voter struct
└───Can vote for different proposal and have several votes for the same proposal
└───Should emit the event Voted with the voter address and selected proposal id
│   │ 
startProposalsRegistering state
│   │
└───Can't change workflow to startProposalsRegistering if not owner
└───Can change workflow to startProposalsRegistering
└───Can't change workflow to startProposalsRegistering if step is not RegisteringVoters
└───Check if proposal array has GENESIS
└───Should emit the event WorkflowStatusChange with the status
│   │ 
endProposalsRegistering state
│   │
└───Can't change workflow to endProposalsRegistering if not owner
└───Can't change workflow to endProposalsRegistering if not startProposalsRegistering
└───Can change workflow to endProposalsRegistering
└───Should emit the event WorkflowStatusChange with the status
│   │ 
startVotingSession state
│   │
└───Can't change workflow to startVotingSession if not owner
└───Can't change workflow to startVotingSession if step is not endProposalsRegistering
└───Can change workflow to startVotingSession
└───Should emit the event WorkflowStatusChange with the status
│   │ 
endVotingSession state
│   │
└───Can't change workflow to endVotingSession if not owner
└───Can't change workflow to endVotingSession if step is not startVotingSession
└───Can change workflow to endVotingSession
└───Should emit the event WorkflowStatusChange with the status
│   │ 
tallyVotes state
│   │
└───Can't call tallyVotes if not owner
└───Can't call tallyvotes if workflow not at step endVotingSession
└───Can call tallyVotes with one voter on a single proposal
└───Should find a winner even if single voter with one proposal
└───Should select the first proposal if two proposals have the same amount of vote
└───Should change to VotesTallied if winner
└───Should emit the event WorkflowStatusChange from tallyVotes to VotesTallied
│   │ 
```

## Installation
***
To run the unit tests, please follow the instructions below. 
```
$ git clone https://github.com/fabcoulon/unittests.git
$ cd ../path/to/the/file
$ npm install -g ganache 
$ npm install -g truffle
$ npm install @truffle/hdwallet-provider  
$ npm install @openzeppelin/test-helpers
$ npm install @openzeppelin/contracts
$ npm install chai
On one bash lanch a local blockchain
$ ganache
On another bash
$ truffle test
```

## Code coverage
***
Table from hardhat coverage

File         |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-------------|----------|----------|----------|----------|----------------|
 contracts/  |      100 |      100 |      100 |      100 |                |
  Voting.sol |      100 |      100 |      100 |      100 |                |
-------------|----------|----------|----------|----------|----------------|
All files    |      100 |      100 |      100 |      100 |                |
-------------|----------|----------|----------|----------|----------------|