import {
    Cell,
    Slice,
    Address,
    Builder,
    beginCell,
    ComputeError,
    TupleItem,
    TupleReader,
    Dictionary,
    contractAddress,
    address,
    ContractProvider,
    Sender,
    Contract,
    ContractABI,
    ABIType,
    ABIGetter,
    ABIReceiver,
    TupleBuilder,
    DictionaryValue
} from '@ton/core';

export type DataSize = {
    $$type: 'DataSize';
    cells: bigint;
    bits: bigint;
    refs: bigint;
}

export function storeDataSize(src: DataSize) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.cells, 257);
        b_0.storeInt(src.bits, 257);
        b_0.storeInt(src.refs, 257);
    };
}

export function loadDataSize(slice: Slice) {
    const sc_0 = slice;
    const _cells = sc_0.loadIntBig(257);
    const _bits = sc_0.loadIntBig(257);
    const _refs = sc_0.loadIntBig(257);
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadGetterTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function storeTupleDataSize(source: DataSize) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.cells);
    builder.writeNumber(source.bits);
    builder.writeNumber(source.refs);
    return builder.build();
}

export function dictValueParserDataSize(): DictionaryValue<DataSize> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDataSize(src)).endCell());
        },
        parse: (src) => {
            return loadDataSize(src.loadRef().beginParse());
        }
    }
}

export type SignedBundle = {
    $$type: 'SignedBundle';
    signature: Buffer;
    signedData: Slice;
}

export function storeSignedBundle(src: SignedBundle) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBuffer(src.signature);
        b_0.storeBuilder(src.signedData.asBuilder());
    };
}

export function loadSignedBundle(slice: Slice) {
    const sc_0 = slice;
    const _signature = sc_0.loadBuffer(64);
    const _signedData = sc_0;
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadGetterTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function storeTupleSignedBundle(source: SignedBundle) {
    const builder = new TupleBuilder();
    builder.writeBuffer(source.signature);
    builder.writeSlice(source.signedData.asCell());
    return builder.build();
}

export function dictValueParserSignedBundle(): DictionaryValue<SignedBundle> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSignedBundle(src)).endCell());
        },
        parse: (src) => {
            return loadSignedBundle(src.loadRef().beginParse());
        }
    }
}

export type StateInit = {
    $$type: 'StateInit';
    code: Cell;
    data: Cell;
}

export function storeStateInit(src: StateInit) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeRef(src.code);
        b_0.storeRef(src.data);
    };
}

export function loadStateInit(slice: Slice) {
    const sc_0 = slice;
    const _code = sc_0.loadRef();
    const _data = sc_0.loadRef();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadGetterTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function storeTupleStateInit(source: StateInit) {
    const builder = new TupleBuilder();
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    return builder.build();
}

export function dictValueParserStateInit(): DictionaryValue<StateInit> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStateInit(src)).endCell());
        },
        parse: (src) => {
            return loadStateInit(src.loadRef().beginParse());
        }
    }
}

export type Context = {
    $$type: 'Context';
    bounceable: boolean;
    sender: Address;
    value: bigint;
    raw: Slice;
}

export function storeContext(src: Context) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBit(src.bounceable);
        b_0.storeAddress(src.sender);
        b_0.storeInt(src.value, 257);
        b_0.storeRef(src.raw.asCell());
    };
}

export function loadContext(slice: Slice) {
    const sc_0 = slice;
    const _bounceable = sc_0.loadBit();
    const _sender = sc_0.loadAddress();
    const _value = sc_0.loadIntBig(257);
    const _raw = sc_0.loadRef().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadGetterTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function storeTupleContext(source: Context) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.bounceable);
    builder.writeAddress(source.sender);
    builder.writeNumber(source.value);
    builder.writeSlice(source.raw.asCell());
    return builder.build();
}

export function dictValueParserContext(): DictionaryValue<Context> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeContext(src)).endCell());
        },
        parse: (src) => {
            return loadContext(src.loadRef().beginParse());
        }
    }
}

