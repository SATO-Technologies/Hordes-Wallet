package com.sato.hordes.walletdevkit

import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.bridge.UiThreadUtil.runOnUiThread
import org.bitcoindevkit.*
import java.io.File
import java.lang.Math.abs
import java.util.Collections.emptyList

fun parseNetwork(network: String): Network {
    when (network) {
        "bitcoin" -> return Network.BITCOIN
        "regtest" -> return Network.REGTEST
        "signet" -> return Network.SIGNET
        "testnet" -> return Network.TESTNET
        else -> {
            return Network.TESTNET
        }
    }
}

fun parseWordCount(wordCount: Int): WordCount {
    when (wordCount) {
        12 -> return WordCount.WORDS12
        15 -> return WordCount.WORDS15
        18 -> return WordCount.WORDS18
        21 -> return WordCount.WORDS21
        24 -> return WordCount.WORDS24
        else -> {
            return WordCount.WORDS12
        }
    }
}

fun parseDatabaseConfig(config: String, path: String): DatabaseConfig {
    when (config) {
        "memory" -> return DatabaseConfig.Memory
        "sqlite" -> return DatabaseConfig.Sqlite(SqliteDbConfiguration(path))
        else -> {
            return DatabaseConfig.Memory
        }
    }
}

fun parseAddressIndex(index: String): AddressIndex {
    when (index) {
        "last-unused" -> return AddressIndex.LastUnused
        "new" -> return AddressIndex.New
        else -> {
            return AddressIndex.LastUnused
        }
    }
}

fun ByteArray.hexEncodedString(): String {
    return joinToString("") { "%02x".format(it) }
}

fun String.hexa(): ByteArray {
    check(length % 2 == 0) { "Must have an even length" }
    return chunked(2)
            .map { it.toInt(16).toByte() }
            .toByteArray()
}

class WDKModule(reactContext: ReactApplicationContext) :ReactContextBaseJavaModule(reactContext) {

    private var wallets = mutableMapOf<String, Wallet?>()
    private var blockchain: Blockchain? = null
    private lateinit var network: Network

    override fun getName(): String {
        return "WalletDevKit"
    }

    init {

    }

    fun getWallet(id: String): Wallet? {
        return this.wallets[id]
    }

    @ReactMethod
    fun setNetwork(network: String, promise: Promise) {
        when (network) {
            "bitcoin" -> this.network = Network.BITCOIN
            "regtest" -> this.network = Network.REGTEST
            "signet" -> this.network = Network.SIGNET
            "testnet" -> this.network = Network.TESTNET
            else -> {
                this.network = Network.TESTNET
            }
        }
        promise.resolve(true)
    }

    @ReactMethod
    fun setBlockchain(type: String, url: String, promise: Promise) {
        try {
            if( this.blockchain == null ) {
                when (type) {
                    "electrum" -> {
                        val blockchainConfig = BlockchainConfig.Electrum(ElectrumConfig(if (this.network == Network.BITCOIN) "ssl://electrum.blockstream.info:50002" else "ssl://electrum.blockstream.info:60002", null, 5u, 5u, 10u, true))
                        this.blockchain = Blockchain(blockchainConfig)
                    }
                    else -> {

                    }
                }
            }
            promise.resolve(true)
        } catch (error: Throwable) {
            Log.v("WDK", error.message.toString())
            Log.v("WDK", error.cause.toString())
            promise.reject("Set Blockchain Error", error.message, error.cause)
        }
    }

    @ReactMethod
    fun createExtendedKey(wordCount: Int, password: String, promise: Promise) {
        try {
            val descriptor: DescriptorSecretKey = DescriptorSecretKey(
                    network = this.network,
                    mnemonic = Mnemonic(wordCount = parseWordCount(wordCount)),
                    password = password
            )
            promise.resolve(descriptor.asString())
        } catch (error: Throwable) {
            return promise.reject("Generate Extended Key Error", error.message, error)
        }
    }

