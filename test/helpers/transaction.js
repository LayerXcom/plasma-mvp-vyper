const utils = require('ethereumjs-util');
const { Buffer } = require('safe-buffer');

const BN = utils.BN
const rlp = utils.rlp;
const ZeroBalance = new BN(0)
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
}

module.exports = Transaction;
