function getTransactionGasCost(tx) {
    const transaction = web3.eth.getTransactionReceipt(tx);
    const amount = transaction.gasUsed;
    const price = web3.eth.getTransaction(tx).gasPrice;
  
    return new web3.BigNumber(price * amount);
}

module.exports = {
    getTransactionGasCost,
}