export type SendParameters = {
    $$type: 'SendParameters';
    mode: bigint;
    body: Cell | null;
    code: Cell | null;
    data: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeSendParameters(src: SendParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        if (src.code !== null && src.code !== undefined) { b_0.storeBit(true).storeRef(src.code); } else { b_0.storeBit(false); }
        if (src.data !== null && src.data !== undefined) { b_0.storeBit(true).storeRef(src.data); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadSendParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _code = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _data = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleSendParameters(source: SendParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserSendParameters(): DictionaryValue<SendParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSendParameters(src)).endCell());
        },
        parse: (src) => {
            return loadSendParameters(src.loadRef().beginParse());
        }
    }
}

export type MessageParameters = {
    $$type: 'MessageParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeMessageParameters(src: MessageParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadMessageParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleMessageParameters(source: MessageParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserMessageParameters(): DictionaryValue<MessageParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMessageParameters(src)).endCell());
        },
        parse: (src) => {
            return loadMessageParameters(src.loadRef().beginParse());
        }
    }
}

export type DeployParameters = {
    $$type: 'DeployParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    bounce: boolean;
    init: StateInit;
}

export function storeDeployParameters(src: DeployParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeBit(src.bounce);
        b_0.store(storeStateInit(src.init));
    };
}

export function loadDeployParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _bounce = sc_0.loadBit();
    const _init = loadStateInit(sc_0);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadGetterTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadGetterTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function storeTupleDeployParameters(source: DeployParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeBoolean(source.bounce);
    builder.writeTuple(storeTupleStateInit(source.init));
    return builder.build();
}

export function dictValueParserDeployParameters(): DictionaryValue<DeployParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployParameters(src)).endCell());
        },
        parse: (src) => {
            return loadDeployParameters(src.loadRef().beginParse());
        }
    }
}

export type StdAddress = {
    $$type: 'StdAddress';
    workchain: bigint;
    address: bigint;
}

export function storeStdAddress(src: StdAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 8);
        b_0.storeUint(src.address, 256);
    };
}

export function loadStdAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(8);
    const _address = sc_0.loadUintBig(256);
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleStdAddress(source: StdAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeNumber(source.address);
    return builder.build();
}

export function dictValueParserStdAddress(): DictionaryValue<StdAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStdAddress(src)).endCell());
        },
        parse: (src) => {
            return loadStdAddress(src.loadRef().beginParse());
        }
    }
}

export type VarAddress = {
    $$type: 'VarAddress';
    workchain: bigint;
    address: Slice;
}

export function storeVarAddress(src: VarAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 32);
        b_0.storeRef(src.address.asCell());
    };
}

export function loadVarAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(32);
    const _address = sc_0.loadRef().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleVarAddress(source: VarAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeSlice(source.address.asCell());
    return builder.build();
}

export function dictValueParserVarAddress(): DictionaryValue<VarAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeVarAddress(src)).endCell());
        },
        parse: (src) => {
            return loadVarAddress(src.loadRef().beginParse());
        }
    }
}

export type BasechainAddress = {
    $$type: 'BasechainAddress';
    hash: bigint | null;
}

export function storeBasechainAddress(src: BasechainAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        if (src.hash !== null && src.hash !== undefined) { b_0.storeBit(true).storeInt(src.hash, 257); } else { b_0.storeBit(false); }
    };
}

export function loadBasechainAddress(slice: Slice) {
    const sc_0 = slice;
    const _hash = sc_0.loadBit() ? sc_0.loadIntBig(257) : null;
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadGetterTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function storeTupleBasechainAddress(source: BasechainAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.hash);
    return builder.build();
}

export function dictValueParserBasechainAddress(): DictionaryValue<BasechainAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBasechainAddress(src)).endCell());
        },
        parse: (src) => {
            return loadBasechainAddress(src.loadRef().beginParse());
        }
    }
}

export type ChangeOwner = {
    $$type: 'ChangeOwner';
    queryId: bigint;
    newOwner: Address;
}

export function storeChangeOwner(src: ChangeOwner) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2174598809, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.newOwner);
    };
}

export function loadChangeOwner(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2174598809) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _newOwner = sc_0.loadAddress();
    return { $$type: 'ChangeOwner' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadTupleChangeOwner(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwner' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadGetterTupleChangeOwner(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwner' as const, queryId: _queryId, newOwner: _newOwner };
}

