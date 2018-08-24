owner: address
heapList: uint256[uint256]
currentSize: uint256

# Temporary solution for constructor, 
# look at https://github.com/ethereum/vyper/issues/773#issuecomment-383714363
@public
def setup() -> bool:
    assert self.owner == ZERO_ADDRESS
    self.owner = msg.sender
    assert self.owner != ZERO_ADDRESS
    return True

@private
def percUp(_i: uint256):
    i: uint256 = _i
    newVal: uint256 = self.heapList[_i]
    for _ in range(29): # max size of priority queue is 2^30 - 1
        parent: uint256 = i / 2
        if not newVal < self.heapList[parent]:
            break
        self.heapList[i] = self.heapList[parent]
        i = parent

    if i != _i:
        self.heapList[i] = newVal

@public
@constant
def minChild(_i: uint256) -> uint256:
    if _i * 2 + 1 > self.currentSize:
        return _i * 2
    else:
        if self.heapList[_i * 2] < self.heapList[_i * 2 + 1]:
            return _i * 2
        else:
            return _i * 2 + 1

@private
def percDown(_i: uint256):
    i: uint256 = _i
    newVal: uint256 = self.heapList[_i]
    mc: uint256 = self.minChild(_i)
    for _ in range(29): # max size of priority queue is 2^30 - 1
        if not (mc <= self.currentSize and newVal > self.heapList[mc]):
            break
        self.heapList[i] = self.heapList[mc]
        i = mc
        mc = self.minChild(i)

    if i != _i:
        self.heapList[i] = newVal

@public
def insert(_k: uint256) -> bool:
    assert msg.sender == self.owner
    assert self.currentSize < 2 ** 30 # max size of priority queue is 2^30 - 1
    self.currentSize += 1
    self.heapList[self.currentSize] = _k
    self.percUp(self.currentSize)
    return True


@public
@constant
def getMin() -> uint256:
    return self.heapList[1]

@public
def delMin() -> uint256:
    assert msg.sender == self.owner
    retVal: uint256 = self.heapList[1]
    self.heapList[1] = self.heapList[self.currentSize]
    self.heapList[self.currentSize] = 0
    self.currentSize -= 1
    self.percDown(1)
    return retVal

@public
@constant
def getCurrentSize() -> uint256:
    return self.currentSize
