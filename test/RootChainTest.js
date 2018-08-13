const utils = require("ethereumjs-util");
const { latestTime } = require('./helpers/latestTime');
const { increaseTimeTo, duration } = require('./helpers/increaseTime');
const { EVMRevert } = require('./helpers/EVMRevert');
const { expectThrow } = require('./helpers/expectThrow');


const RootChain = artifacts.require("root_chain");
const PriorityQueue = artifacts.require("priority_queue");

const rlp = utils.rlp;
const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();


contract("RootChain", ([owner, nonOwner, priorityQueueAddr]) => {
    const depositAmount = new BigNumber(web3.toWei(0.1, 'ether'));
    const utxoOrder = new BigNumber(1000000000);

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
        beforeEach(async () => {
            await this.rootChain.deposit({ depositAmount, from: owner });
            this.blknum = await this.rootChain.getDepositBlock();
            await this.rootChain.deposit({ depositAmount, from: owner });
            this.expectedUtxoPos = this.blknum.mul(utxoOrder);
        })

        it("should be equal utxo_pos and exitable_at ", async () => {
            const expectedExitable_at = (await latestTime()) + duration.weeks(2);

            await this.rootChain.startDepositExit(this.expectedUtxoPos, ZERO_ADDRESS, depositAmountNum);
            const [utxo_pos, exitable_at] = await this.rootChain.getNextExit(ZERO_ADDRESS);

            utxo_pos.should.be.bignumber.equal(this.expectedUtxoPos);
            exitable_at.should.be.bignumber.equal(expectedExitable_at);
            this.rootChain.getExit(utxo_pos).to.have.ordered.members([owner, ZERO_ADDRESS, depositAmount])

        });

        it("should fail if same deposit is exited twice", async () => {
            await this.rootChain.startDepositExit(this.expectedUtxoPos, ZERO_ADDRESS, depositAmountNum);
            await expectThrow(this.rootChain.startDepositExit(this.expectedUtxoPos, ZERO_ADDRESS, depositAmountNum), EVMRevert);
        });

        it("should fail if transaction sender is not the depositor", async () => {
            await expectThrow(this.rootChain.startDepositExit(this.expectedUtxoPos, ZERO_ADDRESS, depositAmountNum, { from: nonOwner }), EVMRevert);
        });

        it("should fail if utxo_pos is worng", async () => {
            await expectThrow(this.rootChain.startDepositExit(this.expectedUtxoPos * 2, ZERO_ADDRESS, depositAmountNum), EVMRevert);
        });

        it("should fail if value given is not equal to deposited value", async () => {
            await expectThrow(this.rootChain.startDepositExit(this.expectedUtxoPos, ZERO_ADDRESS, depositAmountNum + 1), EVMRevert);
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
