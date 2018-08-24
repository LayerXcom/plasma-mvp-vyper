const RootChain = artifacts.require("root_chain");
const PriorityQueue = artifacts.require("priority_queue");

module.exports = (deployer) => {
    deployer.deploy(PriorityQueue)
        .then(() => deployer.deploy(
            RootChain,
            PriorityQueue.address
        ))
}
