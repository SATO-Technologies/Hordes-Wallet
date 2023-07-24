# Hordes Technicals

## External dependencies/tools

We used the following open source software to build the app:

| Name | Description | License |
| ---- | ----------- | ------- |
| [Bitcoin Dev Kit](https://github.com/bitcoindevkit/bdk) | A modern, lightweight, descriptor-based wallet library written in Rust | MIT/Apache-2.0 |
| [BitcoinJS](https://github.com/bitcoinjs/bitcoinjs-lib) | A javascript Bitcoin library for node.js and browsers | MIT |

BDK is used to fetch users' related transactions and maintain a local UTXO set. It is also used to sign some transactions.

BitcoinJS is used as a complementary library for Ordinals related transactions. We build commitment and reveal transactions with it. We also use it to generate buying transactions for online marketplaces, along with other Ordinals transactions requiring precision up to the satoshi.

## Security

The app is as secure as a hot wallet with good practices can be. It is not recommended to store large amounts of money on it. It is also not recommended to use it on a rooted device.

The seed is stored in the device's secure storage. It is encrypted with a PIN code. The PIN is stored in the device's secure storage as well. The PIN and the seed are never sent to the server.

## Privacy

Due to the constraints of Ordinals, the wallet uses a single address for all transactions. This address is generated from the seed with (by default) the derivation path `m/86'/0'/0'/0/0`. This means that all transactions and funds are linked to the same address.

As the app needs to communicate with the server to fetch transactions and check the presence of inscriptions or rare sats in the wallet, the server can technically link an IP to a bitcoin address. However, the server does not collect any data about the users and will never do so.
