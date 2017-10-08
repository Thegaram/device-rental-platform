var ConvertLib = artifacts.require("./ConvertLib.sol");
var MetaCoin = artifacts.require("./MetaCoin.sol");
var DeviceContract = artifacts.require("./DeviceContract.sol");

module.exports = function(deployer) {
  deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, MetaCoin);
  deployer.deploy(MetaCoin);

  deployer.deploy(DeviceContract, 10, 1000, '0xffcf8fdee72ac11b5c542428b35eef5769c409f0');
};
