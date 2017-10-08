pragma solidity ^0.4.17;

contract DeviceContract {

    ///////////////////////////////////////////
    /////////////// VARIABLES /////////////////
    ///////////////////////////////////////////

    int private currentRequestId;
    uint private queueTime; // !
    int private nonce;

    uint256 public weiPerSecond;
    uint public timeout;

    // INSERT USER-DEFINED VARIABLES
    // <USER_CODE>
    struct Request {
        address addr;
        uint time;
        uint256 value;
    }

    mapping(int => Request) public incompleteRequests;
    // </USER_CODE>


    ///////////////////////////////////////////
    /////////////// CONSTANTS /////////////////
    ///////////////////////////////////////////

    // INSERT USER-DEFINED CONSTANTS
    // <USER_CODE>

    // </USER_CODE>


    ///////////////////////////////////////////
    /////////////// EVENTS ////////////////////
    ///////////////////////////////////////////
    
    // INSERT USER-DEFINED EVENTS
    // <USER_CODE>
    event NewRequest(int indexed id);
    // </USER_CODE>


    ///////////////////////////////////////////
    ///////// STATE EXECUTION ENGINE //////////
    ///////////////////////////////////////////

    enum State {
        DeviceFree,
        WaitingForDeviceAck,
        DeviceOccupied,
        Invalid,
        Choice
    }
    
    enum Transition {
        Request,
        Cancel,
        AccessStarted,
        AccessFinished,
        AccessFailed
    }

    // State -> Transition -> State
    mapping(uint => mapping(uint => uint)) public transitions;

    State public currentState;

    function registerTransition(State from, Transition transition, State to) internal {
        transitions[uint(from)][uint(transition)] = uint(to);
    }

    function getNextState(State state, Transition transition) internal view returns (State) {
        return State(transitions[uint(state)][uint(transition)]);
    }

    function clarifyNextState(State state, Transition transition, int arg) internal view returns (State) {
        if (state == State.WaitingForDeviceAck && transition == Transition.Cancel)
        {
            return (arg == currentRequestId) ? State.DeviceFree : State.WaitingForDeviceAck;

        }

        require(false); // should not reach here...
    }

    function initializeExecutionEngine() internal {
        registerTransition(State.DeviceFree, Transition.Request          , State.WaitingForDeviceAck);
        registerTransition(State.DeviceFree, Transition.Cancel           , State.DeviceFree);
        registerTransition(State.DeviceFree, Transition.AccessStarted , State.Invalid);
        registerTransition(State.DeviceFree, Transition.AccessFinished, State.Invalid);
        registerTransition(State.DeviceFree, Transition.AccessFailed  , State.Invalid);

        registerTransition(State.WaitingForDeviceAck, Transition.Request          , State.WaitingForDeviceAck);
        registerTransition(State.WaitingForDeviceAck, Transition.Cancel           , State.Choice);
        registerTransition(State.WaitingForDeviceAck, Transition.AccessStarted , State.DeviceOccupied);
        registerTransition(State.WaitingForDeviceAck, Transition.AccessFinished, State.Invalid);
        registerTransition(State.WaitingForDeviceAck, Transition.AccessFailed  , State.Invalid);

        registerTransition(State.DeviceOccupied, Transition.Request          , State.Invalid);
        registerTransition(State.DeviceOccupied, Transition.Cancel           , State.DeviceOccupied);
        registerTransition(State.DeviceOccupied, Transition.AccessStarted , State.Invalid);
        registerTransition(State.DeviceOccupied, Transition.AccessFinished, State.DeviceFree);
        registerTransition(State.DeviceOccupied, Transition.AccessFailed  , State.DeviceFree);
    }

    function performEntry(State state) internal {
        if (state == State.DeviceFree) {
            currentRequestId = 0;
        }

        else if (state == State.WaitingForDeviceAck) {
            queueTime = now; // !
        }
    }

    function checkGuard(State state, Transition transition, int arg) internal view {
        // TODO: read arg from msg.data?

        if (state == State.WaitingForDeviceAck && transition == Transition.Request) {
            require(now - queueTime > timeout);
        }

        else if (state == State.WaitingForDeviceAck && transition == Transition.AccessStarted) {
            require(currentRequestId == arg); // arg ~ id
        }

        else if (state == State.DeviceOccupied && transition == Transition.Cancel) {
            require(currentRequestId != arg); // arg ~ id
        }

        else if (state == State.DeviceOccupied && transition == Transition.AccessFinished) {
            require(currentRequestId == arg); // arg ~ id
        }

        else if (state == State.DeviceOccupied && transition == Transition.AccessFailed) {
            require(currentRequestId == arg); // arg ~ id
        }
    }

    function performAction(State state, Transition transition, int arg) internal {
        // TODO: read arg from msg.data?

        if (state == State.DeviceFree && transition == Transition.Request) {
            currentRequestId = generateRequestId(nonce);
            nonce = nonce + 1;
            registerRequest();
        }

        else if (state == State.WaitingForDeviceAck && transition == Transition.Request) {
            currentRequestId = generateRequestId(nonce);
            nonce = nonce + 1;
            registerRequest();
        }

        else if (state == State.DeviceFree && transition == Transition.Cancel) {
            withdrawFunds(arg);
        }

        else if (state == State.WaitingForDeviceAck && transition == Transition.Cancel) {
            withdrawFunds(arg);
        }

        else if (state == State.DeviceOccupied && transition == Transition.Cancel) {
            withdrawFunds(arg);
        }

        else if (state == State.DeviceOccupied && transition == Transition.AccessFinished) {
            markRequestAsExecuted(arg);
        }
    }

    function performExit(State state) internal {
        // EMPTY
    }

    modifier transitionNext(Transition transition, int arg) {
        // TODO: read arg from msg.data?

        // 1. retrieve and validate next state
        // 2. check guard conditions
        // 3. perform exit actions of old state
        // 4. perform generated code associated with transition
        // 5. perform user-defined code associated with transition
        // 6. perform entry actions of new state
        // 7. update current state

        State nextState = getNextState(currentState, transition);
        require(nextState != State.Invalid);

        if (nextState == State.Choice)
        {
            nextState = clarifyNextState(currentState, transition, arg);
        }

        checkGuard(currentState, transition, arg);
        performExit(currentState);
        performAction(currentState, transition, arg);
        performCustomTransitionLogic(currentState, transition, arg);

        _; // note: supposed to be empty

        performEntry(nextState);
        currentState = nextState;
    }


    ///////////////////////////////////////////
    /////////////// INIT //////////////////////
    ///////////////////////////////////////////

    function DeviceContract(uint timeoutSeconds, uint256 pricePerSecond) public {
        initializeExecutionEngine();

        nonce = 1;
        timeout = timeoutSeconds;
        weiPerSecond = pricePerSecond;


        // INSERT ADDICTIONAL INIT CODE
        // <USER_CODE>

        // </USER_CODE>
    }


    ///////////////////////////////////////////
    /////////////// OPERATIONS ////////////////
    ///////////////////////////////////////////

    function generateRequestId(int nonce) internal pure returns (int) {
        // INSERT IMPLEMENTATION
        // <USER_CODE>
        return nonce;
        // </USER_CODE>
    }


    ///////////////////////////////////////////
    /////////////// TRANSITIONS ///////////////
    ///////////////////////////////////////////

    function request() external payable transitionNext(Transition.Request, 0) { // !
        // EMPTY
    }

    function cancel(int id) external transitionNext(Transition.Cancel, id) {
        // EMPTY
    }

    function access_started(int id) external transitionNext(Transition.AccessStarted, id) {
        // EMPTY
    }

    function access_finished(int id) external transitionNext(Transition.AccessFinished, id) {
        // EMPTY
    }

    function access_failed(int id) external transitionNext(Transition.AccessFailed, id) {
        // EMPTY
    }

    function performCustomTransitionLogic(State oldState, Transition transition, int arg) internal {
        // INSERT ADDITIONAL USER-DEFINED TRANSITION LOGIC
        // NOTE: EXECUTED AFTER GENERATED GUARDS AND TRANSITION CODE!
        // <USER_CODE>
        
        // </USER_CODE>
    }

    // USER-DEFINED FUNCTIONS
    // <USER_CODE>
    function validateRequest(Request r) internal view {
        require(r.value > 0);
        require(r.value % weiPerSecond == 0);
    }

    function registerRequest() internal {
        var r = Request(msg.sender, now, msg.value);
        validateRequest(r);
        
        incompleteRequests[currentRequestId] = r;

        NewRequest(currentRequestId);
    }

    function withdrawFunds(int id) internal {
        var r = incompleteRequests[id];
        // note: throws on nonexistent entry

        require(r.addr == msg.sender);

        var amount = r.value;
        delete incompleteRequests[id];
        msg.sender.transfer(amount);
    }

    function markRequestAsExecuted(int id) internal {
        delete incompleteRequests[id];
    }

    function getAllowedExecutionTimeSeconds(int id) public view returns (uint) {
        var r = incompleteRequests[id];
        // note: throws on nonexistent entry

        return r.value / weiPerSecond;
    }
    // </USER_CODE>
}
