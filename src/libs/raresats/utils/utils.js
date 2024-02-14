import * as bitcoin from "bitcoinjs-lib";

const mainnet = bitcoin.networks.bitcoin;


export function getAddressType(address) {
    let type = "unknown";
    
    try {
        let res = bitcoin.address.fromBech32(address);
        if (res) {
            if (res.version == 1) {
                type = "p2tr";
            }
            else if (res.version == 0) {
                if (res.data.length == 20) {
                    type = "p2wpkh";
                }
                else if (res.data.length == 32) {
                    type = "p2wsh";
                }
            }
        }
    } catch (e) {}

    try {
        let res = bitcoin.address.fromBase58Check(address);
        if (res) {
            if (res.version == 5) {
                type = "p2sh";
            }
            else if (res.version == 0) {
                type = "p2pkh";
            }
        }
    } catch (e) {}

    return type;
}

function _estimateTxSize(inputsTypesCount, outputsTypesCount) {
    const segwitTypes = ["p2wpkh", "p2wsh", "p2tr"];

    const isSegwitTx = segwitTypes.some(type => type in inputsTypesCount);

    const baseSize = 4 + 1 + 1 + 4 + (isSegwitTx ? 0.5 : 0);

    // Just taproot because the wallet is 100% taproot
    // Just key path for the same reason
    const inputTypeToSize = { "p2tr": 36 + 1 + 4 + 0.25 + 16.25 };

    const outputTypeToSize = {
        "p2pkh": 8 + 1 + 25,
        "p2sh": 8 + 1 + 23,
        "p2wpkh": 8 + 1 + 22,
        "p2wsh": 8 + 1 + 34,
        "p2tr": 8 + 1 + 34
    };

    let totalInputSize = Object.entries(inputTypeToSize).reduce((acc, [type, size]) => acc + inputsTypesCount[type] * size, 0);
    let totalOutputSize = Object.entries(outputTypeToSize).reduce((acc, [type, size]) => acc + outputsTypesCount[type] * size, 0);

    return baseSize + totalInputSize + totalOutputSize;
}

export function estimateTxSize(psbt) {
    let inputsTypesCount = {
        "p2pkh": 0,
        "p2sh": 0,
        "p2wpkh": 0,
        "p2wsh": 0,
        "p2tr": 0,
        "unknown": 0
    };
    let outputsTypesCount = {...inputsTypesCount};

    psbt.data.inputs.forEach(input => {
        let address = bitcoin.address.fromOutputScript(input.witnessUtxo.script, mainnet);
        let type = getAddressType(address);
        inputsTypesCount[type] += 1;
    });
    
    psbt.txOutputs.forEach(output => {
        let address = output.address;
        let type = getAddressType(address);
        outputsTypesCount[type] += 1;
    });

    if (inputsTypesCount["unknown"] > 0 || outputsTypesCount["unknown"] > 0) {
        throw new Error("Unknown input or output address type");
    }

    delete inputsTypesCount["unknown"];
    delete outputsTypesCount["unknown"];
    
    return _estimateTxSize(inputsTypesCount, outputsTypesCount);
}

export function printPSBT(psbt) {
    let n = Math.max(psbt.data.inputs.length, psbt.txOutputs.length);
    for(let i = 0; i < n; i++) {
        let inputExists = i < psbt.data.inputs.length;
        let outputExists = i < psbt.txOutputs.length;
        let pad = " ".repeat(8);
        let inputString = "";
        let outputString = "";
        if (inputExists) {
            let input = psbt.data.inputs[i];
            let inputAddress = bitcoin.address.fromOutputScript(input.witnessUtxo.script, mainnet);
            let inputValue = input.witnessUtxo.value;
            inputString = `[${(pad + i).slice(-2)}] ${inputAddress.slice(0, 10)}...${inputAddress.slice(-10) } (${(pad + inputValue).slice(-8)} sats) || `;
        }
        if (outputExists) {
            let output = psbt.txOutputs[i];
            let outputAddress = bitcoin.address.fromOutputScript(output.script, mainnet);
            let outputValue = output.value;
            outputString = `(${(pad + outputValue).slice(-8)} sats) ${outputAddress.slice(0, 10)}...${outputAddress.slice(-10)}`;
            let padding = ""
            if (!inputExists) {
                padding = " ".repeat(outputString.length + 6) + "|| ";
            }
            outputString = padding + outputString;
        }
        console.log(inputString + outputString);
    }
}
