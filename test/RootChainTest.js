const utils = require("ethereumjs-util");
const { latestTime } = require('./helpers/latestTime');
const { increaseTimeTo, duration } = require('./helpers/increaseTime');
const { EVMRevert } = require('./helpers/EVMRevert');


const RootChain = artifacts.require("root_chain.vyper");
const PriorityQueue = artifacts.require("priority_queue.vyper");

const rlp = utils.rlp;
const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();


contract("RootChain", ([owner, priorityQueueAddr]) => {
    const depositAmount = new BigNumber(web3.toWei(0.1, 'ether'));

    const depositAmountNum = 0.1 * 10 ** 18;
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

    beforeEach(async () => {
        this.rootChain = await RootChain.new(priorityQueueAddr, { from: owner });
    });

    describe("submitBlock", () => {
        it("should update block numbers", async () => {

        });
    });

    describe("deposit", () => {
        it("should accespt deposit", async () => {
            const blknum = await this.rootChain.getDepositBlock();
            await this.rootChain.deposit({ value: depositAmount, from: owner });
            const depositBlockNum = await this.rootChain.getDepositBlock();
            depositBlockNum.should.be.bignumber.equal(blknum.plus(new BigNumber(1)));
        })
    });

    describe("startDepositExit", () => {
        it("should be equal utxo_pos and exitable_at ", async () => {
            await this.rootChain.deposit({ depositAmount, from: owner });
            const blknum = await this.rootChain.getDepositBlock();
            await this.rootChain.deposit({ depositAmount, from: owner });

            const expectedUtxoPos = blknum.mul(new BigNumber(1000000000));
            const expectedExitable_at = (await latestTime()) + duration.weeks(2);

            await this.rootChain.startDepositExit(expectedUtxoPos, ZERO_ADDRESS, depositAmountNum);
            const [utxo_pos, exitable_at] = await this.rootChain.getNextExit(ZERO_ADDRESS);

            utxo_pos.should.be.bignumber.equal(expectedUtxoPos);
            exitable_at.should.be.bignumber.equal(expectedExitable_at);
            this.rootChain.getExit(utxo_pos).to.have.ordered.members([owner, ZERO_ADDRESS, depositAmount])

        });

        it("should fails if same deposit is exited twice", async () => {
            await this.rootChain.deposit({ depositAmount, from: owner });
            const blknum = await this.rootChain.getDepositBlock();
            await this.rootChain.deposit({ depositAmount, from: owner });
            const expectedUtxoPos = blknum.mul(new BigNumber(1000000000));

            await this.rootChain.startDepositExit(expectedUtxoPos, ZERO_ADDRESS, depositAmountNum);
            await expectThrow(this.rootChain.startDepositExit(expectedUtxoPos, ZERO_ADDRESS, depositAmountNum), EVMRevert);
        });

        it("should fails if transaction sender is not the depositor", async () => {
            await this.rootChain.deposit({ depositAmount, from: owner });
            const blknum = await this.rootChain.getDepositBlock();
            await this.rootChain.deposit({ depositAmount, from: owner });
            const expectedUtxoPos = blknum.mul(new BigNumber(1000000000));

            await this.rootChain.startDepositExit(expectedUtxoPos, ZERO_ADDRESS, depositAmountNum);
            await expectThrow(this.rootChain.startDepositExit)
        });

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
