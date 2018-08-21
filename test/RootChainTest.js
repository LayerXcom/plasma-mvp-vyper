const utils = require("ethereumjs-util");
const { latestTime } = require('./helpers/latestTime');
const { increaseTime, duration } = require('./helpers/increaseTime');
const { EVMRevert } = require('./helpers/EVMRevert');
const { expectThrow } = require('./helpers/expectThrow');
const FixedMerkleTree = require('./helpers/fixedMerkleTree');
const Transaction = require('./helpers/transaction');
const { keys, liveKeys } = require('./helpers/keys');
const { advanceBlock } = require('./helpers/advanceToBlock');
const { getTransactionGasCost } = require('./helpers/getGasCost');

const RootChain = artifacts.require("root_chain");
const PriorityQueue = artifacts.require("priority_queue");

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
    const liveOwnerKey = liveKeys[0];
    const ZERO_ADDRESS = utils.bufferToHex(utils.zeros(20));


    const rawTx = "0xf9035b808506fc23ac0083045f788080b903486103305660006109ac5260006109cc527f0100000000000000000000000000000000000000000000000000000000000000600035046109ec526000610a0c5260006109005260c06109ec51101515585760f86109ec51101561006e5760bf6109ec510336141558576001610a0c52610098565b60013560f76109ec51036020035260005160f66109ec510301361415585760f66109ec5103610a0c525b61022060016064818352015b36610a0c511015156100b557610291565b7f0100000000000000000000000000000000000000000000000000000000000000610a0c5135046109ec526109cc5160206109ac51026040015260016109ac51016109ac5260806109ec51101561013b5760016109cc5161044001526001610a0c516109cc5161046001376001610a0c5101610a0c5260216109cc51016109cc52610281565b60b86109ec5110156101d15760806109ec51036109cc51610440015260806109ec51036001610a0c51016109cc51610460013760816109ec5114156101ac5760807f01000000000000000000000000000000000000000000000000000000000000006001610a0c5101350410151558575b607f6109ec5103610a0c5101610a0c5260606109ec51036109cc51016109cc52610280565b60c06109ec51101561027d576001610a0c51013560b76109ec510360200352600051610a2c526038610a2c5110157f01000000000000000000000000000000000000000000000000000000000000006001610a0c5101350402155857610a2c516109cc516104400152610a2c5160b66109ec5103610a0c51016109cc516104600137610a2c5160b66109ec5103610a0c510101610a0c526020610a2c51016109cc51016109cc5261027f565bfe5b5b5b81516001018083528114156100a4575b5050601f6109ac511115155857602060206109ac5102016109005260206109005103610a0c5261022060016064818352015b6000610a0c5112156102d45761030a565b61090051610a0c516040015101610a0c51610900516104400301526020610a0c5103610a0c5281516001018083528114156102c3575b50506109cc516109005101610420526109cc5161090051016109005161044003f35b61000461033003610004600039610004610330036000f31b2d4f";

    // See: https://github.com/ethereum/vyper/blob/master/vyper/utils.py#L125
    const RLP_DECODER_ADDRESS = '0x5185D17c44699cecC3133114F8df70753b856709';

    // web3.eth.sendTransaction({ from: owner, to: "0xd2c560282c9C02465C2dAcdEF3E859E730848761", value: 6270960000000000 });
    web3.eth.sendTransaction({ from: owner, to: "0x39ba083c30fCe59883775Fc729bBE1f9dE4DEe11", value: 10 ** 17 });

    // web3.eth.sendRawTransaction("0xf90237808506fc23ac00830330888080b902246102128061000e60003961022056600060007f010000000000000000000000000000000000000000000000000000000000000060003504600060c082121515585760f882121561004d5760bf820336141558576001905061006e565b600181013560f783036020035260005160f6830301361415585760f6820390505b5b368112156101c2577f010000000000000000000000000000000000000000000000000000000000000081350483602086026040015260018501945060808112156100d55760018461044001526001828561046001376001820191506021840193506101bc565b60b881121561014357608081038461044001526080810360018301856104600137608181141561012e5760807f010000000000000000000000000000000000000000000000000000000000000060018401350412151558575b607f81038201915060608103840193506101bb565b60c08112156101b857600182013560b782036020035260005160388112157f010000000000000000000000000000000000000000000000000000000000000060018501350402155857808561044001528060b6838501038661046001378060b6830301830192506020810185019450506101ba565bfe5b5b5b5061006f565b601f841315155857602060208502016020810391505b6000821215156101fc578082604001510182826104400301526020820391506101d8565b808401610420528381018161044003f350505050505b6000f31b2d4f");
    const txHash = web3.eth.sendRawTransaction(rawTx);
    const receipt = web3.eth.getTransactionReceipt(txHash);
    const rlpDecoderAddr = utils.toChecksumAddress(receipt.contractAddress);
    rlpDecoderAddr.should.equal(RLP_DECODER_ADDRESS);


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
        it("fee exit should get exitable after deposit exit", async () => {
            let utxoPos, exitableAt;

            const blknum = await rootChain.getDepositBlock();
            await rootChain.deposit({ value: depositAmount, from: owner });

            (await rootChain.getCurrentFeeExit()).should.be.bignumber.equal(num1);

            const expectedUtxoAt = await rootChain.getCurrentFeeExit();
            const expectedExitableAt = (await latestTime()) + duration.weeks(2) + 1;

            await rootChain.startFeeExit(ZERO_ADDRESS, 1);
            (await rootChain.getCurrentFeeExit()).should.be.bignumber.equal(num2);

            [utxoPos, feeExitableAt] = await rootChain.getNextExit(ZERO_ADDRESS);

            utxoPos.should.be.bignumber.equal(expectedUtxoAt);
            feeExitableAt.should.be.bignumber.equal(expectedExitableAt);

            const expectedUtxoPos = blknum.mul(utxoOrder).plus(num1);
            await rootChain.startDepositExit(expectedUtxoPos, ZERO_ADDRESS, depositAmount);

            [utxoPos, depositExitableAt] = await rootChain.getNextExit(ZERO_ADDRESS);
            feeExitableAt.should.be.bignumber.above(depositExitableAt);
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
                utils.toBuffer(0), // blkbum1
                utils.toBuffer(0), // txindex1
                utils.toBuffer(0), // oindex1

                utils.toBuffer(0), // blknum2
                utils.toBuffer(0), // txindex2
                utils.toBuffer(0), // oindex2

                utils.zeros(20), // token address

                utils.toBuffer(owner), // newowner1
                utils.toBuffer(depositAmountNum), // amount1

                utils.zeros(20), // newowner2
                utils.toBuffer(0) // amount2   
            ]);

            // RLP encoded tx1            
            const encodedTx1 = "0xf84e00000000000094000000000000000000000000000000000000000094627306090abab3a6e1400e9345bc60c78a8bef57872386f26fc1000094000000000000000000000000000000000000000000";

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
                    tx1.confirmSig(utils.toBuffer(root), owenerKey),
                ])
            );

            const priority1 = Number(depositBlknum) * 1000000000 + 10000 * 0 + 1;
            const utxoId = Number(depositBlknum) * 1000000000 + 10000 * 0 + 1;

            await rootChain.startDepositExit(utxoId, ZERO_ADDRESS, Number(depositAmount));
            await increaseTime(duration.weeks(1.5));

            const utxoPos1 = Number(depositBlknum) * 1000000000 + 10000 * 0 + 1;

            await expectThrow(rootChain.startExit(utxoPos1, encodedTx1, proof, sigs), EVMRevert);

            [expectedOwner, tokenAddr, expectedAmount] = await rootChain.getExit(priority1);
            expectedOwner.should.equal(owner);
            tokenAddr.should.equal(ZERO_ADDRESS);
            expectedAmount.should.be.bignumber.equal(depositAmount);
        });

        it("can exit single input", async () => {
            await rootChain.deposit({ value: depositAmount, from: owner });
            const depositBlknum = await rootChain.getDepositBlock();

            const tx2 = new Transaction([
                utils.toBuffer(Number(depositBlknum)), // blkbum1
                utils.toBuffer(0), // txindex1
                utils.toBuffer(0), // oindex1

                utils.toBuffer(0), // blknum2
                utils.toBuffer(0), // txindex2
                utils.toBuffer(0), // oindex2

                utils.zeros(20), // token address

                utils.toBuffer(owner), // newowner1                
                utils.toBuffer(depositAmountNum), // amount1

                utils.zeros(20), // newowner2
                utils.toBuffer(0), // amount2           
            ]);

            // RLP encoded tx2 because of RLP Decoder in vyper
            const encodedTx2 = "0xf84e02000000000094000000000000000000000000000000000000000094627306090abab3a6e1400e9345bc60c78a8bef57872386f26fc1000094000000000000000000000000000000000000000000";
            // const encodedTx2 = "0xf84e02808080808094000000000000000000000000000000000000000094627306090abab3a6e1400e9345bc60c78a8bef57872386f26fc1000094000000000000000000000000000000000000000080";            

            const vrs = utils.ecsign(utils.sha3(encodedTx2), owenerKey);
            const sig1 = utils.toBuffer(utils.toRpcSig(vrs.v, vrs.r, vrs.s));

            const merkleHash = utils.sha3(Buffer.concat([utils.toBuffer(utils.sha3(encodedTx2)), sig1, utils.zeros(65)]));

            const tree = new FixedMerkleTree(16, [merkleHash]);
            const proof = utils.bufferToHex(Buffer.concat(tree.getPlasmaProof(merkleHash)));

            const childBlknum = await rootChain.getCurrentChildBlock();
            childBlknum.should.be.bignumber.equal(new BigNumber(1000));

            await rootChain.submitBlock(utils.bufferToHex(tree.getRoot()));

            const priority2 = Number(childBlknum) * 1000000000 + 10000 * 0 + 0;
            const [root, _] = await rootChain.getChildChain(Number(childBlknum));

            const confVrs = utils.ecsign(
                utils.sha3(Buffer.concat([utils.toBuffer(utils.sha3(encodedTx2)), utils.toBuffer(root)])),
                owenerKey
            );
            const confirmSig = utils.toBuffer(utils.toRpcSig(confVrs.v, confVrs.r, confVrs.s));

            const sigs = utils.bufferToHex(
                Buffer.concat([
                    sig1,
                    utils.zeros(65),
                    confirmSig
                ])
            );

            const utxoPos2 = Number(childBlknum) * 1000000000 + 10000 * 0 + 0;

            await rootChain.startExit(utxoPos2, encodedTx2, proof, sigs);

            [expectedOwner, tokenAddr, expectedAmount] = await rootChain.getExit(priority2);
            expectedOwner.should.equal(owner);
            tokenAddr.should.equal(ZERO_ADDRESS);
            expectedAmount.should.be.bignumber.equal(depositAmount);
        });

        it("can exit double input (and submit block twice)", async () => {
            await rootChain.deposit({ value: depositAmount, from: owner });
            const depositBlknum = await rootChain.getDepositBlock();
            const childBlknum = await rootChain.getCurrentChildBlock();

            const tx2 = new Transaction([
                utils.toBuffer(Number(depositBlknum)), // blkbum1
                utils.toBuffer(0), // txindex1
                utils.toBuffer(0), // oindex1

                utils.toBuffer(0), // blknum2
                utils.toBuffer(0), // txindex2
                utils.toBuffer(0), // oindex2

                utils.zeros(20), // token address

                utils.toBuffer(owner), // newowner1                
                utils.toBuffer(depositAmountNum), // amount1

                utils.zeros(20), // newowner2
                utils.toBuffer(0), // amount2           
            ]);

            let merkleHash = tx2.merkleHash();
            let tree = new FixedMerkleTree(16, [merkleHash]);
            childBlknum.should.be.bignumber.equal(new BigNumber(1000));
            await rootChain.submitBlock(utils.bufferToHex(tree.getRoot()));

            const depositBlknum2 = await rootChain.getDepositBlock();
            depositBlknum2.should.be.bignumber.equal(new BigNumber(1001));

            await rootChain.deposit({ value: depositAmount, from: owner });

            const tx3 = new Transaction([
                utils.toBuffer(Number(childBlknum)), // blkbum1
                utils.toBuffer(0), // txindex1
                utils.toBuffer(0), // oindex1

                utils.toBuffer(Number(depositBlknum2)), // blknum2
                utils.toBuffer(0), // txindex2
                utils.toBuffer(0), // oindex2

                utils.zeros(20), // token address

                utils.toBuffer(owner), // newowner1
                utils.toBuffer(depositAmountNum), // amount1

                utils.zeros(20), // newowner2
                utils.toBuffer(0) // amount2           
            ]);

            const txBytes3 = utils.bufferToHex(tx3.serializeTx());
            console.log(txBytes3);
            const encodedTx3 = "";

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

            [expectedOwner, tokenAddr, expectedAmount] = await rootChain.getExit(priority3);
            expectedOwner.should.equal(owner);
            tokenAddr.should.equal(ZERO_ADDRESS);
            expectedAmount.should.be.bignumber.equal(depositAmount);
        });
    });

    describe("challengeExit", () => {

    });

    describe("finalizeExits", () => {
        it("can start exits and finalize exits", async () => {
            const depositBlknum1 = await rootChain.getDepositBlock();
            await rootChain.deposit({ value: depositAmount, from: owner });
            const utxoPos1 = Number(depositBlknum1) * 1000000000 + 10000 * 0;

            await rootChain.startDepositExit(utxoPos1, ZERO_ADDRESS, Number(depositAmount), { from: owner });
            await increaseTime(duration.weeks(4));

            let [expectedOwner, tokenAddr, expectedAmount] = await rootChain.getExit(utxoPos1);
            expectedOwner.should.equal(owner);
            tokenAddr.should.equal(ZERO_ADDRESS);
            expectedAmount.should.be.bignumber.equal(depositAmount);

            const preBalance = web3.eth.getBalance(owner);
            const res = await rootChain.finalizeExits(ZERO_ADDRESS);
            const gasCost = getTransactionGasCost(res["tx"]);
            const postBalance = web3.eth.getBalance(owner);

            postBalance.plus(gasCost).should.be.bignumber.equal(preBalance.plus(depositAmount));

            [expectedOwner, tokenAddr, expectedAmount] = await rootChain.getExit(utxoPos1);
            expectedOwner.should.equal(ZERO_ADDRESS);
            tokenAddr.should.equal(ZERO_ADDRESS);
            expectedAmount.should.be.bignumber.equal(depositAmount);
        });
    });
});
