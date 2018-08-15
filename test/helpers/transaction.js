const utils = require('ethereumjs-util');
const { Buffer } = require('safe-buffer');

const BN = utils.BN
const rlp = utils.rlp
const ZeroBalance = new BN(0)
const BlankAddress = utils.bufferToHex(utils.zeros(20))
const getFields = () => [
    {
        name: 'blknum1',
        default: Buffer.from([])
    },
    {
        name: 'txindex1',
        default: Buffer.from([])
    },
    {
        name: 'oindex1',
        default: Buffer.from([])
    },
    {
        name: 'blknum2',
        default: Buffer.from([])
    },
    {
        name: 'txindex2',
        default: Buffer.from([])
    },
    {
        name: 'oindex2',
        default: Buffer.from([])
    },
    {
        name: 'tokenAddress',
        default: utils.zeros(20)
    },
    {
        name: 'newowner1',
        length: 20,
        default: utils.zeros(20)
    },
    {
        name: 'amount1',
        default: Buffer.from([])
    },
    {
        name: 'newowner2',
        length: 20,
        default: utils.zeros(20)
    },
    {
        name: 'amount2',
        default: Buffer.from([])
    },
    {
        name: 'sig1',
        length: 65,
        default: utils.zeros(65)
    },
    {
        name: 'sig2',
        length: 65,
        default: utils.zeros(65)
    }
]

class Transaction {
    constructor(data) {
        utils.defineProperties(this, getFields(), data)

        // total inputs & oututs
        this.totalInputs = 2
        this.totalOutputs = 2
    }

    hash(includeSignature = false) {
        let items
        if (includeSignature) {
            items = this.raw
        } else {
            items = this.raw.slice(0, this.raw.length - 2)
        }

        // create hash
        return utils.rlphash(items)
    }

    merkleHash() {
        return utils.sha3(Buffer.concat([this.hash(false), this.sig1, this.sig2]))
    }

    /**
     * sign a transaction with a given a private key
     * @param {Buffer} privateKey
     */
    sign1(privateKey) {
        const vrs = utils.ecsign(this.hash(false), privateKey)
        this.sig1 = utils.toBuffer(utils.toRpcSig(vrs.v, vrs.r, vrs.s))
        return this.sig1
    }

    /**
     * sign a transaction with a given a private key
     * @param {Buffer} privateKey
     */
    sign2(privateKey) {
        const vrs = utils.ecsign(this.hash(false), privateKey)
        this.sig2 = utils.toBuffer(utils.toRpcSig(vrs.v, vrs.r, vrs.s))
        return this.sig2
    }

    confirmSig(root, privateKey) {
        const vrs = utils.ecsign(
            utils.sha3(Buffer.concat([this.hash(false), root])),
            privateKey
        )
        return utils.toBuffer(utils.toRpcSig(vrs.v, vrs.r, vrs.s))
    }

    serializeTx(includeSignature = false) {
        if (includeSignature) {
            return this.serialize()
        }

        const items = this.raw.slice(0, this.raw.length - 2)
        // create hash
        return rlp.encode(items)
    }

    // check if transaction is valid for deposit
    isDepositTx() {
        // invalid if any input is not null
        if (!this._inputNull(0) || !this._inputNull(1)) {
            return false
        }

        // invalid if 1st output is null
        if (this._outputNull(0)) {
            return false
        }

        return true
    }

    async validate(chain) {
        // valid if tx is deposit tx
        if (this.isDepositTx()) {
            return true
        }

        // invalid if both inputs are same
        if (this._inputKey(0) === this._inputKey(1)) {
            return false
        }

        // check while making blocks
        let inputSum = ZeroBalance
        let outputSum = ZeroBalance
        let fees = new BN(this.raw[10])

        let i
        for (i = 0; i < this.totalInputs; i++) {
            const inputTx = await this.getInputTransaction(chain, i)
            if (inputTx) {
                const outputIndex = utils.bufferToInt(
                    this.outputPositionByInputIndex(i)
                )

                // calculate input sum
                inputSum = inputSum.add(
                    new BN(inputTx.amountByOutputIndex(outputIndex))
                )

                // check signature
                const recovered = this.senderByInputIndex(i)
                if (
                    !recovered ||
                    recovered.compare(inputTx.ownerByOutputIndex(outputIndex)) !== 0
                ) {
                    return false
                }
            }
        }

        for (i = 0; i < this.totalOutputs; i++) {
            // calculate output sum
            outputSum = outputSum.add(new BN(this.amountByOutputIndex(i)))
        }

        // invalid if sum(inputs) < fees + sum(outputs)
        if (inputSum.lt(fees.add(outputSum))) {
            return false
        }

        return true
    }

    async getInputTransaction(chain, inputIndex) {
        if (this._inputNull(inputIndex)) {
            return null
        }

        let [blockNumber, txIndex] = this.positionsByInputIndex(inputIndex)
        try {
            txIndex = utils.bufferToInt(txIndex) // parse to int
            const block = await chain.getBlock(new BN(blockNumber).toNumber())
            if (block.transactions.length > utils.bufferToInt(txIndex)) {
                return block.transactions[txIndex]
            }
        } catch (e) { }
        return null
    }
}

module.exports = Transaction;
