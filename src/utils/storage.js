/* modules */
import EncryptedStorage, {
  KeychainAccessibility,
} from 'react-native-encrypted-storage';

/* variables */
const options = { storageName: 'hordeswalletstorage', keychainAccessibility: KeychainAccessibility.kSecAttrAccessibleAfterFirstUnlock }

export const saveItem = async (key, value, storageName = null) => {
  try {
    if( typeof value === 'string' || value instanceof String ) {
      return await EncryptedStorage.setItem(key, value, storageName ? { ...options, storageName: storageName } : options);
    } else {
      return await EncryptedStorage.setItem(key, JSON.stringify(value), storageName ? { ...options, storageName: storageName } : options);
    }
  } catch (e) {
    return false;
  }
}

export const getItem = async (key, storageName = null) => {
  try {
    return await EncryptedStorage.getItem(key, storageName ? { ...options, storageName: storageName } : options);
  } catch(e) {
    return null;
  }
}

export const deleteItem = async(key, storageName = null) => {
  try {
    return await EncryptedStorage.removeItem(key, storageName ? { ...options, storageName: storageName } : options);
  } catch(e) {
    return false;
  }
}

export const clear = async(key) => {
  try {
    return await EncryptedStorage.clear();
  } catch(e) {
    return false;
  }
}
