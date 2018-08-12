var fs = require("fs");
// rename artifacts which truper made to overwrite them in truffle migation
fs.rename("../build/contracts/plasma_mvp/root_chain.vyper.json", "../build/contracts/plasma_mvp/root_chain.json", function (err) {});
fs.rename("../build/contracts/plasma_mvp/priority_queue.vyper.json", "../build/contracts/plasma_mvp/priority_queue.json", function (err) {});
const RootChain = artifacts.require("root_chain");
const PriorityQueue = artifacts.require("priority_queue");

module.exports = (deployer) => {
    deployer.deploy(PriorityQueue)
        .then(() => deployer.deploy(
            RootChain,
            PriorityQueue.address
        ))
}
