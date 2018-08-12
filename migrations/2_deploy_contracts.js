// rename artifacts which truper made to overwrite them in truffle migation
var fs = require("fs");
fs.rename("../build/contracts/root_chain.vyper.json", "../build/contracts/root_chain.json", function (err) {});
var fs = require("fs");
fs.rename("../build/contracts/priority_queue.vyper.json", "../build/contracts/priority_queue.json", function (err) {});
const RootChain = artifacts.require("root_chain");
const PriorityQueue = artifacts.require("priority_queue");

module.exports = (deployer) => {
    deployer.deploy(PriorityQueue)
        .then(() => deployer.deploy(
            RootChain,
            PriorityQueue.address
        ))
}
