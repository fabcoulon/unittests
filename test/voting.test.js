const Voting = artifacts.require("./Voting.sol");
const { BN , expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract("Voting", accounts => {
  const _owner = accounts[0];
  const _voter1 = accounts[1];
  const _voter2 = accounts[2];
  const _voterNotRegistred = accounts[3];

  let VotingInstance;

// ::::::::::::: INITIAL TEST ::::::::::::: //

  describe('Initial test', async() => {
      it("Should work all the time", async () => {
      // try to add a voter
      await expect(BN(1)).to.be.bignumber.equal(BN(1));
    });
  });

  // ::::::::::::: GETTERS ::::::::::::: //

  describe('Getters tests', async() => {

    before(async function(){
      VotingInstance = await Voting.new({from: _owner});
    });

    it("Can't add get voter if not owner", async () => {
      await expectRevert(VotingInstance.getVoter.call(_voter1, {from: _voter1}), "You're not a voter");
    });

    it("Can't add get one proposal if not owner", async () => {
      await expectRevert(VotingInstance.getOneProposal(_voter1, {from: _voter1}), "You're not a voter");
    });
  });

  // ::::::::::::: REGISTRATION ::::::::::::: //

  describe('Registration step', async() => {

    beforeEach(async function(){
      VotingInstance = await Voting.new({from: _owner});
    });

    it("Can't add voter if voter registration is not opened", async () => {
      await VotingInstance.startProposalsRegistering();
      await expectRevert(VotingInstance.addVoter(_voter1, {from: _owner}), "Voters registration is not open yet");
    });

    it("can't add voter if already registred", async () => {
      await VotingInstance.addVoter(_voter1, {from: _owner});
      await expectRevert(VotingInstance.addVoter(_voter1, {from: _owner}), "Already registered");
      await expectRevert(VotingInstance.getVoter.call(_voter1, {from: _owner}), "You're not a voter");
      });

    it("can't add voter if not owner", async () => {
      await expectRevert(VotingInstance.addVoter(_voter1, {from: _voter1}), "caller is not the owner");
      await expectRevert(VotingInstance.getVoter.call(_voter1, {from: _voter1}), "You're not a voter");
    });

    it("Can add a voter if owner", async () => {
      await VotingInstance.addVoter(_voter1, {from: _owner});
      expect((await VotingInstance.getVoter.call(_voter1, {from: _voter1})).isRegistered).to.be.true;
    });

    it("should emit the event VoterRegistered with the voter registred", async () => {
      const transaction = await VotingInstance.addVoter(_voter1, {from: _owner}); 
      expectEvent(transaction, 'VoterRegistered', {
      voterAddress: _voter1
      });
    });
  });

  // ::::::::::::: PROPOSAL ::::::::::::: // 

  describe('Proposal step', async() => {

    beforeEach(async function(){
      VotingInstance = await Voting.new({from: _owner});
      await VotingInstance.addVoter(_voter1, {from: _owner});
    });

    it("Can't add a proposal if voter is not registred", async () => {  
      await expectRevert(VotingInstance.addProposal("Ma proposition", {from: _owner}), "You're not a voter");
    });

    it("Can't add a proposal if workflow not at startProposalsRegistering", async () => {    
      await expectRevert(VotingInstance.addProposal("Ma proposition", {from: _voter1}), "Proposals are not allowed yet");
    });

    it("Can't add an empty proposal", async () => {
      await VotingInstance.startProposalsRegistering();
      await expectRevert(VotingInstance.addProposal("", {from: _voter1}), "No empty proposal");
    });

    it("Any registred voter can add one or many proposals and see his/her or other's proposals", async () => {
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
      await VotingInstance.startProposalsRegistering();
      const transaction = await VotingInstance.addProposal("Ma proposition", {from: _voter1});
      expectEvent(transaction, 'ProposalRegistered', {
        proposalId: BN(1)
      });
    });
  });

  // // ::::::::::::: VOTE ::::::::::::: //

  describe('Vote step', async() => {

    beforeEach(async function(){
      VotingInstance = await Voting.new({from: _owner});
      await VotingInstance.addVoter(_voter1, {from: _owner});
    });

    it("Can't vote is not registred", async () => {  
      await expectRevert(VotingInstance.setVote(0, {from: _voterNotRegistred}), "You're not a voter");          
    });

    it("Can't vote if workflow not at startProposalsRegistering", async () => { 

      await VotingInstance.startProposalsRegistering();
      await VotingInstance.addProposal("Ma proposition", {from: _voter1});
      await VotingInstance.endProposalsRegistering();       

      await expectRevert(VotingInstance.setVote(0, {from: _voter1}), "Voting session havent started yet");
    });

    it("Voted proposal does not exist", async () => {
      await VotingInstance.startProposalsRegistering();
      await VotingInstance.addProposal("Ma proposition", {from: _voter1});
      await VotingInstance.endProposalsRegistering();
      await VotingInstance.startVotingSession();
      
      await expectRevert(VotingInstance.setVote(2, {from: _voter1}), "Proposal not found");
    });

    it("Record new vote and record information in voter struct", async () => {
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

  // ::::::::::::: STATE ::::::::::::: //

  describe('startProposalsRegistering state', async() => {

    beforeEach(async function(){
      VotingInstance = await Voting.new({from: _owner});
    });

    it("Can't change workflow to startProposalsRegistering if not owner", async () => {  
      const storedData = VotingInstance.startProposalsRegistering({from: _voter1});
      await expectRevert(storedData, "caller is not the owner");          
    });

    it("Can change workflow to startProposalsRegistering", async () => {  
      await VotingInstance.startProposalsRegistering({from: _owner});
      expect(await VotingInstance.workflowStatus.call()).to.be.bignumber.equal(BN(1));        
    });

    it("Can't change workflow to startProposalsRegistering if step is not RegisteringVoters", async () => {
      await VotingInstance.startProposalsRegistering({from: _owner});
      await VotingInstance.endProposalsRegistering({from: _owner});
      await expectRevert(VotingInstance.startProposalsRegistering({from: _owner}), "Registering proposals cant be started now");
    }); 
    
    it("Check if proposal array has GENESIS", async () => {
      await VotingInstance.addVoter(_voter1, {from: _owner});
      await VotingInstance.startProposalsRegistering({from: _owner});
      expect((await VotingInstance.getOneProposal.call(0, {from: _voter1})).description).to.have.string("GENESIS");
    }); 
    
    it("should emit the event WorkflowStatusChange with the status", async () => {
      const workflowStatus = await VotingInstance.workflowStatus.call();
      const transaction = await VotingInstance.startProposalsRegistering({from: _owner});

      expectEvent(transaction, 'WorkflowStatusChange', {
        previousStatus: BN(workflowStatus),
        newStatus: BN(workflowStatus+1)
      });
    });
  });

  describe('endProposalsRegistering state', async() => {

    beforeEach(async function(){
      VotingInstance = await Voting.new({from: _owner});
    });

    it("Can't change workflow to endProposalsRegistering if not owner", async () => {  
      await VotingInstance.startProposalsRegistering({from: _owner});
      await expectRevert(VotingInstance.endProposalsRegistering({from: _voter1}), "caller is not the owner");          
    });

    it("Can't change workflow to endProposalsRegistering if step is not startProposalsRegistering", async () => {
      await expectRevert(VotingInstance.endProposalsRegistering({from: _owner}), "Registering proposals havent started yet");
    });

    it("Can change workflow to endProposalsRegistering", async () => {  
      await VotingInstance.startProposalsRegistering({from: _owner});
      await VotingInstance.endProposalsRegistering({from: _owner});
      expect(await VotingInstance.workflowStatus.call()).to.be.bignumber.equal(BN(2));        
    });

    it("should emit the event WorkflowStatusChange with the status", async () => {
      await VotingInstance.startProposalsRegistering({from: _owner});
      const workflowStatus = (await VotingInstance.workflowStatus.call());
      const transaction = await VotingInstance.endProposalsRegistering({from: _owner});

      expectEvent(transaction, 'WorkflowStatusChange', {
        previousStatus: BN(workflowStatus),
        newStatus: BN(workflowStatus).add(BN(1))
      });
    });
  });

  describe('startVotingSession state', async() => {

    beforeEach(async function(){
      VotingInstance = await Voting.new({from: _owner});
      await VotingInstance.startProposalsRegistering({from: _owner});
    });

    it("Can't change workflow to startVotingSession if not owner", async () => {  
      await VotingInstance.endProposalsRegistering({from: _owner});
      await expectRevert(VotingInstance.startVotingSession({from: _voter1}), "caller is not the owner");          
    });

    it("Can't change workflow to startVotingSession if step is not endProposalsRegistering", async () => {
      await expectRevert(VotingInstance.startVotingSession({from: _owner}), "Registering proposals phase is not finished");
    });

    it("Can change workflow to startVotingSession", async () => {  
      await VotingInstance.endProposalsRegistering({from: _owner});
      await VotingInstance.startVotingSession({from: _owner});
      expect(await VotingInstance.workflowStatus.call()).to.be.bignumber.equal(BN(3));        
    });

    it("should emit the event WorkflowStatusChange with the status", async () => {
      await VotingInstance.endProposalsRegistering({from: _owner});
      const workflowStatus = (await VotingInstance.workflowStatus.call());
      const transaction = await VotingInstance.startVotingSession({from: _owner});

      expectEvent(transaction, 'WorkflowStatusChange', {
        previousStatus: BN(workflowStatus),
        newStatus: BN(workflowStatus).add(BN(1))
      });
    });
  });

  describe('endVotingSession state', async() => {

    beforeEach(async function(){
      VotingInstance = await Voting.new({from: _owner});
      await VotingInstance.startProposalsRegistering({from: _owner});
      await VotingInstance.endProposalsRegistering({from: _owner});
    });

    it("Can't change workflow to endVotingSession if not owner", async () => {  
      await VotingInstance.startVotingSession({from: _owner});
      await expectRevert(VotingInstance.endVotingSession({from: _voter1}), "caller is not the owner");          
    });

    it("Can't change workflow to endVotingSession if step is not startVotingSession", async () => {
      await expectRevert(VotingInstance.endVotingSession({from: _owner}), "Voting session havent started yet");
    });

    it("Can change workflow to endVotingSession", async () => {  
      await VotingInstance.startVotingSession({from: _owner});
      await VotingInstance.endVotingSession({from: _owner});
      expect(await VotingInstance.workflowStatus.call()).to.be.bignumber.equal(BN(4));        
    });

    it("should emit the event WorkflowStatusChange with the status", async () => {
      await VotingInstance.startVotingSession({from: _owner});
      const workflowStatus = (await VotingInstance.workflowStatus.call());
      const transaction = await VotingInstance.endVotingSession({from: _owner});

      expectEvent(transaction, 'WorkflowStatusChange', {
        previousStatus: BN(workflowStatus),
        newStatus: BN(workflowStatus).add(BN(1))
      });
    });
  });

  describe('tallyVotes state', async() => {

    beforeEach(async function(){
      VotingInstance = await Voting.new({from: _owner});
    });
    
    it("Can't call tallyVotes if not owner", async () => {  
      const storedData = VotingInstance.tallyVotes({from: _voter1});
      await expectRevert(storedData, "caller is not the owner");          
    });

    it("Can't call tallyvotes if workflow not at step endVotingSession", async () => {  
      const storedData = VotingInstance.tallyVotes({from: _owner});
      await expectRevert(storedData, "Current status is not voting session ended");          
    });

    it("Can call tallyVotes with one voter on a single proposal", async () => {
      await VotingInstance.addVoter(_owner, {from: _owner});
      await VotingInstance.startProposalsRegistering({from: _owner});
      await VotingInstance.addProposal("Ma proposition", {from: _owner});
      await VotingInstance.endProposalsRegistering({from: _owner});
      await VotingInstance.startVotingSession({from: _owner});
      await VotingInstance.setVote(1, {from: _owner});
      await VotingInstance.endVotingSession({from: _owner});
      await VotingInstance.tallyVotes({from: _owner});   
      const transaction = await VotingInstance.winningProposalID.call();
      expect(transaction).to.be.bignumber.equal(BN(1));
    });

    it("Should find a winner even if single voter with one proposal", async () => {
      await VotingInstance.addVoter(_owner, {from: _owner});
      await VotingInstance.addVoter(_voter1, {from: _owner});
      await VotingInstance.startProposalsRegistering({from: _owner});
      await VotingInstance.addProposal("Ma proposition", {from: _owner});
      await VotingInstance.addProposal("Ma proposition 2", {from: _voter1});
      await VotingInstance.endProposalsRegistering({from: _owner});
      await VotingInstance.startVotingSession({from: _owner});
      await VotingInstance.setVote(1, {from: _owner});
      await VotingInstance.setVote(1, {from: _voter1});
      await VotingInstance.endVotingSession({from: _owner});
      await VotingInstance.tallyVotes({from: _owner});   
      const transaction = await VotingInstance.winningProposalID.call();
      expect(transaction).to.be.bignumber.equal(BN(1));
    });

    it("Should select the first proposal if two proposals have the same amount of vote", async () => {
      await VotingInstance.addVoter(_owner, {from: _owner});
      await VotingInstance.addVoter(_voter1, {from: _owner});
      await VotingInstance.startProposalsRegistering({from: _owner});
      await VotingInstance.addProposal("Ma proposition", {from: _owner});
      await VotingInstance.addProposal("Ma proposition 2", {from: _voter1});
      await VotingInstance.endProposalsRegistering({from: _owner});
      await VotingInstance.startVotingSession({from: _owner});
      await VotingInstance.setVote(1, {from: _owner});
      await VotingInstance.setVote(2, {from: _voter1});
      await VotingInstance.endVotingSession({from: _owner});
      await VotingInstance.tallyVotes({from: _owner});   
      const transaction = await VotingInstance.winningProposalID.call();
      expect(transaction).to.be.bignumber.equal(BN(1));
    });
    
    it("Should change to VotesTallied if winner", async () => {
      await VotingInstance.addVoter(_owner, {from: _owner});
      await VotingInstance.startProposalsRegistering({from: _owner});
      await VotingInstance.addProposal("Ma proposition", {from: _owner});
      await VotingInstance.endProposalsRegistering({from: _owner});
      await VotingInstance.startVotingSession({from: _owner});
      await VotingInstance.setVote(1, {from: _owner});
      await VotingInstance.endVotingSession({from: _owner});
      await VotingInstance.tallyVotes({from: _owner});   
      expect(await VotingInstance.workflowStatus.call()).to.be.bignumber.equal(BN(5));
    });

    it("should emit the event WorkflowStatusChange from tallyVotes to VotesTallied", async () => {
      await VotingInstance.addVoter(_owner, {from: _owner});
      await VotingInstance.startProposalsRegistering({from: _owner});
      await VotingInstance.addProposal("Ma proposition", {from: _owner});
      await VotingInstance.endProposalsRegistering({from: _owner});
      await VotingInstance.startVotingSession({from: _owner});
      await VotingInstance.setVote(1, {from: _owner});
      await VotingInstance.endVotingSession({from: _owner});
      const transaction = await VotingInstance.tallyVotes({from: _owner});   
      const workflowStatus = (await VotingInstance.workflowStatus.call());

      expectEvent(transaction, 'WorkflowStatusChange', {
        previousStatus: BN(workflowStatus).sub(BN(1)),
        newStatus: BN(workflowStatus)
      });
    });
  });
});
