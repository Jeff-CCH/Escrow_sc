const Escrow = artifacts.require("Escrow");

contract("Escrow", (accounts) =>{
    let escrow;
    let [alice, bob] = accounts;
    beforeEach(async() => {
      escrow = await Escrow.deployed();
    });
    
    it("should deposit", async () => {
        var result = await escrow.deposit(alice, {from: bob, value: 2*(10**18)});
        assert.isTrue(result.receipt.status);
        assert.equal(result.receipt.logs[0].args.id.length, 66);
    });

    it("should not confirm", async () => {
        try {
            var id = "0x11";
            var result = await escrow.confirm(id, {from: bob});
            assert.isTrue(false);
        } catch (e) {
            console.log(`${id} does not exist`)
            assert.isTrue(true);
        }
    });

    it("should confirm", async () => {
        var depositBalance = 2*(10**18);
        var aliceInitBalance = await web3.eth.getBalance(alice);

        console.log("alice init balance:", aliceInitBalance);

        var result = await escrow.deposit(alice, {from: bob, value: depositBalance});
        var id = result.receipt.logs[0].args.id
        assert.isTrue(result.receipt.status);
        assert.equal(id.length, 66);
        /*const bobGasUsed = result.receipt.gasUsed;

        var tx = await web3.eth.getTransaction(result.tx);
        const bobGasPrice = tx.gasPrice;
        const bobConsumed = bobGasPrice * bobGasUsed;
        
        console.log("bob consumed: ", bobConsumed);
*/
        result = await escrow.confirm(id, {from: bob});
  
        var aliceFinalBalance = await web3.eth.getBalance(alice);
        console.log("alice final balance: ", aliceFinalBalance);
        assert.isTrue(result.receipt.status);
        assert.isTrue(aliceFinalBalance > aliceInitBalance);
    });

    it("should refund", async () => {
        var depositBalance = 2*(10**18);
        var bobInitBalance = await web3.eth.getBalance(bob);

        console.log("bob init balance:", bobInitBalance);

        var result = await escrow.deposit(alice, {from: bob, value: depositBalance});
        var id = result.receipt.logs[0].args.id
        assert.isTrue(result.receipt.status);
        assert.equal(id.length, 66);
        /*const bobGasUsed = result.receipt.gasUsed;
        console.log("gas used: ", bobGasUsed);

        var tx = await web3.eth.getTransaction(result.tx);
        const bobGasPrice = tx.gasPrice;
        console.log("gas price: ", bobGasPrice);
        const bobConsumed = bobGasPrice * bobGasUsed;
        
        console.log("bob consumed: ", bobConsumed);
*/
        result = await escrow.refund(id, {from: bob});
  
        var bobFinalBalance = await web3.eth.getBalance(bob);
        console.log("bob final balance:", bobFinalBalance);

        assert.isTrue(result.receipt.status);
        assert.isTrue(bobFinalBalance < bobInitBalance);
    });

});