    @ReactMethod
    fun importExtendedKey(mnemonic: String, password: String, promise: Promise) {
        try {
            val descriptor: DescriptorSecretKey = DescriptorSecretKey(
                    network = this.network,
                    mnemonic = Mnemonic.fromString(mnemonic),
                    password = password
            )
            promise.resolve(descriptor.asString())
        } catch (error: Throwable) {
            return promise.reject("Restore Extended Key Error", error.message, error)
        }
    }

    @ReactMethod
    fun createWallet(id: String, descriptor: String, changeDescriptor: String, databaseConfig: String, databasePath: String, promise: Promise) {
        try {
            val dbStoragePath = File(databasePath)
            if (!dbStoragePath.exists()) {
                dbStoragePath.mkdirs()
            }
            val wallet = Wallet(Descriptor(descriptor, this.network), Descriptor(changeDescriptor, this.network), this.network, parseDatabaseConfig(databaseConfig, dbStoragePath.path + "/" + id + "-db"))
            this.wallets[id] = wallet
            promise.resolve(true)
        } catch (error: Throwable) {
            promise.reject("Create Wallet Error", error.message, error.cause)
        }
    }

    @ReactMethod
    fun getAddress(walletId: String, addressIndex: String, isExternal: Boolean, promise: Promise) {
        try {
            val wallet = this.getWallet(walletId);
            if (wallet == null) {
                promise.reject("Sync Error", "index not found")
                return
            }
            val response = mutableMapOf<String, Any?>()
            val address = if (isExternal == true ) wallet!!.getAddress(parseAddressIndex(addressIndex)) else wallet!!.getInternalAddress(parseAddressIndex(addressIndex))
            response["address"] = address.address.asString()
            response["index"] = address.index.toInt()
            promise.resolve(Arguments.makeNativeMap(response))
        } catch (error: Throwable) {
            promise.reject("Get Address Error", error.message, error.cause)
        }
    }

    @ReactMethod
    fun getAddressByIndex(walletId: String, index: Double, isExternal: Boolean, promise: Promise) {
        try {
            val wallet = this.getWallet(walletId);
            if (wallet == null) {
                promise.reject("Sync Error", "index not found")
                return
            }
            val response = mutableMapOf<String, Any?>()
            val address = if (isExternal == true ) wallet!!.getAddress(AddressIndex.Peek(index.toUInt())) else wallet!!.getInternalAddress(AddressIndex.Peek(index.toUInt()))
            response["address"] = address.address.asString()
            response["index"] = address.index.toInt()
            promise.resolve(Arguments.makeNativeMap(response))
        } catch (error: Throwable) {
            promise.reject("Get Address Error", error.message, error.cause)
        }
    }

    @ReactMethod
    fun sync(walletId: String, promise: Promise) {
        val wallet = this.getWallet(walletId);
        if (wallet == null) {
            promise.reject("Sync Error", "index not found")
            return
        }
        Thread {
            try {
                if( this.blockchain != null ) {
                    wallet!!.sync(this.blockchain!!, null)
                }
                runOnUiThread {
                    promise.resolve(true)
                }
            } catch (error: Throwable) {
                promise.reject("Sync Error", error.message, error.cause)
            }
        }.start()
    }

    @ReactMethod
    fun getBalance(walletId: String, promise: Promise) {
        try {
            val wallet = this.getWallet(walletId);
            if (wallet == null) {
                promise.reject("Sync Error", "index not found")
                return
            }
            val balance: Balance = wallet!!.getBalance()

            val response = mutableMapOf<String, Any?>()
            response["immature"] = balance.immature.toInt()
            response["pending"] = balance.trustedPending.toInt()
            response["untrustedPending"] = balance.untrustedPending.toInt()
            response["confirmed"] = balance.confirmed.toInt()
            response["spendable"] = balance.spendable.toInt()
            response["total"] = balance.total.toInt()
            promise.resolve(Arguments.makeNativeMap(response))
        } catch (error: Throwable) {
            promise.reject("Get Balance Error", error.message, error.cause)
        }
    }