export function storeTupleChangeOwner(source: ChangeOwner) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.newOwner);
    return builder.build();
}

export function dictValueParserChangeOwner(): DictionaryValue<ChangeOwner> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeChangeOwner(src)).endCell());
        },
        parse: (src) => {
            return loadChangeOwner(src.loadRef().beginParse());
        }
    }
}

export type ChangeOwnerOk = {
    $$type: 'ChangeOwnerOk';
    queryId: bigint;
    newOwner: Address;
}

export function storeChangeOwnerOk(src: ChangeOwnerOk) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(846932810, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.newOwner);
    };
}

export function loadChangeOwnerOk(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 846932810) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _newOwner = sc_0.loadAddress();
    return { $$type: 'ChangeOwnerOk' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadTupleChangeOwnerOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwnerOk' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadGetterTupleChangeOwnerOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwnerOk' as const, queryId: _queryId, newOwner: _newOwner };
}

export function storeTupleChangeOwnerOk(source: ChangeOwnerOk) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.newOwner);
    return builder.build();
}

export function dictValueParserChangeOwnerOk(): DictionaryValue<ChangeOwnerOk> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeChangeOwnerOk(src)).endCell());
        },
        parse: (src) => {
            return loadChangeOwnerOk(src.loadRef().beginParse());
        }
    }
}

export type AddAllowedAddress = {
    $$type: 'AddAllowedAddress';
    address: Address;
}

export function storeAddAllowedAddress(src: AddAllowedAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1, 32);
        b_0.storeAddress(src.address);
    };
}

export function loadAddAllowedAddress(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1) { throw Error('Invalid prefix'); }
    const _address = sc_0.loadAddress();
    return { $$type: 'AddAllowedAddress' as const, address: _address };
}

export function loadTupleAddAllowedAddress(source: TupleReader) {
    const _address = source.readAddress();
    return { $$type: 'AddAllowedAddress' as const, address: _address };
}

export function loadGetterTupleAddAllowedAddress(source: TupleReader) {
    const _address = source.readAddress();
    return { $$type: 'AddAllowedAddress' as const, address: _address };
}

export function storeTupleAddAllowedAddress(source: AddAllowedAddress) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.address);
    return builder.build();
}

export function dictValueParserAddAllowedAddress(): DictionaryValue<AddAllowedAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeAddAllowedAddress(src)).endCell());
        },
        parse: (src) => {
            return loadAddAllowedAddress(src.loadRef().beginParse());
        }
    }
}

export type RemoveAllowedAddress = {
    $$type: 'RemoveAllowedAddress';
    address: Address;
}

export function storeRemoveAllowedAddress(src: RemoveAllowedAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2, 32);
        b_0.storeAddress(src.address);
    };
}

export function loadRemoveAllowedAddress(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2) { throw Error('Invalid prefix'); }
    const _address = sc_0.loadAddress();
    return { $$type: 'RemoveAllowedAddress' as const, address: _address };
}

export function loadTupleRemoveAllowedAddress(source: TupleReader) {
    const _address = source.readAddress();
    return { $$type: 'RemoveAllowedAddress' as const, address: _address };
}

export function loadGetterTupleRemoveAllowedAddress(source: TupleReader) {
    const _address = source.readAddress();
    return { $$type: 'RemoveAllowedAddress' as const, address: _address };
}

export function storeTupleRemoveAllowedAddress(source: RemoveAllowedAddress) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.address);
    return builder.build();
}

export function dictValueParserRemoveAllowedAddress(): DictionaryValue<RemoveAllowedAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeRemoveAllowedAddress(src)).endCell());
        },
        parse: (src) => {
            return loadRemoveAllowedAddress(src.loadRef().beginParse());
        }
    }
}

export type SetSpendingLimit = {
    $$type: 'SetSpendingLimit';
    maxTransaction: bigint;
    dailyLimit: bigint;
}

export function storeSetSpendingLimit(src: SetSpendingLimit) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3, 32);
        b_0.storeCoins(src.maxTransaction);
        b_0.storeCoins(src.dailyLimit);
    };
}

