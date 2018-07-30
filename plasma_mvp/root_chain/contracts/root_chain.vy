Deposit: event({_depositor: indexed(address), _depositBlock: indexed(uint256), _token: address, _amount: uint256})
ExitStarted: event({_exitor: indexed(address), _utxoPos: indexed(uint256), _token: address, _amount: uint256})
BlockSubmitted: event({_root: bytes32, _timestamp: timestamp})
TokenAdded: event({_token: address})

exits: {
    owner: address,
    token: address,
    amount: uint256
}[uint256]

childChain: {
    root: bytes32,
    timestamp: timestamp
}[uint256]

exitsQueues: address[address]

# TODO: how to set default value? maybe correct.
CHILD_BLOCK_INTERVAL: uint256 = 1000

operator: address
currentChildBlock: uint256
currentDepositBlock: uint256
currentFeeExit: uint256

# specify priorityQueue contract address
priorityQueue: address

# @dev Constructor
@public
def __init__(_priorityQueue: address):
    self.operator = msg.sender
    self.currentChildBlock = CHILD_BLOCK_INTERVAL
    self.currentDepositBlock = 1
    self.currentFeeExit = 1

    # TODO: how to create new contract inline, specifying deployed contract address now.
    # ZERO_ADDRESS means currently support only ETH.
    # Be careful, create_with_code_of doesn't support executing constructor.
    self.exitsQueues[ZERO_ADDRESS] = create_with_code_of(_priorityQueue)


#
# Public Functions
#

# @dev Allows Plasma chain operator to submit block root.
# @params _root The root of a child chain block.
@public
def submitBlock(_root: bytes32):
    # Only operator can execute.
    assert msg.sender == self.operator
    self.childChain[currentChildBlock] = {
        root: _root,
        timestamp: block.timestamp
    }

    # Update block numbers.
    self.currentChildBlock += CHILD_BLOCK_INTERVAL
    self.currentDepositBlock = 1

    log.BlockSubmitted(_root, block.timestamp) 

# @dev Allows anyone to deposit funds into the Plasma chain.
@public
@payable
def deposit():
    assert self.currentDepositBlock < CHILD_BLOCK_INTERVAL
    
    root: bytes32 = sha3(msg.sender, ZERO_ADDRESS, msg.value)
    depositBlock: uint256 = getDepositBlock()

    self.childChain[depositBlock] = {
        root: root,
        timestamp: block.timestamp
    }
    self.currentDepositBlock += 1

    log.Deposit(msg.sender, depositBlock, ZERO_ADDRESS, msg.value)

# @dev Starts an exit from a deposit
def startDepositExit():

# dev Allows the operator withdraw any allotted fees. Starts an exit to avoid theft.
def startFeeExit():

# @dev Starts to exit a specified utxo.
def startExit():

# @dev Allows anyone to challenge an exiting transaction by submitting proof of a double spend on the child chain.
def challengeExit():

# @dev Processes any exits that have completed the challenge period.
def finalizeExits():


#
# Public view functions
#

# @dev Queries the child chain.
def getChildChain():

# @dev Determines the next deposit block number.
def getDepositBlock():

# @dev Returns information about an exit.
def getExit():

# @dev Determines the next exit to be processed.
def getNextExit():


#
# Private functions
#

# @dev Adds an exit to the exit queue.
def addExitToQueue():
