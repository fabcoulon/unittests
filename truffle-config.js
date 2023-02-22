// On créé un objet qui vient récupérer toutes les méthodes dans @truffle/hdwallet-provider

module.exports = {
  networks: {
    development: {
     host: "127.0.0.1",     // Localhost (default: none)
     port: 8545,            // Standard Ethereum port (default: none)
     network_id: "*",       // Any network (default: none)
    },
  },

  mocha: {
    // reporter: 'eth-gas-reporter',
    // reporterOptions : { 
    //   gasPrice:1,
    //   token:'ETH',
    //   showTimeSpent: true,
    // }
  },

  compilers: {
    solc: {
    version: "0.8.18",    // Fetch exact version from solc-bin (default: truffle's version)
      settings: {         // See the solidity docs for advice about optimization and evmVersion
       optimizer: {       // Number of compilation tours
         enabled: false,
         runs: 200
       },
      }
    }
  },
};