export function loadSetSpendingLimit(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3) { throw Error('Invalid prefix'); }
    const _maxTransaction = sc_0.loadCoins();
    const _dailyLimit = sc_0.loadCoins();
    return { $$type: 'SetSpendingLimit' as const, maxTransaction: _maxTransaction, dailyLimit: _dailyLimit };
}

export function loadTupleSetSpendingLimit(source: TupleReader) {
    const _maxTransaction = source.readBigNumber();
    const _dailyLimit = source.readBigNumber();
    return { $$type: 'SetSpendingLimit' as const, maxTransaction: _maxTransaction, dailyLimit: _dailyLimit };
}

export function loadGetterTupleSetSpendingLimit(source: TupleReader) {
    const _maxTransaction = source.readBigNumber();
    const _dailyLimit = source.readBigNumber();
    return { $$type: 'SetSpendingLimit' as const, maxTransaction: _maxTransaction, dailyLimit: _dailyLimit };
}

export function storeTupleSetSpendingLimit(source: SetSpendingLimit) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.maxTransaction);
    builder.writeNumber(source.dailyLimit);
    return builder.build();
}

export function dictValueParserSetSpendingLimit(): DictionaryValue<SetSpendingLimit> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSetSpendingLimit(src)).endCell());
        },
        parse: (src) => {
            return loadSetSpendingLimit(src.loadRef().beginParse());
        }
    }
}

export type TransferTon = {
    $$type: 'TransferTon';
    to: Address;
    amount: bigint;
}

export function storeTransferTon(src: TransferTon) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(4, 32);
        b_0.storeAddress(src.to);
        b_0.storeCoins(src.amount);
    };
}

export function loadTransferTon(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 4) { throw Error('Invalid prefix'); }
    const _to = sc_0.loadAddress();
    const _amount = sc_0.loadCoins();
    return { $$type: 'TransferTon' as const, to: _to, amount: _amount };
}

export function loadTupleTransferTon(source: TupleReader) {
    const _to = source.readAddress();
    const _amount = source.readBigNumber();
    return { $$type: 'TransferTon' as const, to: _to, amount: _amount };
}

export function loadGetterTupleTransferTon(source: TupleReader) {
    const _to = source.readAddress();
    const _amount = source.readBigNumber();
    return { $$type: 'TransferTon' as const, to: _to, amount: _amount };
}

export function storeTupleTransferTon(source: TransferTon) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.to);
    builder.writeNumber(source.amount);
    return builder.build();
}

export function dictValueParserTransferTon(): DictionaryValue<TransferTon> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTransferTon(src)).endCell());
        },
        parse: (src) => {
            return loadTransferTon(src.loadRef().beginParse());
        }
    }
}

export type PolicyInfo = {
    $$type: 'PolicyInfo';
    maxTransaction: bigint;
    dailyLimit: bigint;
    spentToday: bigint;
    lastResetTime: bigint;
}

export function storePolicyInfo(src: PolicyInfo) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeCoins(src.maxTransaction);
        b_0.storeCoins(src.dailyLimit);
        b_0.storeCoins(src.spentToday);
        b_0.storeUint(src.lastResetTime, 32);
    };
}

export function loadPolicyInfo(slice: Slice) {
    const sc_0 = slice;
    const _maxTransaction = sc_0.loadCoins();
    const _dailyLimit = sc_0.loadCoins();
    const _spentToday = sc_0.loadCoins();
    const _lastResetTime = sc_0.loadUintBig(32);
    return { $$type: 'PolicyInfo' as const, maxTransaction: _maxTransaction, dailyLimit: _dailyLimit, spentToday: _spentToday, lastResetTime: _lastResetTime };
}

export function loadTuplePolicyInfo(source: TupleReader) {
    const _maxTransaction = source.readBigNumber();
    const _dailyLimit = source.readBigNumber();
    const _spentToday = source.readBigNumber();
    const _lastResetTime = source.readBigNumber();
    return { $$type: 'PolicyInfo' as const, maxTransaction: _maxTransaction, dailyLimit: _dailyLimit, spentToday: _spentToday, lastResetTime: _lastResetTime };
}

