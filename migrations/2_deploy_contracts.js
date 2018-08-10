const RootChain = artifacts.require("./plasma_mvp/root_chain.vyper");
const PriorityQueue = artifacts.require("./plasma_mvp/priority_queue.vyper");

module.exports = (deployer) => {
    deployer.deploy(PriorityQueue)
        .then(() => deployer.deploy(
            RootChain,
            PriorityQueue.address
        ))
}