    @ReactMethod
    fun getTransactions(walletId: String, promise: Promise) {
        try {
            val wallet = this.getWallet(walletId);
            if (wallet == null) {
                promise.reject("Sync Error", "index not found")
                return
            }
            val transactions = wallet!!.listTransactions(true)

            if (transactions.isEmpty()) {
                promise.resolve(Arguments.makeNativeArray(emptyList<Any>()))
            } else {
                val txs: MutableList<Map<String, Any?>> = mutableListOf()
                val currentHeight = this.blockchain?.getHeight()?.toInt() ?: 0
                for (item in transactions) {
                    val response = mutableMapOf<String, Any?>()
                    response["value"] = 0
                    response["received"] = item.received.toInt()
                    response["sent"] = item.sent.toInt()
                    response["fee"] = item.fee?.toInt() ?: 0
                    response["txid"] = item.txid
                    response["height"] = item.confirmationTime?.height?.toInt() ?: 0
                    response["confirmations"] = 0
                    if( currentHeight > 0 ) {
                        response["confirmations"] = currentHeight - (item.confirmationTime?.height?.toInt() ?: 0)
                    }
                    response["timestamp"] = (item.confirmationTime?.timestamp?.toString() ?: 0)
                    response["confirmed"] = (item.confirmationTime?.height?.toInt() ?: 0) > 0
                    if (item.sent.toInt() > 0) {
                        response["value"] = abs(item.sent.toInt() - item.received.toInt()) - (item.fee?.toInt() ?: 0)
                        response["type"] = "SENT"
                    } else {
                        response["value"] = item.received.toInt()
                        response["type"] = "RECEIVED"
                    }

                    val inputs: MutableList<Map<String, Any?>> = mutableListOf()
                    if( item.transaction != null ) {
                        for (input in item.transaction!!.input()) {
                            val inputObject = mutableMapOf<String, Any?>()
                            inputObject["previousTxid"] = input.previousOutput.txid
                            inputObject["previousVout"] = input.previousOutput.vout.toInt()
                            inputs.add(inputObject)
                        }
                    }
                    response["inputs"] = inputs

                    val outputs: MutableList<Map<String, Any?>> = mutableListOf()
                    if( item.transaction != null ) {
                        for (output in item.transaction!!.output()) {
                            val address = Address.fromScript(output.scriptPubkey, this.network)
                            val outputObject = mutableMapOf<String, Any?>()
                            outputObject["value"] = output.value.toInt()
                            outputObject["address"] = address.asString()
                            outputs.add(outputObject)
                        }
                    }
                    response["outputs"] = outputs

                    txs.add(response)
                }
                promise.resolve(Arguments.makeNativeArray(txs))
            }
        } catch (error: Throwable) {
            promise.reject("Send Transaction Error", error.message, error.cause)
        }
    }

    @ReactMethod
    fun listUnspent(walletId: String, promise: Promise) {
        try {
            val wallet = this.getWallet(walletId);
            if (wallet == null) {
                promise.reject("Sync Error", "index not found")
                return
            }
            val unspentTxs = wallet!!.listUnspent()

            if (unspentTxs.isEmpty()) {
                promise.resolve(Arguments.makeNativeArray(emptyList<Any>()))
            } else {
                val utxs: MutableList<Map<String, Any?>> = mutableListOf()
                for (utxo in unspentTxs) {
                    val address = Address.fromScript(utxo.txout.scriptPubkey, this.network)
                    val response = mutableMapOf<String, Any?>()
                    response["txid"] = utxo.outpoint.txid
                    response["vout"] = utxo.outpoint.vout.toInt()
                    response["value"] = utxo.txout.value.toLong()
                    response["address"] = address.asString()
                    response["isSpent"] = utxo.isSpent
                    response["keychain"] = if( utxo.keychain == KeychainKind.INTERNAL ) "internal" else "external"
                    utxs.add(response)
                }
                promise.resolve(Arguments.makeNativeArray(utxs))
            }
        } catch (error: Throwable) {
            promise.reject("Send Transaction Error", error.message, error.cause)
        }
    }