export function loadGetterTuplePolicyInfo(source: TupleReader) {
    const _maxTransaction = source.readBigNumber();
    const _dailyLimit = source.readBigNumber();
    const _spentToday = source.readBigNumber();
    const _lastResetTime = source.readBigNumber();
    return { $$type: 'PolicyInfo' as const, maxTransaction: _maxTransaction, dailyLimit: _dailyLimit, spentToday: _spentToday, lastResetTime: _lastResetTime };
}

export function storeTuplePolicyInfo(source: PolicyInfo) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.maxTransaction);
    builder.writeNumber(source.dailyLimit);
    builder.writeNumber(source.spentToday);
    builder.writeNumber(source.lastResetTime);
    return builder.build();
}

export function dictValueParserPolicyInfo(): DictionaryValue<PolicyInfo> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storePolicyInfo(src)).endCell());
        },
        parse: (src) => {
            return loadPolicyInfo(src.loadRef().beginParse());
        }
    }
}

export type AgentWallet$Data = {
    $$type: 'AgentWallet$Data';
    owner: Address;
    allowedAddresses: Dictionary<Address, boolean>;
    maxTransaction: bigint;
    dailyLimit: bigint;
    spentToday: bigint;
    lastResetTime: bigint;
}

export function storeAgentWallet$Data(src: AgentWallet$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeDict(src.allowedAddresses, Dictionary.Keys.Address(), Dictionary.Values.Bool());
        b_0.storeCoins(src.maxTransaction);
        b_0.storeCoins(src.dailyLimit);
        b_0.storeCoins(src.spentToday);
        b_0.storeUint(src.lastResetTime, 32);
    };
}

export function loadAgentWallet$Data(slice: Slice) {
    const sc_0 = slice;
    const _owner = sc_0.loadAddress();
    const _allowedAddresses = Dictionary.load(Dictionary.Keys.Address(), Dictionary.Values.Bool(), sc_0);
    const _maxTransaction = sc_0.loadCoins();
    const _dailyLimit = sc_0.loadCoins();
    const _spentToday = sc_0.loadCoins();
    const _lastResetTime = sc_0.loadUintBig(32);
    return { $$type: 'AgentWallet$Data' as const, owner: _owner, allowedAddresses: _allowedAddresses, maxTransaction: _maxTransaction, dailyLimit: _dailyLimit, spentToday: _spentToday, lastResetTime: _lastResetTime };
}

export function loadTupleAgentWallet$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _allowedAddresses = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.Bool(), source.readCellOpt());
    const _maxTransaction = source.readBigNumber();
    const _dailyLimit = source.readBigNumber();
    const _spentToday = source.readBigNumber();
    const _lastResetTime = source.readBigNumber();
    return { $$type: 'AgentWallet$Data' as const, owner: _owner, allowedAddresses: _allowedAddresses, maxTransaction: _maxTransaction, dailyLimit: _dailyLimit, spentToday: _spentToday, lastResetTime: _lastResetTime };
}

export function loadGetterTupleAgentWallet$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _allowedAddresses = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.Bool(), source.readCellOpt());
    const _maxTransaction = source.readBigNumber();
    const _dailyLimit = source.readBigNumber();
    const _spentToday = source.readBigNumber();
    const _lastResetTime = source.readBigNumber();
    return { $$type: 'AgentWallet$Data' as const, owner: _owner, allowedAddresses: _allowedAddresses, maxTransaction: _maxTransaction, dailyLimit: _dailyLimit, spentToday: _spentToday, lastResetTime: _lastResetTime };
}

export function storeTupleAgentWallet$Data(source: AgentWallet$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeCell(source.allowedAddresses.size > 0 ? beginCell().storeDictDirect(source.allowedAddresses, Dictionary.Keys.Address(), Dictionary.Values.Bool()).endCell() : null);
    builder.writeNumber(source.maxTransaction);
    builder.writeNumber(source.dailyLimit);
    builder.writeNumber(source.spentToday);
    builder.writeNumber(source.lastResetTime);
    return builder.build();
}

export function dictValueParserAgentWallet$Data(): DictionaryValue<AgentWallet$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeAgentWallet$Data(src)).endCell());
        },
        parse: (src) => {
            return loadAgentWallet$Data(src.loadRef().beginParse());
        }
    }
}

 type AgentWallet_init_args = {
    $$type: 'AgentWallet_init_args';
    owner: Address;
    maxTransaction: bigint;
    dailyLimit: bigint;
}

