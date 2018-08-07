const utils = require("ethereumjs-util");

const RootChain = artifacts.require("root_chain.vyper");
const PriorityQueue = artifacts.require("priority_queue.vyper");

const rlp = utils.rlp;
const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();


contract("RootChain", ([owner, priorityQueueAddr]) => {
    const depositAmount = new web3.BigNumber(web3.toWei(0.1, 'ether'));
    const depositAmountNum = 0.1 * 10 ** 18;
    const ZERO_ADDRESS = 0x0000000000000000000000000000000000000000;

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
            await rootChain.deposit({ value: depositAmount, from: owner });
            const depositBlockNum = await rootChain.getDepositBlock();
            Number(depositBlockNum).should.equal(Number(blknum) + 1);
        })
    });

    describe("startDepositExit", () => {
        it("should be equal ", async () => {
            const two_weeks = 60 * 60 * 24 * 7 * 2;
            await rootChain.deposit({ depositAmount, from: owner });
            const blknum = await rootChain.getDepositBlock();
            await rootChain.deposit({ depositAmount, from: owner });
            const expectedUtxoPos = Number(blknum) * 1000000000;
            const expectedExitable_at = Date.now() + two_weeks;

            await rootChain.startDepositExit(expectedUtxoPos, ZERO_ADDRESS, depositAmountNum);
            const [utxo_pos, exitable_at] = await rootChain.getNextExit(ZERO_ADDRESS);

            utxo_pos.should.equal(expectedUtxoPos);
            exitable_at.should.equal(expectedExitable_at);

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