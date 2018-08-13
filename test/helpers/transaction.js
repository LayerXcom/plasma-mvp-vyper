const utils = require('ethereumjs-util');
const { Buffer } = require('safe-buffer');

const BN = utils.BN
const rlp = utils.rlp
const ZeroBalance = new BN(0)
const BlankAddress = utils.bufferToHex(utils.zeros(20))
const getFields = () => [
    {
        name: 'blknum1',
        default: new Buffer([])
    },
    {
        name: 'txindex1',
        default: new Buffer([])
    },
    {
        name: 'oindex1',
        default: new Buffer([])
    },
    {
        name: 'blknum2',
        default: new Buffer([])
    },
    {
        name: 'txindex2',
        default: new Buffer([])
    },
    {
        name: 'oindex2',
        default: new Buffer([])
    },
    {
        name: 'newowner1',
        length: 20,
        default: utils.zeros(20)
    },
    {
        name: 'amount1',
        default: new Buffer([])
    },
    {
        name: 'newowner2',
        length: 20,
        default: utils.zeros(20)
    },
    {
        name: 'amount2',
        default: new Buffer([])
    },
    {
        name: 'fee',
        default: new Buffer([])
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

export default class Transaction {
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

    confirmTx(tx, root, privateKey) {
        const vrs = utils.ecsign(
            utils.sha3(Buffer.concat([utils.rlphash(tx), root])),
            privateKey
        );
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

    //
    // utils methods
    //

    _inputKey(inputIndex) {
        const pos = this.positionsByInputIndex(inputIndex)
        return pos.map(v => utils.bufferToInt(v).toString()).join('-')
    }

    _inputNull(inputIndex) {
        const pos = this.positionsByInputIndex(inputIndex)
        return pos.every(v => utils.bufferToInt(v) === 0)
    }

    _outputNull(outputIndex) {
        const owner = this.ownerByOutputIndex(outputIndex)
        const amount = this.amountByOutputIndex(outputIndex)
        return utils.bufferToHex(owner) === BlankAddress && new BN(amount).isZero()
    }

    /**
     * Get position array (as Buffer array) for given input index.
     * @param index Index must be less than or equals to `totalInputs`
     * @returns buffer array - this.raw[0, 1, 2] & this.raw[3, 4, 5], for input index 0 & 1 respectively.
     */
    positionsByInputIndex(index) {
        return this.raw.slice(3 * index, 3 * index + 3)
    }

    /**
     * Get input's output position (as Buffer) for given input index.
     * @param index Index must be less than or equals to `totalInputs`
     * @returns buffer - this.raw[2] & this.raw[5], for input index 0 & 1 respectively.
     */
    outputPositionByInputIndex(index) {
        return this.raw[3 * index + 2]
    }

    /**
     * Get sender's signature (as Buffer) by input index.
     * @param index Index must be less than or equals to `totalInputs`
     * @returns buffer - this.raw[11] & this.raw[13], for input index 0 & 1 respectively.
     */
    sigByInputIndex(index) {
        return this.raw[11 + index]
    }

    /**
     * Get sender's address (as Buffer) by input index.
     * @param index Index must be less than or equals to `totalInputs`
     * @returns buffer - address which will be recovered from input signature.
     */
    senderByInputIndex(index) {
        if (this._inputNull(index)) {
            return null
        }

        const vrs = utils.fromRpcSig(this.sigByInputIndex(index)) // parse {v,r,s} from sig
        return utils.pubToAddress(
            utils.ecrecover(this.hash(false), vrs.v, vrs.r, vrs.s)
        )
    }

    /**
     * Get new owner address (as Buffer) by output index.
     * @param index Index must be less than or equals to `totalOutputs`
     * @returns buffer - this.raw[6] & this.raw[8], for input index 0 & 1 respectively.
     */
    ownerByOutputIndex(index) {
        return this.raw[2 * index + 6]
    }

    /**
     * Get new owner's amount (as Buffer) by output index.
     * @param index Index must be less than or equals to `totalOutputs`
     * @returns buffer - this.raw[7] & this.raw[9], for input index 0 & 1 respectively.
     */
    amountByOutputIndex(index) {
        return this.raw[2 * index + 7]
    }

    /**
     * Get exit id (as Buffer) by input index.
     */
    exitIdByInputIndex(index) {
        const [blkNumber, txIndex, oIndex] = this.positionsByInputIndex(index)
        if (utils.bufferToInt(blkNumber) === 0) {
            return null
        }

        return (
            utils.bufferToInt(blkNumber) * 1000000000 +
            utils.bufferToInt(txIndex) * 10000 +
            utils.bufferToInt(oIndex)
        )
    }

    /**
     * Get key for UTXO (as Buffer) by input index
     */
    keyForUTXOByInputIndex(index) {
        const sender = this.senderByInputIndex(index)
        if (sender) {
            const [blkNumber, txIndex, oIndex] = this.positionsByInputIndex(index)
            return Transaction.keyForUTXO(sender, blkNumber, txIndex, oIndex)
        }

        return null
    }

    // static method for utxo key
    static keyForUTXO(sender, blkNumber, txIndex, oIndex) {
        return Buffer.concat([
            config.prefixes.utxo,
            utils.toBuffer(sender),
            new BN(blkNumber).toArrayLike(Buffer, 'be', 32), // block number
            new BN(txIndex).toArrayLike(Buffer, 'be', 32), // tx index
            new BN(oIndex).toArrayLike(Buffer, 'be', 32) // output index
        ])
    }
}