function initAgentWallet_init_args(src: AgentWallet_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeInt(src.maxTransaction, 257);
        b_0.storeInt(src.dailyLimit, 257);
    };
}

async function AgentWallet_init(owner: Address, maxTransaction: bigint, dailyLimit: bigint) {
    const __code = Cell.fromHex('b5ee9c724102170100040700022cff008e88f4a413f4bcf2c80bed53208e8130e1ed43d9010c02027102040175be28ef6a268690000c7087d207a027d007d007d00698faaa8360b470cfd20408080eb80408080eb802a9001e8ac36b87c1188120811f16d9e3630c03000225020120050a02012006080175b6d81da89a1a400031c21f481e809f401f401f401a63eaaa0d82d1c33f481020203ae01020203ae00aa4007a2b0dae1f04620482047c5b678d8c30070008f8276f100175b7cdfda89a1a400031c21f481e809f401f401f401a63eaaa0d82d1c33f481020203ae01020203ae00aa4007a2b0dae1f04620482047c5b678d8c90090008547321230179ba958ed44d0d200018e10fa40f404fa00fa00fa00d31f55506c168e19fa40810101d700810101d700552003d1586d70f82310241023e25505db3c6c6180b001681010b260259f40a6fa13104e001d072d721d200d200fa4021103450666f04f86102f862ed44d0d200018e10fa40f404fa00fa00fa00d31f55506c168e19fa40810101d700810101d700552003d1586d70f82310241023e207925f07e07026d74920c21f953106d31f07de21c001e30221c002e30221c003e30221c0040d0e0f10018a5b05fa4030104510344136db3c1481010b50077f71216e955b59f4593098c801cf004133f441e2044135c87f01ca0055505056ce13f40001fa0201fa0201fa02cb1fc9ed541501685b05fa4030104510344136db3c506481010bf4593004415503c87f01ca0055505056ce13f40001fa0201fa0201fa02cb1fc9ed5415017e5b05fa00fa00305067db3c6c2281608025c200f2f48200b18226c200f2f4103510241023c87f01ca0055505056ce13f40001fa0201fa0201fa02cb1fc9ed541503fae302218210819dbe99ba8ee15b05d33ffa40305067db3c355156c8598210327b2b4a5003cb1fcb3fcec91035443012f8427f705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb00c87f01ca0055505056ce13f40001fa0201fa0201fa02cb1fc9ed54e037c00006c12116b0e3025f06f2c08211151603fc5b05fa40fa0030f8425306c70581010b54471359f40a6fa1318200a5c32292317f9101e2f2f48200eecf22c200f2f48200d557f8276f10820afaf080a15230bbf2f48e2a8200ec515314bbf2f4f82328a182015180be98363670f823507706de816ee25371a024bbf2f45166a006df73885a6d6d40037fc8cf8580ca00891213140024000000006167656e742d7472616e736665720001100090cf16ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0010355512c87f01ca0055505056ce13f40001fa0201fa0201fa02cb1fc9ed540010f84226c705f2e084003e10355512c87f01ca0055505056ce13f40001fa0201fa0201fa02cb1fc9ed547dd93ad4');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initAgentWallet_init_args({ $$type: 'AgentWallet_init_args', owner, maxTransaction, dailyLimit })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

export const AgentWallet_errors = {
    2: { message: "Stack underflow" },
    3: { message: "Stack overflow" },
    4: { message: "Integer overflow" },
    5: { message: "Integer out of expected range" },
    6: { message: "Invalid opcode" },
    7: { message: "Type check error" },
    8: { message: "Cell overflow" },
    9: { message: "Cell underflow" },
    10: { message: "Dictionary error" },
    11: { message: "'Unknown' error" },
    12: { message: "Fatal error" },
    13: { message: "Out of gas error" },
    14: { message: "Virtualization error" },
    32: { message: "Action list is invalid" },
    33: { message: "Action list is too long" },
    34: { message: "Action is invalid or not supported" },
    35: { message: "Invalid source address in outbound message" },
    36: { message: "Invalid destination address in outbound message" },
    37: { message: "Not enough Toncoin" },
    38: { message: "Not enough extra currencies" },
    39: { message: "Outbound message does not fit into a cell after rewriting" },
    40: { message: "Cannot process a message" },
    41: { message: "Library reference is null" },
    42: { message: "Library change action error" },
    43: { message: "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree" },
    50: { message: "Account state size exceeded limits" },
    128: { message: "Null reference exception" },
    129: { message: "Invalid serialization prefix" },
    130: { message: "Invalid incoming message" },
    131: { message: "Constraints error" },
    132: { message: "Access denied" },
    133: { message: "Contract stopped" },
    134: { message: "Invalid argument" },
    135: { message: "Code of a contract was not found" },
    136: { message: "Invalid standard address" },
    138: { message: "Not a basechain address" },
    24704: { message: "Max transaction must be positive" },
    28386: { message: "Daily spending limit exceeded" },
    42435: { message: "Not authorized" },
    45442: { message: "Daily limit must be positive" },
    54615: { message: "Insufficient balance" },
    60497: { message: "Exceeds max transaction limit" },
    61135: { message: "Amount must be positive" },
} as const

export const AgentWallet_errors_backward = {
    "Stack underflow": 2,
    "Stack overflow": 3,
    "Integer overflow": 4,
    "Integer out of expected range": 5,
    "Invalid opcode": 6,
    "Type check error": 7,
    "Cell overflow": 8,
    "Cell underflow": 9,
    "Dictionary error": 10,
    "'Unknown' error": 11,
    "Fatal error": 12,
    "Out of gas error": 13,
    "Virtualization error": 14,
    "Action list is invalid": 32,
    "Action list is too long": 33,
    "Action is invalid or not supported": 34,
    "Invalid source address in outbound message": 35,
    "Invalid destination address in outbound message": 36,
    "Not enough Toncoin": 37,
    "Not enough extra currencies": 38,
    "Outbound message does not fit into a cell after rewriting": 39,
    "Cannot process a message": 40,
    "Library reference is null": 41,
    "Library change action error": 42,
    "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree": 43,
    "Account state size exceeded limits": 50,
    "Null reference exception": 128,
    "Invalid serialization prefix": 129,
    "Invalid incoming message": 130,
    "Constraints error": 131,
    "Access denied": 132,
    "Contract stopped": 133,
    "Invalid argument": 134,
    "Code of a contract was not found": 135,
    "Invalid standard address": 136,
    "Not a basechain address": 138,
    "Max transaction must be positive": 24704,
    "Daily spending limit exceeded": 28386,
    "Not authorized": 42435,
    "Daily limit must be positive": 45442,
    "Insufficient balance": 54615,
    "Exceeds max transaction limit": 60497,
    "Amount must be positive": 61135,
} as const

const AgentWallet_types: ABIType[] = [
    {"name":"DataSize","header":null,"fields":[{"name":"cells","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bits","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"refs","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"SignedBundle","header":null,"fields":[{"name":"signature","type":{"kind":"simple","type":"fixed-bytes","optional":false,"format":64}},{"name":"signedData","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"StateInit","header":null,"fields":[{"name":"code","type":{"kind":"simple","type":"cell","optional":false}},{"name":"data","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"Context","header":null,"fields":[{"name":"bounceable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"raw","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"SendParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"code","type":{"kind":"simple","type":"cell","optional":true}},{"name":"data","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"MessageParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"DeployParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}},{"name":"init","type":{"kind":"simple","type":"StateInit","optional":false}}]},
    {"name":"StdAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":8}},{"name":"address","type":{"kind":"simple","type":"uint","optional":false,"format":256}}]},
    {"name":"VarAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":32}},{"name":"address","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"BasechainAddress","header":null,"fields":[{"name":"hash","type":{"kind":"simple","type":"int","optional":true,"format":257}}]},
    {"name":"ChangeOwner","header":2174598809,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"newOwner","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"ChangeOwnerOk","header":846932810,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"newOwner","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"AddAllowedAddress","header":1,"fields":[{"name":"address","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"RemoveAllowedAddress","header":2,"fields":[{"name":"address","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"SetSpendingLimit","header":3,"fields":[{"name":"maxTransaction","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"dailyLimit","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"TransferTon","header":4,"fields":[{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"PolicyInfo","header":null,"fields":[{"name":"maxTransaction","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"dailyLimit","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"spentToday","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"lastResetTime","type":{"kind":"simple","type":"uint","optional":false,"format":32}}]},
    {"name":"AgentWallet$Data","header":null,"fields":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"allowedAddresses","type":{"kind":"dict","key":"address","value":"bool"}},{"name":"maxTransaction","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"dailyLimit","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"spentToday","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"lastResetTime","type":{"kind":"simple","type":"uint","optional":false,"format":32}}]},
]

const AgentWallet_opcodes = {
    "ChangeOwner": 2174598809,
    "ChangeOwnerOk": 846932810,
    "AddAllowedAddress": 1,
    "RemoveAllowedAddress": 2,
    "SetSpendingLimit": 3,
    "TransferTon": 4,
}

const AgentWallet_getters: ABIGetter[] = [
    {"name":"balance","methodId":104128,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"isAllowed","methodId":125272,"arguments":[{"name":"addr","type":{"kind":"simple","type":"address","optional":false}}],"returnType":{"kind":"simple","type":"bool","optional":false}},
    {"name":"policyInfo","methodId":114287,"arguments":[],"returnType":{"kind":"simple","type":"PolicyInfo","optional":false}},
    {"name":"owner","methodId":83229,"arguments":[],"returnType":{"kind":"simple","type":"address","optional":false}},
]

export const AgentWallet_getterMapping: { [key: string]: string } = {
    'balance': 'getBalance',
    'isAllowed': 'getIsAllowed',
    'policyInfo': 'getPolicyInfo',
    'owner': 'getOwner',
}

const AgentWallet_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"empty"}},
    {"receiver":"internal","message":{"kind":"typed","type":"AddAllowedAddress"}},
    {"receiver":"internal","message":{"kind":"typed","type":"RemoveAllowedAddress"}},
    {"receiver":"internal","message":{"kind":"typed","type":"SetSpendingLimit"}},
    {"receiver":"internal","message":{"kind":"typed","type":"TransferTon"}},
    {"receiver":"internal","message":{"kind":"typed","type":"ChangeOwner"}},
]


export class AgentWallet implements Contract {
    
    public static readonly storageReserve = 0n;
    public static readonly errors = AgentWallet_errors_backward;
    public static readonly opcodes = AgentWallet_opcodes;
    
    static async init(owner: Address, maxTransaction: bigint, dailyLimit: bigint) {
        return await AgentWallet_init(owner, maxTransaction, dailyLimit);
    }
    
    static async fromInit(owner: Address, maxTransaction: bigint, dailyLimit: bigint) {
        const __gen_init = await AgentWallet_init(owner, maxTransaction, dailyLimit);
        const address = contractAddress(0, __gen_init);
        return new AgentWallet(address, __gen_init);
    }
    
    static fromAddress(address: Address) {
        return new AgentWallet(address);
    }
    
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types:  AgentWallet_types,
        getters: AgentWallet_getters,
        receivers: AgentWallet_receivers,
        errors: AgentWallet_errors,
    };
    
    constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: null | AddAllowedAddress | RemoveAllowedAddress | SetSpendingLimit | TransferTon | ChangeOwner) {
        
        let body: Cell | null = null;
        if (message === null) {
            body = new Cell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'AddAllowedAddress') {
            body = beginCell().store(storeAddAllowedAddress(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'RemoveAllowedAddress') {
            body = beginCell().store(storeRemoveAllowedAddress(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'SetSpendingLimit') {
            body = beginCell().store(storeSetSpendingLimit(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'TransferTon') {
            body = beginCell().store(storeTransferTon(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'ChangeOwner') {
            body = beginCell().store(storeChangeOwner(message)).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
    async getBalance(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('balance', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getIsAllowed(provider: ContractProvider, addr: Address) {
        const builder = new TupleBuilder();
        builder.writeAddress(addr);
        const source = (await provider.get('isAllowed', builder.build())).stack;
        const result = source.readBoolean();
        return result;
    }
    
    async getPolicyInfo(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('policyInfo', builder.build())).stack;
        const result = loadGetterTuplePolicyInfo(source);
        return result;
    }
    
    async getOwner(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('owner', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
}