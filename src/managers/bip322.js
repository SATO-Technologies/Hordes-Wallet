import * as bip39 from 'bip39';
import { bip32, ECPair } from 'managers/ecc.tsx';
import * as bitcoin from 'bitcoinjs-lib';
import { toXOnly } from 'bitcoinjs-lib/src/psbt/bip371.js';
import { Hash } from 'fast-sha256';

const checkPubKeyCorrespondToAddress = (publicKey, signingAddress) => {
  let address = bitcoin.payments.p2tr({ internalPubkey: toXOnly(publicKey) }).address;
  return address == signingAddress;
}

const convertAdressToScriptPubkey = (address) => {
  return bitcoin.payments.p2tr({ address: address }).output;
}

const hashMessage = (message) => {
  const tagHasher = new Hash();
  tagHasher.update(Buffer.from('BIP0322-signed-message'));
  const tagHash = tagHasher.digest();
  const messageHasher = new Hash();
  messageHasher.update(tagHash);
  messageHasher.update(tagHash);
  messageHasher.update(Buffer.from(message));
  const messageHash = messageHasher.digest();
  return messageHash;
}

const buildSpendTx = (message, scriptPublicKey) => {

  /* init PSBT */
  const psbt = new bitcoin.Psbt();

  psbt.setVersion(0);
  psbt.setLocktime(0);

  const messageHash = hashMessage(message);

  const scriptSigPartOne = new Uint8Array([0x00, 0x20]);
  const scriptSig = new Uint8Array(scriptSigPartOne.length + messageHash.length);
  scriptSig.set(scriptSigPartOne);
  scriptSig.set(messageHash, scriptSigPartOne.length);

  /* inputs */
  psbt.addInput({
    hash: '0'.repeat(64),
    index: 0xFFFFFFFF,
    sequence: 0,
    finalScriptSig: Buffer.from(scriptSig),
    witnessScript: Buffer.from([])
  });

  /* outputs */
  psbt.addOutput({
    value: 0,
    script: scriptPublicKey
  });

  /* return tx */
  return psbt.extractTransaction();

}

const buildSignPsbt = (spendTxId, witnessScript, tapInternalKey) => {

  /* init PSBT */
  const psbt = new bitcoin.Psbt();

  psbt.setVersion(0);
  psbt.setLocktime(0);

  /* inputs */
  psbt.addInput({
    hash: spendTxId,
    index: 0,
    sequence: 0,
    witnessUtxo: {
      script: witnessScript,
      value: 0
    }
  });

  if( tapInternalKey ) {
    psbt.updateInput(0, {
      tapInternalKey: tapInternalKey
    });
  }

  /* outputs */
  psbt.addOutput({
    value: 0,
    script: Buffer.from([0x6a])
  });

  psbt.updateInput(0, {
    sighashType: bitcoin.Transaction.SIGHASH_ALL
  });

  return psbt;
}

export default {

  signMessage: ({ wif, address, message }) => {

    let signer = ECPair.fromWIF(wif);
    if( checkPubKeyCorrespondToAddress(signer.publicKey, address) ) {
      const scriptPubKey = convertAdressToScriptPubkey(address);
      const spendTx = buildSpendTx(message, scriptPubKey);
      const internalPublicKey = Buffer.from(signer.publicKey.subarray(1, 33));
      signer = signer.tweak(bitcoin.crypto.taggedHash('TapTweak', signer.publicKey.subarray(1, 33)));
      const psbt = buildSignPsbt(spendTx.getId(), scriptPubKey, internalPublicKey);
      return psbt.toBase64();
    }

    return null;

  }

}
