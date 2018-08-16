const utils = require("ethereumjs-util");
const { latestTime } = require('./helpers/latestTime');
const { increaseTime, duration } = require('./helpers/increaseTime');
const { EVMRevert } = require('./helpers/EVMRevert');
const { expectThrow } = require('./helpers/expectThrow');
const FixedMerkleTree = require('./helpers/fixedMerkleTree');
const Transaction = require('./helpers/transaction');
const { keys } = require('./helpers/keys');

const RootChain = artifacts.require("root_chain");
const PriorityQueue = artifacts.require("priority_queue");

const rlp = utils.rlp;
const BigNumber = web3.BigNumber;
const BN = utils.BN;

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();


contract("RootChain", ([owner, nonOwner, priorityQueueAddr]) => {
    let rootChain;
    const depositAmount = new BigNumber(web3.toWei(0.01, 'ether'));
    const depositAmountBN = new BN(web3.toWei(0.01, 'ether'));
    const depositAmountNum = Number(depositAmount);
    const utxoOrder = new BigNumber(1000000000);
    const num1 = new BigNumber(1);
    const num2 = new BigNumber(2);

    const owenerKey = keys[0];
    const nonOwnerKey = keys[1];
    const ZERO_ADDRESS = utils.bufferToHex(utils.zeros(20));

    beforeEach(async () => {
        priorityQueue = await PriorityQueue.new();
        rootChain = await RootChain.new(priorityQueue.address, { from: owner });
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
            depositBlockNum.should.be.bignumber.equal(blknum.plus(num1));
        })
    });

    describe("startDepositExit", () => {
        beforeEach(async () => {
            await rootChain.deposit({ value: depositAmount, from: owner });
            this.blknum = await rootChain.getDepositBlock();
            await rootChain.deposit({ value: depositAmount, from: owner });
            this.expectedUtxoPos = this.blknum.mul(utxoOrder);
        })

        it("should be equal utxoPos and exitableAt ", async () => {
            const expectedExitableAt = (await latestTime()) + duration.weeks(2);

            await rootChain.startDepositExit(this.expectedUtxoPos, ZERO_ADDRESS, depositAmountNum);
            const [utxoPos, exitableAt] = await rootChain.getNextExit(ZERO_ADDRESS);

            exitableAt.should.be.bignumber.equal(expectedExitableAt);
            utxoPos.should.be.bignumber.equal(this.expectedUtxoPos);

            const [expectedOwner, token, amount] = await rootChain.getExit(utxoPos);
            expectedOwner.should.equal = owner;
            token.should.equal = ZERO_ADDRESS;
            amount.should.equal = depositAmount;
        });

        it("should fail if same deposit is exited twice", async () => {
            await rootChain.startDepositExit(this.expectedUtxoPos, ZERO_ADDRESS, depositAmountNum);
            await expectThrow(
                rootChain.startDepositExit(this.expectedUtxoPos, ZERO_ADDRESS, depositAmountNum),
                EVMRevert
            );
        });

        it("should fail if transaction sender is not the depositor", async () => {
            await expectThrow(
                rootChain.startDepositExit(this.expectedUtxoPos, ZERO_ADDRESS, depositAmountNum, { from: nonOwner }),
                EVMRevert
            );
        });

        it("should fail if utxoPos is worng", async () => {
            await expectThrow(
                rootChain.startDepositExit(this.expectedUtxoPos * 2, ZERO_ADDRESS, depositAmountNum),
                EVMRevert
            );
        });

        it("should fail if value given is not equal to deposited value (mul 2)", async () => {
            await expectThrow(
                rootChain.startDepositExit(this.expectedUtxoPos, ZERO_ADDRESS, depositAmountNum * 2),
                EVMRevert
            );
        });
    });

    describe("startFeeExit", () => {
        it("feePriority should be larger than depositPriority", async () => {
            let utxoPos, exitableAt;

            const blknum = await rootChain.getDepositBlock();
            await rootChain.deposit({ value: depositAmount, from: owner });

            const expectedUtxoAt = await rootChain.getCurrentFeeExit();
            const expectedExitableAt = (await latestTime()) + duration.weeks(2) + 1;

            (await rootChain.getCurrentFeeExit()).should.be.bignumber.equal(num1);
            await rootChain.startFeeExit(ZERO_ADDRESS, 1);
            (await rootChain.getCurrentFeeExit()).should.be.bignumber.equal(num2);

            [utxoPos, exitableAt] = await rootChain.getNextExit(ZERO_ADDRESS);
            const feePriority = exitableAt << 128 | utxoPos;

            utxoPos.should.be.bignumber.equal(expectedUtxoAt);
            exitableAt.should.be.bignumber.equal(expectedExitableAt);

            const expectedUtxoPos = blknum.mul(utxoOrder).plus(num1);
            await rootChain.startDepositExit(expectedUtxoPos, ZERO_ADDRESS, depositAmount);

            [utxoPos, exitableAt] = await rootChain.getNextExit(ZERO_ADDRESS);
            const depositPriotiy = exitableAt << 128 | utxoPos;
            feePriority.should.to.be.above(depositPriotiy);
        });

        it("should fail if transaction sender isn't the authority", async () => {
            await rootChain.deposit({ value: depositAmount, from: owner });
            await expectThrow(rootChain.startFeeExit(ZERO_ADDRESS, 1, { from: nonOwner }), EVMRevert);
        });
    });

    describe("startExit", () => {
        let expectedOwner, tokenAddr, expectedAmount;

        it("cannot exit twice off of the same utxo", async () => {
            const tx1 = new Transaction([
                Buffer.from([]), // blkbum1
                Buffer.from([]), // txindex1
                Buffer.from([]), // oindex1

                Buffer.from([]), // blknum2
                Buffer.from([]), // txindex2
                Buffer.from([]), // oindex2

                utils.zeros(20), // token address

                utils.toBuffer(owner), // newowner1
                depositAmountBN.toArrayLike(Buffer, 'be', 32), // amount1

                utils.zeros(20), // newowner2
                Buffer.from([]) // amount2           
            ]);

            const depositTxHash = utils.sha3(owner + ZERO_ADDRESS + String(depositAmount)); // TODO

            const depositBlknum = await rootChain.getDepositBlock();
            depositBlknum.should.be.bignumber.equal(num1);

            await rootChain.deposit({ value: depositAmount, from: owner });

            const merkleHash = tx1.merkleHash();
            const tree = new FixedMerkleTree(16, [merkleHash]);
            const proof = utils.bufferToHex(Buffer.concat(tree.getPlasmaProof(merkleHash)));

            const [root, _] = await rootChain.getChildChain(Number(depositBlknum));
            const sigs = utils.bufferToHex(
                Buffer.concat([
                    tx1.sig1,
                    tx1.sig2,
                    tx1.confirmSig(utils.toBuffer(root), owenerKey)
                ])
            );

            const priority1 = depositBlknum * 1000000000 + 10000 * 0 + 1;
            const utxoId = depositBlknum * 1000000000 + 10000 * 0 + 1;

            await rootChain.startDepositExit(utxoId, ZERO_ADDRESS, Number(tx1.amount1));
            await increaseTime(duration.weeks(1.5));

            const utxoPos1 = depositBlknum * 1000000000 + 10000 * 0 + 1;
            await expectThrow(rootChain.startExit(utxoPos1, depositTxHash, proof, sigs), EVMRevert);

            [expectedOwner, tokenAddr, expectedAmount] = await rootChasin.getExit(priority1);
            expectedOwner.should.equal(owner);
            tokenAddr.shoudl.equal(ZERO_ADDRESS);
            expectedAmount.should.be.bignumber.equal(depositAmount);
        });

        it("can exit single input", async () => {
            await rootChain.deposit({ value: depositAmount, from: owner });
            const depositBlknum = await rootChain.getDepositBlock();

            const tx2 = new Transaction([
                (new BN(Number(depositBlknum))).toArrayLike(Buffer, 'be', 32), // blkbum1
                Buffer.from([]), // txindex1
                Buffer.from([]), // oindex1

                Buffer.from([]), // blknum2
                Buffer.from([]), // txindex2
                Buffer.from([]), // oindex2

                utils.zeros(20), // token address

                utils.toBuffer(owner), // newowner1
                depositAmountBN.toArrayLike(Buffer, 'be', 32), // amount1

                utils.zeros(20), // newowner2
                Buffer.from([]) // amount2           
            ]);

            const txBytes2 = utils.bufferToHex(tx2.serializeTx());
            tx2.sign1(owenerKey);

            const merkleHash = tx2.merkleHash();
            const tree = new FixedMerkleTree(16, [merkleHash]);
            const proof = utils.bufferToHex(Buffer.concat(tree.getPlasmaProof(merkleHash)));

            const childBlknum = await rootChain.getCurrentChildBlock();
            childBlknum.should.be.bignumber.equal(new BigNumber(1000));

            await rootChain.submitBlock(utils.bufferToHex(tree.getRoot()));

            const priority2 = Number(childBlknum) * 1000000000 + 10000 * 0 + 0;
            const [root, _] = await rootChain.getChildChain(Number(childBlknum));
            const sigs = utils.bufferToHex(
                Buffer.concat([
                    tx2.sig1,
                    tx2.sig2,
                    tx2.confirmSig(utils.toBuffer(root), owenerKey)
                ])
            );

            const utxoPos2 = Number(childBlknum) * 1000000000 + 10000 * 0 + 0;
            await rootChain.startExit(utxoPos2, txBytes2, proof, sigs);

            [expectedOwner, tokenAddr, expectedAmount] = await rootChasin.getExit(priority2);
            expectedOwner.should.equal(owner);
            tokenAddr.shoudl.equal(ZERO_ADDRESS);
            expectedAmount.should.be.bignumber.equal(depositAmount);
        });

        it("can exit double input (and submit block twice)", async () => {
            await rootChain.deposit({ value: depositAmount, from: owner });
            const depositBlknum = await rootChain.getDepositBlock();
            const childBlknum = await rootChain.getCurrentChildBlock();

            const tx2 = new Transaction([
                (new BN(Number(depositBlknum))).toArrayLike(Buffer, 'be', 32), // blkbum1
                Buffer.from([]), // txindex1
                Buffer.from([]), // oindex1

                Buffer.from([]), // blknum2
                Buffer.from([]), // txindex2
                Buffer.from([]), // oindex2

                utils.zeros(20), // token address

                utils.toBuffer(owner), // newowner1
                depositAmountBN.toArrayLike(Buffer, 'be', 32), // amount1

                utils.zeros(20), // newowner2
                Buffer.from([]) // amount2           
            ]);

            let merkleHash = tx2.merkleHash();
            let tree = new FixedMerkleTree(16, [merkleHash]);
            childBlknum.should.be.bignumber.equal(new BigNumber(1000));
            await rootChain.submitBlock(utils.bufferToHex(tree.getRoot()));

            const depositBlknum2 = await rootChain.getDepositBlock();
            depositBlknum2.should.be.bignumber.equal(new BigNumber(1001));

            await rootChain.deposit({ value: depositAmount, from: owner });

            const tx3 = new Transaction([
                (new BN(Number(childBlknum))).toArrayLike(Buffer, 'be', 32), // blkbum1
                Buffer.from([]), // txindex1
                Buffer.from([]), // oindex1

                (new BN(Number(depositBlknum2))).toArrayLike(Buffer, 'be', 32), // blknum2
                Buffer.from([]), // txindex2
                Buffer.from([]), // oindex2

                utils.zeros(20), // token address

                utils.toBuffer(owner), // newowner1
                depositAmountBN.toArrayLike(Buffer, 'be', 32), // amount1

                utils.zeros(20), // newowner2
                Buffer.from([]) // amount2           
            ]);

            const txBytes3 = utils.bufferToHex(tx3.serializeTx());
            tx3.sign1(owenerKey);
            tx3.sign2(owenerKey);

            merkleHash = tx3.merkleHash();
            tree = new FixedMerkleTree(16, [merkleHash]);
            const proof = utils.bufferToHex(Buffer.concat(tree.getPlasmaProof(merkleHash)));

            const childBlknum2 = await rootChain.getCurrentChildBlock();
            childBlknum2.should.be.bignumber.equal(new BigNumber(2000));

            await rootChain.submitBlock(utils.bufferToHex(tree.getRoot()));

            const priority3 = Number(childBlknum2) * 1000000000 + 10000 * 0 + 0;

            const [root, _] = await rootChain.getChildChain(Number(childBlknum2));
            const sigs = utils.bufferToHex(
                Buffer.concat([
                    tx2.sig1,
                    tx2.sig2,
                    tx2.confirmSig(utils.toBuffer(root), owenerKey),
                    tx2.confirmSig(utils.toBuffer(root), owenerKey)
                ])
            );
            const utxoPos3 = Number(childBlknum2) * 1000000000 + 10000 * 0 + 0;

            await rootChain.startExit(utxoPos3, txBytes3, proof, sigs);

            [expectedOwner, tokenAddr, expectedAmount] = await rootChasin.getExit(priority3);
            expectedOwner.should.equal(owner);
            tokenAddr.shoudl.equal(ZERO_ADDRESS);
            expectedAmount.should.be.bignumber.equal(depositAmount);
        });
    });

    describe("challengeExit", () => {
        it("can challenge exit", async () => {
            const tx1 = new Transaction([
                Buffer.from([]), // blkbum1
                Buffer.from([]), // txindex1
                Buffer.from([]), // oindex1

                Buffer.from([]), // blknum2
                Buffer.from([]), // txindex2
                Buffer.from([]), // oindex2

                utils.zeros(20), // token address

                utils.toBuffer(owner), // newowner1
                depositAmountBN.toArrayLike(Buffer, 'be', 32), // amount1

                utils.zeros(20), // newowner2
                Buffer.from([]) // amount2           
            ]);
            const depositTxHash = utils.sha3(owner + ZERO_ADDRESS + String(depositAmount)); // TODO
            let depositBlknum = await rootChain.getDepositBlock();

            const utxoPos1 = Number(depositBlknum) * 1000000000 + 1;  // 1
            await rootChain.deposit({ value: depositAmount, from: owner });

            depositBlknum = await rootChain.getDepositBlock();
            const utxoPos2 = Number(depositBlknum) * 1000000000;  // 2
            await rootChain.deposit({ value: depositAmount, from: owner });

            let tree = new FixedMerkleTree(16, [depositTxHash]);
            let proof = utils.bufferToHex(Buffer.concat(tree.getPlasmaProof(depositTxHash)));

            let [root, _] = await rootChain.getChildChain(Number(utxoPos1));
            let sigs = utils.bufferToHex(
                Buffer.concat([
                    tx1.sig1,
                    tx1.sig2,
                    tx1.confirmSig(utils.toBuffer(root), owenerKey)
                ])
            );

            await rootChain.startDepositExit(utxoPos1, ZERO_ADDRESS, Number(tx1.amount1));

            const tx3 = new Transaction([
                (new BN(utxoPos2)).toArrayLike(Buffer, 'be', 32), // blkbum1
                Buffer.from([]), // txindex1
                Buffer.from([]), // oindex1

                Buffer.from([]), // blknum2
                Buffer.from([]), // txindex2
                Buffer.from([]), // oindex2

                utils.zeros(20), // token address

                utils.toBuffer(owner), // newowner1
                depositAmountBN.toArrayLike(Buffer, 'be', 32), // amount1

                utils.zeros(20), // newowner2
                Buffer.from([]) // amount2           
            ]);
            const txBytes3 = utils.bufferToHex(tx3.serializeTx());
            tx3.sign1(owenerKey);

            merkleHash = tx3.merkleHash();
            tree = new FixedMerkleTree(16, [merkleHash]);
            proof = proof = utils.bufferToHex(Buffer.concat(tree.getPlasmaProof(merkleHash)));

            let childBlknum = await rootChain.getCurrentChildBlock();
            await rootChain.submitBlock(utils.bufferToHex(tree.getRoot()));
            sigs = utils.bufferToHex(
                Buffer.concat([
                    tx3.sig1,
                    tx3.sig2
                ])
            );
            const utxoPos3 = Number(childBlknum) * 1000000000 + 10000 * 0 + 0;

            const tx4 = new Transaction([
                (new BN(Number(utxoPos1))).toArrayLike(Buffer, 'be', 32), // blkbum1
                Buffer.from([]), // txindex1
                Buffer.from([]), // oindex1

                Buffer.from([]), // blknum2
                Buffer.from([]), // txindex2
                Buffer.from([]), // oindex2

                utils.zeros(20), // token address

                utils.toBuffer(owner), // newowner1
                depositAmountBN.toArrayLike(Buffer, 'be', 32), // amount1

                utils.zeros(20), // newowner2
                Buffer.from([]) // amount2           
            ]);

            const txBytes4 = utils.bufferToHex(tx4.serializeTx());
            tx4.sign1(owenerKey);

            merkleHash = tx4.merkleHash();
            tree = new FixedMerkleTree(16, [merkleHash]);
            proof = utils.bufferToHex(Buffer.concat(tree.getPlasmaProof(merkleHash)));

            childBlknum = await rootChain.getCurrentChildBlock();
            await rootChain.submitBlock(utils.bufferToHex(tree.getRoot()));

            [root, _] = await rootChain.getChildChain(Number(childBlknum));
            const confirmationSig = tx4.confirmSig(utils.toBuffer(root), owenerKey)
            sigs = tx4.sig1 + tx4.sig2;

            const utxoPos4 = Number(childBlknum) * 1000000000 + 10000 * 0 + 0;
            const oindex1 = 0;

            [expectedOwner, tokenAddr, expectedAmount] = await rootChasin.getExit(utxoPos1);
            expectedOwner.should.equal(owner);
            tokenAddr.shoudl.equal(ZERO_ADDRESS);
            expectedAmount.should.be.bignumber.equal(depositAmount);

            await rootChain.challengeExit(utxoPos4, oindex1, txBytes4, proof, sigs, confirmationSig);

        });

        it("should fails if transaction after exit doesn't reference the utxo being exited", async () => {
            await expectThrow(rootChain.challengeExit(utxoPos3, utxoPos1, txBytes3, proof, sigs, confirmationSig), EVMRevert);
        });

        it("should fails if transaction proof is incorrect", async () => {
            await expectThrow(rootChain.challengeExit(utxoPos4, utxoPos1, txBytes4, proof, sigs, confirmationSig), EVMRevert);
        });
    });

    describe("finalizeExits", () => {

    });
});
