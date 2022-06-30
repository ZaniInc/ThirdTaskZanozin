require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-truffle5");

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = {
  // networks:{
  //   ganache : {
  //     url: "http://127.0.0.1:8545",
  //   }
  // },
  solidity: "0.8.7",
};
