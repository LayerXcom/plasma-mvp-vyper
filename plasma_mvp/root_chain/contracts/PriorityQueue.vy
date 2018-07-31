owner: address
heapList: uint256[int128]
currentSize: uint256

@public
def __init__():
    self.owner = msg.sender
    self.heapList = [0]
    self.currentSize = 0

