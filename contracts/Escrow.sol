// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

contract Escrow {

    struct Order {
        uint amount;
        address from;
        address to;
        OrderState state;
    }

    enum OrderState {
        Verifying,
        Canceled,
        Finished
    }

    mapping(bytes32 => Order) orderBook;
    uint randNonce;

    bytes32 private constant HANDLER_REGISTRY = keccak256(abi.encodePacked("escrow.admin.loc"));

    event LogDeposit(bytes32 id, address from, uint amount, address to);
    event LogConfirm(bytes32 id, address from, uint amount, address to);
    event LogRefund(bytes32 id, address from, uint amount, address to);

    modifier orderExist(bytes32 id) {
        require(orderBook[id].amount != 0, "order does not exist");
        _;
    }

    modifier withPriviledge(bytes32 id) {
        require(orderBook[id].from == msg.sender || _getRegistry() == msg.sender, "no priviledge");
        _;
    }

    modifier realDeposit() {
        require(msg.value > 0 ether, "need to deposit with ether");
        _;
    }

    modifier realAddress(address addr) {
        require(addr != address(0));
        _;
    }

    modifier isVerifying(bytes32 id) {
        require(orderBook[id].state == OrderState.Verifying);
        _;
    }

    constructor(address registry) {
        bytes32 slot = HANDLER_REGISTRY;
        assembly {
            sstore(slot, registry)
        }
    }

    receive() external payable {
        revert();
    }

    fallback() external {
        revert();
    }

    function deposit(address _to) external payable realDeposit realAddress(_to) returns (bytes32) {
        bytes32 id = _randMod();
        orderBook[id] = Order({
            amount: msg.value,
            from: msg.sender,
            to: _to,
            state: OrderState.Verifying
        });
        emit LogDeposit(id, msg.sender, msg.value, _to);
        return id;
    }

    function confirm(bytes32 _id) external orderExist(_id) isVerifying(_id) withPriviledge(_id) {
        uint amount = orderBook[_id].amount;
        address to = orderBook[_id].to;
        orderBook[_id].state = OrderState.Finished;
        payable(address(to)).transfer(amount);
        emit LogConfirm(_id, msg.sender, amount, to);
    }

    function refund(bytes32 _id) external orderExist(_id) isVerifying(_id) withPriviledge(_id) {
        uint amount = orderBook[_id].amount;
        address from = orderBook[_id].from;
        orderBook[_id].state = OrderState.Canceled;
        payable(address(from)).transfer(amount);
        emit LogRefund(_id, from, amount, orderBook[_id].to);
    }

    function _getRegistry() internal view returns (address registry) {
        bytes32 slot = HANDLER_REGISTRY;
        assembly {
            registry := sload(slot)
        }
    }

    function _randMod() internal returns(bytes32) {
    randNonce++;
    return keccak256(abi.encodePacked(block.timestamp, msg.sender, randNonce));
  }
}

