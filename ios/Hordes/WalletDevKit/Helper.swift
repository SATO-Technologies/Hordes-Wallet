//
//  Helper.swift
//  SATO
//
//  Created by Damian Di Zeo on 22/11/2022.
//

import Foundation
import BitcoinDevKit

func parseWordCount(_ wordCount: NSNumber) -> WordCount {
  switch wordCount {
    case 12:
      return WordCount.words12
    case 15:
      return WordCount.words15
    case 18:
      return WordCount.words18
    case 21:
      return WordCount.words21
    case 24:
      return WordCount.words24
    default:
      return WordCount.words12
  }
}

func parseDatabaseConfig(_ config: String, path: String = "") -> DatabaseConfig {
  switch config {
    case "memory":
      return DatabaseConfig.memory
    case "sqlite":
      return DatabaseConfig.sqlite(config: SqliteDbConfiguration(path: path))
    default:
      return DatabaseConfig.memory
  }
}

func parseAddressIndex(_ index: String) -> AddressIndex {
  switch index {
    case "last-unused":
      return AddressIndex.lastUnused
    case "new":
      return AddressIndex.new
    default:
      return AddressIndex.lastUnused
  }
}

extension Data {
  
  struct HexEncodingOptions: OptionSet {
    let rawValue: Int
    static let upperCase = HexEncodingOptions(rawValue: 1 << 0)
  }
  
  func hexEncodedString(options: HexEncodingOptions = []) -> String {
    let format = options.contains(.upperCase) ? "%02hhX" : "%02hhx"
    return map { String(format: format, $0) }.joined()
  }
  
}

extension StringProtocol {
  
  var hexaData: Data { .init(hexa) }
  var hexaBytes: [UInt8] { .init(hexa) }
  
  private var hexa: UnfoldSequence<UInt8, Index> {
    sequence(state: startIndex) { startIndex in
      guard startIndex < endIndex else { return nil }
      let endIndex = index(startIndex, offsetBy: 2, limitedBy: endIndex) ?? endIndex
      defer { startIndex = endIndex }
      return UInt8(self[startIndex..<endIndex], radix: 16)
    }
  }
  
}
