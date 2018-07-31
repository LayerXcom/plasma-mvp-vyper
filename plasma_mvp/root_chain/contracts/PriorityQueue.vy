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
    self.heapList.push(_k)  # ?
    self.currentSize += 1
    self.percUp(self.currentSize)

