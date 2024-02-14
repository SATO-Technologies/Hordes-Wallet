/* modules */
import * as bitcoin from 'bitcoinjs-lib';

/* managers */
import mempoolApi from './mempool';

function getAddressType(address) {
  let type = 'unknown';
  try {
    let res = bitcoin.address.fromBech32(address);
    if( res ) {
      if( res.version == 1 ) {
        type = 'p2tr';
      } else if( res.version == 0 ) {
        if( res.data.length == 20 ) {
          type = 'p2wpkh';
        } else if( res.data.length == 32 ) {
          type = "p2wsh";
        }
      }
    }
  } catch { }
  try {
    let res = bitcoin.address.fromBase58Check(address);
    if( res ) {
      if( res.version == 5 ) {
        type = 'p2sh';
      } else if (res.version == 0) {
        type = 'p2pkh';
      }
    }
  } catch { }
  return type;
}

export function calculateChangeValue({ inputs, outputs, fee }) {
  let inputsValue = 0;
  let outputsValue = 0;
  inputs.forEach((input, index) => {
    inputsValue += input.witnessUtxo.value;
  });
  outputs.forEach((output, index) => {
    outputsValue += output.value;
  });
  return inputsValue - outputsValue - fee;
}

export function estimatePsbtSize({ inputs, outputs, addChangeOutput = true }) {
  let inputsTypesCount = {
    p2pkh: 0,
    p2sh: 0,
    p2wpkh: 0,
    p2wsh: 0,
    p2tr: 0,
    unknown: 0
  }
  let outputsTypesCount = { ...inputsTypesCount };
  if( addChangeOutput == true ) outputsTypesCount.p2tr = 1;

  inputs.forEach((input, index) => {
    let address = bitcoin.address.fromOutputScript(input.witnessUtxo.script, bitcoin.networks[global.network]);
    let type = getAddressType(address);
    inputsTypesCount[type] += 1;
  });

  outputs.forEach((output, index) => {
    let type = getAddressType(output.address);
    outputsTypesCount[type] += 1;
  });

  if( inputsTypesCount.unknown > 0 || outputsTypesCount.unknown > 0) {
    return -1;
  }
  delete inputsTypesCount.unknown;
  delete outputsTypesCount.unknown;

  const segwitTypes = ['p2wpkh', 'p2wsh', 'p2tr'];
  let isSegwitTx = false;
  for( let type of segwitTypes ) {
    if( type in inputsTypesCount ) {
      isSegwitTx = true;
      break;
    }
  }

  const baseSize = 4 + 1 + 1 + 4 + (isSegwitTx ? 0.5 : 0);
  const inputTypeToSize = {
    p2tr: 36 + 1 + 4 + 0.25 + 16.25
  }
  const outputTypeToSize = {
    p2pkh: 8 + 1 + 25,
    p2sh: 8 + 1 + 23,
    p2wpkh: 8 + 1 + 22,
    p2wsh: 8 + 1 + 34,
    p2tr: 8 + 1 + 34
  }

  return parseInt(baseSize + Object.entries(inputTypeToSize).reduce((acc, [type, size]) => acc + inputsTypesCount[type] * size, 0) + Object.entries(outputTypeToSize).reduce((acc, [type, size]) => acc + outputsTypesCount[type] * size, 0));
}

export async function estimateStandardPsbtSize({ fundsUtxos, address }) {

  /* init PSBT */
  const psbt = new bitcoin.Psbt({ network: bitcoin.networks[global.network] });

  /* inputs */
  for( const fundsUtxo of fundsUtxos ) {
    try {
      const fundsTx = bitcoin.Transaction.fromHex(await mempoolApi.getTxHexById({ txid: fundsUtxo.txid }));
      for( const output in fundsTx.outs ) {
        try { fundsTx.setWitness(parseInt(output), []) } catch { };
      }
      psbt.addInput({
        hash: fundsUtxo.txid,
        index: fundsUtxo.vout,
        nonWitnessUtxo: fundsTx.toBuffer(),
        witnessUtxo: fundsTx.outs[fundsUtxo.vout]
      });
    } catch { }
  }

  /* outputs */
  psbt.addOutput({
    address: address,
    value: 546
  });

  return estimatePsbtSize({ inputs: psbt.data.inputs, outputs: psbt.txOutputs });

}
