const utils = require("ethereumjs-util");
const { latestTime } = require('./helpers/latestTime');
const { increaseTimeTo, duration } = require('./helpers/increaseTime');
const { EVMRevert } = require('./helpers/EVMRevert');
const { expectThrow } = require('./helpers/expectThrow');
const FixedMerkleTree = require('./helpers/fixedMerkleTree');
const Transaction = require('./helpers/transaction');
const { keys } = require('./helpers/keys');

const RootChain = artifacts.require("root_chain.vyper");
const PriorityQueue = artifacts.require("priority_queue.vyper");

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
    const ZERO_ADDRESS = utils.bufferToHex(utils.zeros(20));

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
        it("", async () => {
            const tx1 = new Transaction(0, 0, 0, 0, 0, 0, ZERO_ADDRESS, owner, depositAmount, ZERO_ADDRESS, 0)
            // const txBytes1 = rlp.encode([0, 0, 0, 0, 0, 0, ZERO_ADDRESS, owner, depositAmount, ZERO_ADDRESS, 0]);
            const depositTxHash = utils.sha3(owner + ZERO_ADDRESS + depositAmount);
            const depositBlkNum = await rootChain.getDepositBlock();
            depositBlkNum.should.be.equal(num1);

            await rootChain.deposit({ value: depositAmount, from: owner });
            const merkle = new FixedMerkleTree(16, [depositTxHash]);
            const proof = utils.bufferToHex(Buffer.concat(merkle.getplasmaProof(depositTxHash)));
            const confirmationSig1 = confirmTx(tx1, (await rootChain.getChildChain(depositBlkNum)[0]), )
        })
    });

    describe("challengeExit", () => {

    });

    describe("finalizeExits", () => {

    });
});
