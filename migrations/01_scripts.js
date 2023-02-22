// Import du smart contract "Voting"
const Voting = artifacts.require("Voting");
// Creation of object deployer that let us use truffle methods
module.exports = (deployer) => {
 // Deployer le smart contract!
 deployer.deploy(Voting);
}