    @ReactMethod
    fun send(walletId: String, to: String, amount: Double, satPerVbyte: Double, signPsbt: Boolean, inputs: ReadableArray, promise: Promise) {
        try {
            val wallet = this.getWallet(walletId);
            if (wallet == null) {
                promise.reject("Sync Error", "index not found")
                return
            }
            val address = Address(to)
            val script = address.scriptPubkey()
            val amount: Long = amount.toLong()
            val txBuilder = TxBuilder().addRecipient(script, amount.toULong()).feeRate(satPerVbyte.toFloat())
            if( inputs.size() > 0 ) {
                for( num in 0..inputs.size() ) {
                    val map = inputs.getMap(num)
                    val txid = map.getString("txid")
                    val vout = map.getInt("vout")
                    if( txid != null ) {
                        txBuilder.addUtxo(OutPoint(txid!!, vout.toUInt()))
                    }
                }
                txBuilder.manuallySelectedOnly()
            }
            val details = txBuilder.finish(wallet!!)
            if (signPsbt) {
                wallet!!.sign(details.psbt, SignOptions(false, null, true, true, true, true, true))
                this.blockchain?.broadcast(details.psbt.extractTx())

                val response = mutableMapOf<String, Any?>()
                response["txid"] = details.psbt.txid()
                promise.resolve(response)
            }
        } catch (error: Throwable) {
            promise.reject("Send Transaction Error", error.message, error.cause)
        }
    }

    @ReactMethod
    fun signPsbt(walletId: String, base64Psbt: String, extractTx: Boolean, promise: Promise) {
        try {
            val wallet = this.getWallet(walletId);
            if (wallet == null) {
                promise.reject("Sync Error", "index not found")
                return
            }

            val psbt = PartiallySignedTransaction(base64Psbt)
            wallet!!.sign(psbt, SignOptions(false, null, true, true, true, true, true))
            if( extractTx == true ) {
                promise.resolve(psbt.extractTx().serialize())
            } else {
                promise.resolve(psbt.serialize())
            }
        } catch (error: Throwable) {
            promise.reject("Send Transaction Error", error.message, error.cause)
        }
    }

    @ReactMethod
    fun signAndBroadcastPsbt(walletId: String, base64Psbt: String, extractTx: Boolean, promise: Promise) {
        try {
            val wallet = this.getWallet(walletId);
            if (wallet == null) {
                promise.reject("Sync Error", "index not found")
                return
            }

            val psbt = PartiallySignedTransaction(base64Psbt)
            wallet!!.sign(psbt, SignOptions(false, null, true, true, true, true, true))

            this.blockchain?.broadcast(psbt.extractTx())

            val response = mutableMapOf<String, Any?>()
            response["txid"] = psbt.txid()
            promise.resolve(response)

        } catch (error: Throwable) {
            promise.reject("Send Transaction Error", error.message, error.cause)
        }
    }

    @ReactMethod
    fun broadcastTx(walletId: String, txHex: String, promise: Promise) {
        try {
            val wallet = this.getWallet(walletId);
            if (wallet == null) {
                promise.reject("Sync Error", "index not found")
                return
            }

            val transaction = Transaction(txHex.hexa().toUByteArray().toList())
            this.blockchain?.broadcast(transaction)

            val response = mutableMapOf<String, Any?>()
            response["txid"] = transaction.txid()
            promise.resolve(response)

        } catch (error: Throwable) {
            promise.reject("Broadcast Transaction Error", error.message, error.cause)
        }
    }

}
