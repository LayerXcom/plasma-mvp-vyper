Deposit: event({_depositor: indexed(address), _depositBlock: indexed(uint256), _token: address, _amount: uint256})
ExitStarted: event({_exitor: indexed(address), _utxoPos: indexed(uint256), _token: address, _amount: uint256})
BlockSubmitted: event({_root: bytes32, _timestamp: timestamp})
TokenAdded: event({_token: address})


# @dev Constructor
def __init__():


#
# Public Functions
#

# @dev Allows Plasma chain operator to submit block root.
def submitBlock():

# @dev Allows anyone to deposit funds into the Plasma chain.
def deposit():

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
