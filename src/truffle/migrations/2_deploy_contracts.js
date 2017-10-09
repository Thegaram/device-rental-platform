var ConvertLib = artifacts.require("./ConvertLib.sol");
var MetaCoin = artifacts.require("./MetaCoin.sol");
var DeviceContract = artifacts.require("./DeviceContract.sol");

module.exports = function(deployer) {
  deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, MetaCoin);
  deployer.deploy(MetaCoin);

  deployer.deploy(DeviceContract, 10, 1000, '0x725e67c6eb9e8deff544525cb1be48a920b652b3');
};
