contract PriorityQueue():
    def setup() -> bool: modifying

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
ETH_ADDRESS: address = ZERO_ADDRESS

operator: address
currentChildBlock: uint256
currentDepositBlock: uint256
currentFeeExit: uint256


# @dev Constructor
@public
def __init__(_priorityQueueTemplate: address):
    assert _priorityQueueTemplate != ZERO_ADDRESS
    self.operator = msg.sender
    self.currentChildBlock = CHILD_BLOCK_INTERVAL
    self.currentDepositBlock = 1
    self.currentFeeExit = 1    

    # Be careful, create_with_code_of currently doesn't support executing constructor.
    priorityQueue: address = create_with_code_of(_priorityQueueTemplate)    
    # Force executing as a constructor
    assert PriorityQueue(priorityQueue).setup()
    # ETH_ADDRESS means currently support only ETH.
    self.exitsQueues[ETH_ADDRESS] = priorityQueue

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
    
    root: bytes32 = sha3(msg.sender, ETH_ADDRESS, msg.value)
    depositBlock: uint256 = getDepositBlock()

    self.childChain[depositBlock] = {
        root: root,
        timestamp: block.timestamp
    }
    self.currentDepositBlock += 1

    log.Deposit(msg.sender, depositBlock, ETH_ADDRESS, msg.value)

# @dev Starts an exit from a deposit
# @param _depositPos UTXO position of the deposit
# @param _token Token type to deposit
# @param _amount Deposit amount
@public
def startDepositExit(_depositPos: uint256, _token: address, _amount: uint256):
    blknum: uint256 = _depositPos / 1000000000
    # Check that the given UTXO is a deposit
    assert blknum % CHILD_BLOCK_INTERVAL != 0

    root: bytes32 = self.childChain[blknum].root
    depositHash: bytes32 = sha3(msg.sender, _token, _amount)
    # Check that the block root of the UTXO position is same as depositHash.
    assert root == depositHash

    addExitToQueue(_depositPos, msg.sender, _token, _amount, self.childChain[blknum].timestamp)

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
# @return Block number to be given to the next deposit block.
@public
@constant
def getDepositBlock() -> uint256:
    return self.currentChildBlock - CHILD_BLOCK_INTERVAL + self.currentDepositBlock

# @dev Returns information about an exit.
def getExit():

# @dev Determines the next exit to be processed.
def getNextExit():


#
# Private functions
#

# @dev Adds an exit to the exit queue.
@private
def addExitToQueue(_utxoPos: uint256, _exitor: address, _token: address, _amount: uint256, _created_at: uint256):
    assert self.exitsQueues[_token] != ZERO_ADDRESS

    exitable_at: uint256 = max(int128())

    assert _amount > 0
    assert self.exits[_utxoPos].amount == 0

    queue: address = 