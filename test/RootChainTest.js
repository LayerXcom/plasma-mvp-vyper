

const RootChain = artifacts.require("root_chain.vyper");
const PriorityQueue = artifacts.require("priority_queue.vyper");
const RLP = require("rlp");
const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();


contract("RootChain", ([owner, priorityQueueAddr]) => {
    const depositAmount = new web3.BigNumber(web3.toWei(0.1, 'ether'));

    beforeEach(async () => {
        rootChain = await RootChain.new(priorityQueueAddr, { from: owner });
    });

    describe("submitBlock", () => {
        it("should update block numbers", async () => {

        });
    });

    describe("deposit", () => {
        it("should accespt deposit", async () => {
            const blknum = await rootChain.getDepositBlock();
            await rootChain.deposit({ depositAmount, from: owner });
            const depositBlockNum = await rootChain.getDepositBlock();
            Number(depositBlockNum).should.equal(Number(blknum) + 1);
        })
    });

    describe("startDepositExit", () => {
        it("should be equal ", async () => {
            await rootChain.deposit({ depositAmount, from: owner });
            const blknum = await rootChain.getDepositBlock();
            await rootChain.deposit({ depositAmount, from: owner });
            const expectedUtxoPos = blknum * 1000000000;

            const expectedExitable_at =
                await rootChain.startDepositExit()
        })
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