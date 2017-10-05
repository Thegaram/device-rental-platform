pragma solidity ^0.4.17;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/DeviceContract.sol";

contract TestDeviceContract {

  function testInitialStateIsIdle() {
    DeviceContract meta = DeviceContract(DeployedAddresses.DeviceContract());

    uint expected = uint(DeviceContract.State.DeviceFree);

    Assert.equal(uint(meta.currentState()), expected, "Contract should be in state DeviceFree initially");
  }
}