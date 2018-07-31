owner: address
heapList: uint256[int128]
currentSize: uint256

@public
def __init__():
    self.owner = msg.sender
    self.heapList = [0]
    self.currentSize = 0

@public
def insert(_k: uint256):
    assert msg.sender == self.owner
    self.heapList[int128(self.currentSize)] = _k
    self.currentSize += 1
    self.percUp(self.currentSize)

@public
@constant
def minChild(_i: uint256) -> uint256:
    if i * 2 + 1 > self.currentSize:
        return i * 2
    else:
        if self.heapList[_i * 2] < self.heapList[i * 2 + 1]:
            return i * 2
        else:
            return i * 2 + 1

@public
@constant
def getMin() -> uint256:
    return self.heapList[1]

@public
def delMin() -> uint256:
    assert msg.sender == self.owner
    retVal: uint256 = self.heapList[1]
    self.heapList[1] = self.heapList[int128(self.currentSize)]
    self.heapList[int128(self.currentSize)] = 0

    self.currentSize -= 1
    self.percDown(1)
    
    return retVal