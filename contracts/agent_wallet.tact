import "@stdlib/ownable";

// === Messages ===

message(0x01) AddAllowedAddress {
    address: Address;
}

message(0x02) RemoveAllowedAddress {
    address: Address;
}

message(0x03) SetSpendingLimit {
    maxTransaction: Int as coins;
    dailyLimit: Int as coins;
}

message(0x04) TransferTon {
    to: Address;
    amount: Int as coins;
}

// === Structs ===

struct PolicyInfo {
    maxTransaction: Int as coins;
    dailyLimit: Int as coins;
    spentToday: Int as coins;
    lastResetTime: Int as uint32;
}

// === Contract ===

contract AgentWallet with OwnableTransferable {
    owner: Address;
    allowedAddresses: map<Address, Bool>;
    maxTransaction: Int as coins;
    dailyLimit: Int as coins;
    spentToday: Int as coins;
    lastResetTime: Int as uint32;

    init(owner: Address, maxTransaction: Int, dailyLimit: Int) {
        self.owner = owner;
        self.maxTransaction = maxTransaction;
        self.dailyLimit = dailyLimit;
        self.spentToday = 0;
        self.lastResetTime = now();
    }

    // Accept incoming TON (deploy + top-up)
    receive() {}

    // Owner: add an allowed agent address
    receive(msg: AddAllowedAddress) {
        self.requireOwner();
        self.allowedAddresses.set(msg.address, true);
    }

    // Owner: remove an allowed agent address
    receive(msg: RemoveAllowedAddress) {
        self.requireOwner();
        self.allowedAddresses.del(msg.address);
    }

    // Owner: update spending limits
    receive(msg: SetSpendingLimit) {
        self.requireOwner();
        require(msg.maxTransaction > 0, "Max transaction must be positive");
        require(msg.dailyLimit > 0, "Daily limit must be positive");
        self.maxTransaction = msg.maxTransaction;
        self.dailyLimit = msg.dailyLimit;
    }

    // Owner or allowed agent: transfer TON with on-chain policy checks
    receive(msg: TransferTon) {
        let senderAddr: Address = sender();

        // Must be owner or allowed agent
        let isOwner: Bool = senderAddr == self.owner;
        let isAllowed: Bool = self.allowedAddresses.exists(senderAddr);
        require(isOwner || isAllowed, "Not authorized");

        require(msg.amount > 0, "Amount must be positive");
        require(msg.amount <= myBalance() - ton("0.05"), "Insufficient balance");

        // Check max transaction limit (agents only, owner bypasses)
        if (!isOwner) {
            require(msg.amount <= self.maxTransaction, "Exceeds max transaction limit");

            // Reset daily counter if new day (86400 seconds)
            if (now() - self.lastResetTime >= 86400) {
                self.spentToday = 0;
                self.lastResetTime = now();
            }

            require(
                self.spentToday + msg.amount <= self.dailyLimit,
                "Daily spending limit exceeded"
            );
            self.spentToday += msg.amount;
        }

        // Send TON
        send(SendParameters{
            to: msg.to,
            value: msg.amount,
            mode: SendPayFwdFeesSeparately | SendIgnoreErrors,
            body: "agent-transfer".asComment(),
        });
    }

    // === Getters ===

    get fun balance(): Int {
        return myBalance();
    }

    get fun isAllowed(addr: Address): Bool {
        return self.allowedAddresses.exists(addr);
    }

    get fun policyInfo(): PolicyInfo {
        return PolicyInfo{
            maxTransaction: self.maxTransaction,
            dailyLimit: self.dailyLimit,
            spentToday: self.spentToday,
            lastResetTime: self.lastResetTime,
        };
    }
}
