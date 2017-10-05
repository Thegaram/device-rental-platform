var DeviceContract = artifacts.require("./DeviceContract.sol");

contract('DeviceContract', function(accounts) {
  it("should start in idle state", function() {
    return DeviceContract.deployed().then(function(instance) {
      assert.equal(instance.currentState, DeviceContract.State.DeviceFree);
    });
  });
});
