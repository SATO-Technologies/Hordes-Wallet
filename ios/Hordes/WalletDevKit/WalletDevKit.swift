//
//  WalletDevKit.swift
//  SATO
//
//  Created by Damian Di Zeo on 22/11/2022.
//

import Foundation
import BitcoinDevKit

@objc(WalletDevKit)
class WalletDevKit: NSObject {
  
  //MARK: BitcoinDevKit variables
  var wallets: [[String: Any]] = []
  var blockchain: Blockchain?
  var network = Network.testnet
  
  //MARK: Init
  override init() {
    
  }
  
  //MARK: Private methods
  func getWallet(for walletId: String) -> Wallet? {
    let filteredWallet = self.wallets.filter { obj in
      if let objWalletId = obj["id"] as? String, objWalletId == walletId {
        return true
      }
      return false
    }
    return filteredWallet.first?["wallet"] as? Wallet
  }
  
  //MARK: BitcoinDevKit methods
  @objc
  func setNetwork(_ network: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    switch network {
      case "testnet":
        self.network = .testnet
        break
      case "bitcoin":
        self.network = .bitcoin
        break
      case "regtest":
        self.network = .regtest
        break
      case "signet":
        self.network = .signet
        break
      default:
        break
    }
    resolve(true)
  }
  
  @objc
  func setBlockchain(_ type: String, url: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      switch type {
      case "electrum":
        if self.blockchain == nil {
          let electrumConfig = ElectrumConfig(url: self.network == .bitcoin ? "ssl://electrum.blockstream.info:50002" : "ssl://electrum.blockstream.info:60002", socks5: nil, retry: 5, timeout: 5, stopGap: 10, validateDomain: true)
          let blockchainConfig = BlockchainConfig.electrum(config: electrumConfig)
          self.blockchain = try Blockchain(config: blockchainConfig)
        }
        resolve(true)
      default:
        let error = NSError(domain: "", code: 2, userInfo: [NSLocalizedDescriptionKey : "type \(type) is not supported"])
        reject("Set Blockchain Error", error.localizedDescription, error)
        break
      }
    } catch {
      reject("Set Blockchain Error", error.localizedDescription, error)
    }
  }
  
  @objc
  func createExtendedKey(_ wordCount: NSNumber, password: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let mnemonicObject = Mnemonic(wordCount: parseWordCount(wordCount))
    let descriptor = DescriptorSecretKey(network: self.network, mnemonic: mnemonicObject, password: password)
    resolve(descriptor.asString())
  }
  
  @objc
  func importExtendedKey(_ mnemonic: String, password: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      let mnemonicObject = try Mnemonic.fromString(mnemonic: mnemonic)
      let descriptor = DescriptorSecretKey(network: self.network, mnemonic: mnemonicObject, password: password)
      resolve(descriptor.asString())
    } catch {
      reject("Restore Extended Key Error", error.localizedDescription, error)
    }
  }
  
  @objc
  func createWallet(_ id: String, descriptor: String, changeDescriptor: String, databaseConfig: String, databasePath: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      let dbStoragePath = URL(fileURLWithPath: databasePath)
      if !FileManager().fileExists(atPath: dbStoragePath.path) {
        try FileManager.default.createDirectory(atPath: dbStoragePath.path, withIntermediateDirectories: true, attributes: nil)
      }
      let wallet = try Wallet.init(descriptor: Descriptor(descriptor: descriptor, network: self.network), changeDescriptor: Descriptor(descriptor: changeDescriptor, network: self.network), network: self.network, databaseConfig: parseDatabaseConfig(databaseConfig, path: "\(dbStoragePath.path)/\(id)-db"))
      self.wallets.append([
        "id": id,
        "wallet": wallet
      ])
      resolve(true)
    } catch {
      reject("Create Wallet Error", error.localizedDescription, error)
    }
  }
  
  @objc
  func sync(_ walletId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      guard let blockchain = self.blockchain else {
        let error = NSError(domain: "", code: 2, userInfo: [NSLocalizedDescriptionKey : "blockchain is not configured"])
        reject("Sync Error", error.localizedDescription, error)
        return
      }
      guard let wallet = self.getWallet(for: walletId) else {
        let error = NSError(domain: "", code: 2, userInfo: [NSLocalizedDescriptionKey : "sync index not found"])
        reject("Wallet Not Exists Error", error.localizedDescription, error)
        return
      }
      try wallet.sync(blockchain: blockchain, progress: nil)
      resolve(true)
    } catch {
      reject("Sync Error", error.localizedDescription, error)
    }
  }
  
  @objc
  func getAddress(_ walletId: String, addressIndex: String, isExternal: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let wallet = self.getWallet(for: walletId) else {
      let error = NSError(domain: "", code: 2, userInfo: [NSLocalizedDescriptionKey : "getAddress index not found"])
      reject("Wallet Not Exists Error", error.localizedDescription, error)
      return
    }
    do {
      let address = try (isExternal == true ? wallet.getAddress(addressIndex: parseAddressIndex(addressIndex)) : wallet.getInternalAddress(addressIndex: parseAddressIndex(addressIndex)))
      let response = [
        "address": address.address.asString(),
        "index": address.index
      ] as [String : Any]
      resolve(response)
    } catch {
      reject("Get Address Error", error.localizedDescription, error)
    }
  }
  
  @objc
  func getAddressByIndex(_ walletId: String, index: NSNumber, isExternal: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let wallet = self.getWallet(for: walletId) else {
      let error = NSError(domain: "", code: 2, userInfo: [NSLocalizedDescriptionKey : "getAddress index not found"])
      reject("Wallet Not Exists Error", error.localizedDescription, error)
      return
    }
    do {
      let address = try (isExternal == true ? wallet.getAddress(addressIndex: AddressIndex.peek(index: index.uint32Value)) : wallet.getInternalAddress(addressIndex: AddressIndex.peek(index: index.uint32Value)))
      let response = [
        "address": address.address.asString(),
        "index": address.index
      ] as [String : Any]
      resolve(response)
    } catch {
      reject("Get Address Error", error.localizedDescription, error)
    }
  }
  
  @objc
  func getBalance(_ walletId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      guard let wallet = self.getWallet(for: walletId) else {
        let error = NSError(domain: "", code: 2, userInfo: [NSLocalizedDescriptionKey : "getBalance index not found"])
        reject("Wallet Not Exists Error", error.localizedDescription, error)
        return
      }
      let balance = try wallet.getBalance()
      resolve([
        "immature": balance.immature,
        "pending": balance.trustedPending,
        "untrustedPending": balance.untrustedPending,
        "confirmed": balance.confirmed,
        "spendable": balance.spendable,
        "total": balance.total
      ] as [String: Any])
    } catch {
      reject("Get Balance Error", error.localizedDescription, error)
    }
  }
  
  @objc
  func getTransactions(_ walletId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      guard let wallet = self.getWallet(for: walletId) else {
        let error = NSError(domain: "", code: 2, userInfo: [NSLocalizedDescriptionKey : "getTransactions index not found"])
        reject("Wallet Not Exists Error", error.localizedDescription, error)
        return
      }
      let transactions = try wallet.listTransactions(includeRaw: true)
      let currentHeight = try self.blockchain?.getHeight() ?? 0
      var txs: [Any] = []
      for tx in transactions {
        var parsedTx = [
          "value": 0,
          "received": tx.received,
          "sent": tx.sent,
          "fee": tx.fee ?? 0,
          "txid": tx.txid,
          "height": tx.confirmationTime?.height ?? 0,
          "confirmations": currentHeight > 0 ? currentHeight - (tx.confirmationTime?.height ?? 0) : 0,
          "timestamp": tx.confirmationTime?.timestamp ?? 0,
          "confirmed": (tx.confirmationTime?.height ?? 0) > 0 ? true : false
        ] as [String : Any]
        if tx.sent > 0 {
          parsedTx["value"] = abs(Int(tx.sent) - Int(tx.received)) - Int(tx.fee ?? 0)
          parsedTx["type"] = "SENT"
        } else {
          parsedTx["value"] = tx.received
          parsedTx["type"] = "RECEIVED"
        }
        
        var inputs: [[String: Any]] = []
        for txin in tx.transaction?.input() ?? [] {
          inputs.append([
            "previousTxid": txin.previousOutput.txid,
            "previousVout": txin.previousOutput.vout
          ])
        }
        parsedTx["inputs"] = inputs
        
        var outputs: [[String: Any]] = []
        for txout in tx.transaction?.output() ?? [] {
          let address = try Address.fromScript(script: txout.scriptPubkey, network: self.network)
          outputs.append([
            "value": txout.value,
            "address": address.asString()
          ])
        }
        parsedTx["outputs"] = outputs
        
        txs.append(parsedTx)
      }
      resolve(txs)
    } catch {
      reject("Get Transactions Error", error.localizedDescription, error)
    }
  }
  
  @objc
  func listUnspent(_ walletId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      guard let wallet = self.getWallet(for: walletId) else {
        let error = NSError(domain: "", code: 2, userInfo: [NSLocalizedDescriptionKey : "getTransactions index not found"])
        reject("Wallet Not Exists Error", error.localizedDescription, error)
        return
      }
      let unspentTxs = try wallet.listUnspent()
      var utxos: [Any] = []
      for utxo in unspentTxs {
        let address = try Address.fromScript(script: utxo.txout.scriptPubkey, network: self.network)
        let parsedUTXO = [
          "txid": utxo.outpoint.txid,
          "vout": utxo.outpoint.vout,
          "value": utxo.txout.value,
          "address": address.asString(),
          "isSpent": utxo.isSpent,
          "keychain": utxo.keychain == .internal ? "internal" : "external"
        ] as [String : Any]
        utxos.append(parsedUTXO)
      }
      resolve(utxos)
    } catch {
      reject("List Unsspent Error", error.localizedDescription, error)
    }
  }
  
  @objc
  func send(_ walletId: String, to: String, amount: NSNumber, satPerVbyte: NSNumber, signPsbt: Bool, inputs: NSArray, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      guard let wallet = self.getWallet(for: walletId) else {
        let error = NSError(domain: "", code: 2, userInfo: [NSLocalizedDescriptionKey : "send index not found"])
        reject("Wallet Not Exists Error", error.localizedDescription, error)
        return
      }
      let address = try Address(address: to)
      let script = address.scriptPubkey()
      var txBuilder = TxBuilder().manuallySelectedOnly().addRecipient(script: script, amount: UInt64(truncating: amount)).feeRate(satPerVbyte: satPerVbyte.floatValue)
      if let inputsArray = inputs as? [[String: Any]], inputsArray.count > 0 {
        inputsArray.forEach { input in
          if let txid = input["txid"] as? String, let vout = input["vout"] as? Int {
            txBuilder = txBuilder.addUtxo(outpoint: OutPoint(txid: txid, vout: UInt32(vout)))
          }
        }
      }
      let details = try txBuilder.finish(wallet: wallet)
      if signPsbt {
        let signed = try wallet.sign(psbt: details.psbt, signOptions: SignOptions(trustWitnessUtxo: false, assumeHeight: nil, allowAllSighashes: true, removePartialSigs: true, tryFinalize: true, signWithTapInternalKey: true, allowGrinding: true))
        if signed == false {
          let error = NSError(domain: "", code: 2, userInfo: [NSLocalizedDescriptionKey : "Unable to sign transaction"])
          reject("Send Transaction Error", error.localizedDescription, error)
          return
        }
      }
      try self.blockchain?.broadcast(transaction: details.psbt.extractTx())
      resolve(details.psbt.txid())
    } catch {
      reject("Create Psbt Error", error.localizedDescription, error)
    }
  }
  
  @objc
  func signPsbt(_ walletId: String, base64Psbt: String, extractTx: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      guard let wallet = self.getWallet(for: walletId) else {
        let error = NSError(domain: "", code: 2, userInfo: [NSLocalizedDescriptionKey : "createPsbt index not found"])
        reject("Wallet Not Exists Error", error.localizedDescription, error)
        return
      }
      
      let psbt = try PartiallySignedTransaction(psbtBase64: base64Psbt)
      let signed = try wallet.sign(psbt: psbt, signOptions: SignOptions(trustWitnessUtxo: false, assumeHeight: nil, allowAllSighashes: true, removePartialSigs: true, tryFinalize: true, signWithTapInternalKey: true, allowGrinding: true))
      if signed == false {
        let error = NSError(domain: "", code: 2, userInfo: [NSLocalizedDescriptionKey : "Unable to sign transaction"])
        reject("Sign Psbt Error", error.localizedDescription, error)
        return
      }
      
      if extractTx == true {
        resolve(Data(psbt.extractTx().serialize()).hexEncodedString())
      } else {
        resolve(psbt.serialize())
      }
    } catch {
      reject("Sign Psbt Error", error.localizedDescription, error)
    }
  }
  
  @objc
  func signAndBroadcastPsbt(_ walletId: String, base64Psbt: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      guard let wallet = self.getWallet(for: walletId) else {
        let error = NSError(domain: "", code: 2, userInfo: [NSLocalizedDescriptionKey : "createPsbt index not found"])
        reject("Wallet Not Exists Error", error.localizedDescription, error)
        return
      }
      
      let psbt = try PartiallySignedTransaction(psbtBase64: base64Psbt)
      let signed = try wallet.sign(psbt: psbt, signOptions: SignOptions(trustWitnessUtxo: false, assumeHeight: nil, allowAllSighashes: true, removePartialSigs: true, tryFinalize: true, signWithTapInternalKey: true, allowGrinding: true))
      if signed == false {
        let error = NSError(domain: "", code: 2, userInfo: [NSLocalizedDescriptionKey : "Unable to sign transaction"])
        reject("Sign Psbt Error", error.localizedDescription, error)
        return
      }
      
      try self.blockchain?.broadcast(transaction: psbt.extractTx())
      resolve(["txid": psbt.txid()])
      
    } catch {
      reject("Sign Psbt Error", error.localizedDescription, error)
    }
  }
  
  
  @objc
  func broadcastTx(_ walletId: String, txHex: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      guard let wallet = self.getWallet(for: walletId) else {
        let error = NSError(domain: "", code: 2, userInfo: [NSLocalizedDescriptionKey : "send index not found"])
        reject("Wallet Not Exists Error", error.localizedDescription, error)
        return
      }
      
      let transaction = try Transaction(transactionBytes: txHex.hexaBytes)
      try self.blockchain?.broadcast(transaction: transaction)
      
      resolve(["txid": transaction.txid()])
    } catch {
      reject("Broadcast Error", error.localizedDescription, error)
    }
  }
  
}
