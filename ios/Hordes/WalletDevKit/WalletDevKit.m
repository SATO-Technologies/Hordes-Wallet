//
//  WalletDevKit.m
//  SATO
//
//  Created by Damian Di Zeo on 22/11/2022.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(WalletDevKit, NSObject)

RCT_EXTERN_METHOD(setNetwork:(nonnull NSString *)network
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setBlockchain:(nonnull NSString *)type
                  url:(nonnull NSString *)url
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(createExtendedKey:(nonnull NSNumber *)wordCount
                  password:(nonnull NSString *)password
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(importExtendedKey:(nonnull NSString *)mnemonic
                  password:(nonnull NSString *)password
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(createWallet:(nonnull NSString *)id
                  descriptor:(nonnull NSString *)descriptor
                  changeDescriptor:(nonnull NSString *)changeDescriptor
                  databaseConfig:(nonnull NSString *)databaseConfig
                  databasePath:(nonnull NSString *)databasePath
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getAddress:(nonnull NSString *)walletId
                  addressIndex:(nonnull NSString *)addressIndex
                  isExternal:(BOOL *)isExternal
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getAddressByIndex:(nonnull NSString *)walletId
                  index:(nonnull NSNumber *)index
                  isExternal:(BOOL *)isExternal
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(sync:(nonnull NSString *)walletId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getBalance:(nonnull NSString *)walletId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getTransactions:(nonnull NSString *)walletId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(listUnspent:(nonnull NSString *)walletId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(send:(nonnull NSString *)walletId
                  to:(nonnull NSString *)to
                  amount:(nonnull NSNumber *)amount
                  satPerVbyte:(nonnull NSNumber *)satPerVbyte
                  signPsbt:(BOOL *)signPsbt
                  inputs:(NSArray *)inputs
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(createPsbt:(nonnull NSString *)walletId
                  to:(nonnull NSString *)to
                  amount:(nonnull NSNumber *)amount
                  signPsbt:(BOOL *)signPsbt
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(signPsbt:(nonnull NSString *)walletId
                  base64Psbt:(nonnull NSString *)base64Psbt
                  extractTx:(BOOL *)extractTx
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(signAndBroadcastPsbt:(nonnull NSString *)walletId
                  base64Psbt:(nonnull NSString *)base64Psbt
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(broadcastTx:(nonnull NSString *)walletId
                  txHex:(nonnull NSString *)txHex
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

@end
