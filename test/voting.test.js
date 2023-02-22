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
  });

  describe('Registration step', async() => {

    it("Can't add voter if voter registration is not opened", async () => {
      // Change workflow step to another step than default registeringVoters
      await VotingInstance.startProposalsRegistering();
      // try to add a voter
      await expectRevert(VotingInstance.addVoter(_voter1, {from: _owner}), "Voters registration is not open yet");
    });

    it("can't add voter if already registred", async () => {
      await VotingInstance.addVoter(_voter1, {from: _owner});
      // Try to add a second time the same voter
      await expectRevert(VotingInstance.addVoter(_voter1, {from: _owner}), "Already registered");
      // Check if voter has not been added
      await expectRevert(VotingInstance.getVoter.call(_voter1, {from: _owner}), "You're not a voter");
      });

    it("can't add voter if not owner", async () => {
      await expectRevert(VotingInstance.addVoter(_voter1, {from: _voter1}), "caller is not the owner");
      // expect((await VotingInstance.voters.call(_voter1)).isRegistered).to.be.false;
      // Check that _voter1 has not been registred
      await expectRevert(VotingInstance.getVoter.call(_voter1, {from: _voter1}), "You're not a voter");
    });

    it("Can add a voter if owner", async () => {
      await VotingInstance.addVoter(_voter1, {from: _owner});
      // expect((await VotingInstance.voters.call(_voter1)).isRegistered).to.be.true;
      // check that voter is registred
      expect((await VotingInstance.getVoter.call(_voter1, {from: _voter1})).isRegistered).to.be.true;
    });

    it("should emit the event VoterRegistered with the voter registred", async () => {
      const transaction = await VotingInstance.addVoter(_voter1, {from: _owner}); 
      expectEvent(transaction, 'VoterRegistered', {
      voterAddress: _voter1
      });
    });
  });

  describe('Proposal step', async() => {
    context('Stay at registeringVoters step when it should be at startProposalsRegistering', async() =>{
      context('Voter not registred', async() =>{
        it("Can't add a proposal if voter is not registred", async () => {  
          await expectRevert(VotingInstance.addProposal("Ma proposition", {from: _owner}), "You're not a voter");
        });
      });
      context('Voter is registred', async() =>{
        it("Can't add a proposal if workflow not at startProposalsRegistering", async () => { 
          await VotingInstance.addVoter(_voter1, {from: _owner});
          await expectRevert(VotingInstance.addProposal("Ma proposition", {from: _voter1}), "Proposals are not allowed yet");
        });
      });
    });
    context('Changed to startProposalsRegistering, voter registred', async() =>{
      it("Can't add an empty proposal", async () => {
        await VotingInstance.addVoter(_voter1, {from: _owner});
        await VotingInstance.startProposalsRegistering();
        await expectRevert(VotingInstance.addProposal("", {from: _voter1}), "No empty proposal");
      });
      it("Any registred voter can add one or many proposals and see his/her or other's proposals", async () => {
        await VotingInstance.addVoter(_voter1, {from: _owner});
        await VotingInstance.addVoter(_voter2, {from: _owner});
        await VotingInstance.startProposalsRegistering();

        await VotingInstance.addProposal("Ma proposition", {from: _voter1});
        expect((await VotingInstance.getOneProposal.call(1, {from: _voter1})).description).to.have.string("Ma proposition");

        await VotingInstance.addProposal("Ma proposition 2", {from: _voter2});
        expect((await VotingInstance.getOneProposal.call(2, {from: _voter1})).description).to.have.string("Ma proposition 2");
        expect((await VotingInstance.getOneProposal.call(2, {from: _voter2})).description).to.have.string("Ma proposition 2");
        
        await VotingInstance.addProposal("Ma proposition 3", {from: _voter1});
        expect((await VotingInstance.getOneProposal(3, {from: _voter2})).description).to.have.string("Ma proposition 3");
      });
      it("should emit the event ProposalRegistered with the proposal position in array", async () => {
        await VotingInstance.addVoter(_voter1, {from: _owner});
        await VotingInstance.startProposalsRegistering();
        const transaction = await VotingInstance.addProposal("Ma proposition", {from: _voter1});
        expectEvent(transaction, 'ProposalRegistered', {
          proposalId: BN(1)
        });
      });
    });
  });

  describe('Set vote step', async() => {
    context('Stay at endProposalsRegistering step when it should be at VotingSessionStarted', async() =>{
      context('Voter not registred', async() =>{
        it("Can't vote is not registred", async () => {  
          await expectRevert(VotingInstance.setVote(0, {from: _owner}), "You're not a voter");          
        });
      });
      context('Voter is registred', async() =>{
        it("Can't vote if workflow not at startProposalsRegistering", async () => { 
          await VotingInstance.addVoter(_voter1, {from: _owner});
          await VotingInstance.startProposalsRegistering();
          await VotingInstance.addProposal("Ma proposition", {from: _voter1});
          await VotingInstance.endProposalsRegistering();
          // await VotingInstance.setVote(0, {from: _voter1});         

          await expectRevert(VotingInstance.setVote(0, {from: _voter1}), "Voting session havent started yet");
        });
      });
    });
    context('Changed to VotingSessionStarted', async() =>{
      it("Voted proposal does not exist", async () => {
        await VotingInstance.addVoter(_voter1, {from: _owner});
        await VotingInstance.startProposalsRegistering();
        await VotingInstance.addProposal("Ma proposition", {from: _voter1});
        await VotingInstance.endProposalsRegistering();
        await VotingInstance.startVotingSession();
        
        await expectRevert(VotingInstance.setVote(2, {from: _voter1}), "Proposal not found");
      });

      it("Record new vote and record information in voter struct", async () => {
        await VotingInstance.addVoter(_voter1, {from: _owner});
        await VotingInstance.startProposalsRegistering();
        await VotingInstance.addProposal("Ma proposition", {from: _voter1});
        await VotingInstance.endProposalsRegistering();
        await VotingInstance.startVotingSession();        
        await VotingInstance.setVote(1, {from: _voter1});

        expect((await VotingInstance.getVoter.call(_voter1, {from: _voter1})).hasVoted).to.be.true;
        expect((await VotingInstance.getVoter.call(_voter1, {from: _voter1})).votedProposalId).to.be.bignumber.equal(BN(1));
        expect((await VotingInstance.getOneProposal.call(1, {from: _voter1})).voteCount).to.be.bignumber.equal(BN(1));

      });

      it("Can vote for different proposal and have several votes for the same proposal", async () => {
        await VotingInstance.addVoter(_owner, {from: _owner});
        await VotingInstance.addVoter(_voter1, {from: _owner});
        await VotingInstance.addVoter(_voter2, {from: _owner});
        await VotingInstance.startProposalsRegistering();
        await VotingInstance.addProposal("Ma proposition", {from: _owner});
        await VotingInstance.addProposal("Ma proposition 2", {from: _voter1});
        await VotingInstance.endProposalsRegistering();
        await VotingInstance.startVotingSession();        
        await VotingInstance.setVote(1, {from: _owner});
        await VotingInstance.setVote(2, {from: _voter1});
        await VotingInstance.setVote(1, {from: _voter2});

        expect((await VotingInstance.getVoter.call(_owner, {from: _owner})).hasVoted).to.be.true;
        expect((await VotingInstance.getVoter.call(_owner, {from: _owner})).votedProposalId).to.be.bignumber.equal(BN(1));
        expect((await VotingInstance.getVoter.call(_voter1, {from: _voter1})).hasVoted).to.be.true;
        expect((await VotingInstance.getVoter.call(_voter1, {from: _voter1})).votedProposalId).to.be.bignumber.equal(BN(2));
        expect((await VotingInstance.getVoter.call(_voter2, {from: _voter2})).hasVoted).to.be.true;
        expect((await VotingInstance.getVoter.call(_voter2, {from: _voter2})).votedProposalId).to.be.bignumber.equal(BN(1));
        expect((await VotingInstance.getOneProposal.call(1, {from: _voter1})).voteCount).to.be.bignumber.equal(BN(2));
        expect((await VotingInstance.getOneProposal.call(2, {from: _voter1})).voteCount).to.be.bignumber.equal(BN(1));

      });

      it("should emit the event Voted with the voter address and selected proposal id", async () => {
        await VotingInstance.addVoter(_voter1, {from: _owner});
        await VotingInstance.startProposalsRegistering();
        await VotingInstance.addProposal("Ma proposition", {from: _voter1});
        await VotingInstance.endProposalsRegistering();
        await VotingInstance.startVotingSession();
        
        const transaction = await VotingInstance.setVote(1, {from: _voter1});
        expectEvent(transaction, 'Voted', {
          voter: _voter1,
          proposalId: BN(1)
        });
      });
    });
  });
});
