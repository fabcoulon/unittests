const Voting = artifacts.require("./Voting.sol");
const { BN , expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract("Voting", accounts => {
  const _owner = accounts[0];
  const _voter1 = accounts[1];
  const _voter2 = accounts[2];
  const _voter3 = accounts[3];

  let VotingInstance;

  beforeEach(async function(){
    VotingInstance = await Voting.new({from: _owner});
    VotingInstance.workflowStatus = "RegisteringVoters";
  });
  describe('Registration step', async() => {
    it("Can add a voter if owner", async () => {
      await VotingInstance.addVoter(_voter1, {from: _owner});
      // expect((await VotingInstance.voters.call(_voter1)).isRegistered).to.be.true;
      expect((await VotingInstance.getVoter(_voter1, {from: _voter1})).isRegistered).to.be.true;
    });

    it("can't add voter if not owner", async () => {
      await expectRevert(VotingInstance.addVoter(_voter1, {from: _voter1}), "caller is not the owner");
      // expect((await VotingInstance.voters.call(_voter1)).isRegistered).to.be.false;
      await expectRevert(VotingInstance.getVoter(_voter1, {from: _voter1}), "You're not a voter");
    });

    it("can't add voter if already registred", async () => {
      await VotingInstance.addVoter(_voter1, {from: _owner});
      // Try to add a second time the same voter
      await expectRevert(VotingInstance.addVoter(_voter1, {from: _owner}), "Already registered");
      // Check if voter has not been added
      await expectRevert(VotingInstance.getVoter(_voter1, {from: _owner}), "You're not a voter");
      });

    it("Can't add voter if voter registration is not opened", async () => {
      // Change voter step to another step than default registeringVoters
      await VotingInstance.startProposalsRegistering();
      // try to add a voter
      await expectRevert(VotingInstance.addVoter(_voter1, {from: _owner}), "Voters registration is not open yet");
    });

    it("should log VoterRegistered event", async () => {
      const transaction = await VotingInstance.addVoter(_voter1, {from: _owner}); 
      expectEvent(transaction, 'VoterRegistered', {
      voterAddress: _voter1
      });
    });
  });
});
