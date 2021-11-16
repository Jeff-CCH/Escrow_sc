const Escrow = artifacts.require("Escrow");
const admin_addr='0x2849f61e08B66A3b0eC2512613092174Df19Db1e';

module.exports = function (deployer) {
  deployer.deploy(Escrow, admin_addr);
};