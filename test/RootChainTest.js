

const RootChain = artifacts.require("root_chain.vyper")
const RLP = requre("rlp");
const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();


contract("RootChain", ([owner, priorityQueueAddr]) => {
    const depositAMount = new web3.BigNumber(web3.toWei(0.001, 'ether'));

    beforeEach(async () => {
        rootChain = await RootChain.new(priorityQueueAddr, { from: owner });
    });

    describe("submitBlock", () => {
        it("should update block numbers", async () => {

        });
    });

    describe("deposit", () => {
        it("should accespt deposit", async () => {
            await rootChain.deposit({ depositAmount, from: owner });

        })
    });

    describe("startDepositExit", () => {

    });

    describe("startFeeExit", () => {

    });

    describe("startExit", () => {

    });

    describe("challengeExit", () => {

    });

    describe("finalizeExits", () => {

    });
});