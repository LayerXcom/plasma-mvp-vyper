contract PriorityQueue():
    def setup() -> bool: modifying
    def insert(_k: uint256) -> bool: modifying 

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
    self.currentChildBlock = self.CHILD_BLOCK_INTERVAL
    self.currentDepositBlock = 1
    self.currentFeeExit = 1    

    # Be careful, create_with_code_of currently doesn't support executing constructor.
    priorityQueue: address = create_with_code_of(_priorityQueueTemplate)    
    # Force executing as a constructor
    assert PriorityQueue(priorityQueue).setup()
    # ETH_ADDRESS means currently support only ETH.
    self.exitsQueues[self.ETH_ADDRESS] = priorityQueue

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
    self.currentChildBlock += self.CHILD_BLOCK_INTERVAL
    self.currentDepositBlock = 1

    log.BlockSubmitted(_root, block.timestamp) 

# @dev Allows anyone to deposit funds into the Plasma chain.
@public
@payable
def deposit():
    assert self.currentDepositBlock < self.CHILD_BLOCK_INTERVAL
    
    root: bytes32 = sha3(msg.sender, self.ETH_ADDRESS, msg.value)
    depositBlock: uint256 = getDepositBlock()

    self.childChain[depositBlock] = {
        root: root,
        timestamp: block.timestamp
    }
    self.currentDepositBlock += 1

    log.Deposit(msg.sender, depositBlock, self.ETH_ADDRESS, msg.value)

# @dev Starts an exit from a deposit
# @param _depositPos UTXO position of the deposit
# @param _token Token type to deposit
# @param _amount Deposit amount
@public
def startDepositExit(_depositPos: uint256, _token: address, _amount: uint256):
    blknum: uint256 = _depositPos / 1000000000
    # Check that the given UTXO is a deposit
    assert blknum % self.CHILD_BLOCK_INTERVAL != 0

    root: bytes32 = self.childChain[blknum].root
    depositHash: bytes32 = sha3(msg.sender, _token, _amount)
    # Check that the block root of the UTXO position is same as depositHash.
    assert root == depositHash

    self.addExitToQueue(_depositPos, msg.sender, _token, _amount, self.childChain[blknum].timestamp)

# @dev Allows the operator withdraw any allotted fees. Starts an exit to avoid theft.
# @param _token Token to withdraw.
# @param _amount Amount in fees to withdraw.
@public
def startFeeExit(_token: address, _amount: uint256):
    assert msg.sender == self.operator
    self.addExitToQueue(self.currentFeeExit, msg.sender, _token, _amount, block.timestamp)
    self.currentFeeExit += 1
    

# @dev Starts to exit a specified utxo.
@public
def startExit(_utxoPos: uint256, _tyBytes: bytes, _proof: bytes, _sigs: bytes):
    blknum: uint256 = _utxoPos / 1000000000
    txindex: uint256 = (_utxoPos % 1000000000) / 10000
    oindex: uint256 = _utxoPos - blknum * 1000000000 - txindex * 10000

    # TxField: [blkbum1, txindex1, oindex1, blknum2, txindex2, oindex2, cur12, newowner1, amount1, newowner2, amount2, sig1, sig2]
    txList: [13] = RLPList(_txBytes, [uint256, uint256, uint256, uint256, uint256, uint256, address, address, uint256, address, uint256, bytes32, bytes32])
    assert msg.sender == txList[7 + oindex * 2]

    root: bytes32 = self.childChain[blknum].root
    merkleHash: bytes32 = sha3(sha3(_txBytes), slice(_sigs, 0, 130))
    assert 

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
    return self.currentChildBlock - self.CHILD_BLOCK_INTERVAL + self.currentDepositBlock

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

    # Maximum _created_at + 2 weeks or block.timestamp + 1 week
    exitable_at: int128 = max(int128(_created_at) + 2 * 7 * 24 * 60 * 60, int128(block.timestamp) + 1 * 7 * 24 * 60 * 60)
    # "priority" represents priority of　exitable_at over utxo position. 
    priority: uint256 = bitwise_or(shift(uint256(exitable_at), 128), _utxoPos)

    assert _amount > 0
    assert self.exits[_utxoPos].amount == 0

    assert PriorityQueue(self.exitsQueues[self.ETH_ADDRESS]).insert(priority)

    self.exits[_utxoPos] = {
        owner: _exitor,
        token: _token,
        amount: _amount
    }
    log.ExitStarted(msg.sender, _utxoPos, _token, _amount)


#
# Library
#

@private
@constant
def createExitingTx(_exitingTxBytes: bytes, _oindex: uint256):


@private
@constant
def validate(_txHash: bytes32, _rootHash: bytes32, _blknum2: uint256, _sigs: bytes) -> bool:
    assert len(_sigs) % 65 == 0 and len(_sigs) <= 260
    sig1: bytes = slice(_sigs, 0, 65)
    sig2: bytes = slice(_sigs, 65, 65)
    confSig1: bytes = slice(_sigs, 130, 65)
    confirmationHash: bytes32 = sha3(_txHash, _rootHash)

    check1: bool = true
    check2: bool = true

    check1 = self.ecrecoverSig(_txhash, sig1) == self.ecrecoverSig(confirmationHash, confSig1)
    if _blknum2 > 0:
        confSig2: bytes = slice(_sigs, 195, 65)
        check2 = self.ecrecoverSig(_txHash, sig2) == self.ecrecoverSig(confirmationHash, confSig2)

    return check1 and check2


@private
@constant
def ecrecoverSig(_txHash: bytes32, _sig: bytes) -> address:
    assert len(_sig) == 65
    # Perhaps convert() can only convert 'bytes' to 'int128', so in that case here should be fixed.
    r: uint256 = convert(slice(_sig, 0, 32), uint256)
    s: uint256 = convert(slice(_sig, 32, 32), uint256)
    v: uint256 = convert(slice(_sig, 64, 1), uint256)

    return ecrecover(_txHash, v, r, s)
