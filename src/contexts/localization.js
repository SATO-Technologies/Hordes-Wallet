/* modules */
import { useState, useEffect, createContext, useContext } from 'react';

/* managers */
import hordesApi from 'managers/hordes';

/* utils */
import { getItem, saveItem } from 'utils/storage';

export const LocalizationContext = createContext({ });

export default function LocalizationProvider({ children }) {

  /* states */
  const [strings, setStrings] = useState(null);
  const [ready, setReady] = useState(false);

  /* effects */
  useEffect(() => {

    setStrings(require('assets/jsons/strings.json'));

    const doAsyncRequest = async () => {

      let localStrings = await getItem('strings');
      if( localStrings ) localStrings = JSON.parse(localStrings);
      if( localStrings && localStrings['Wallet'] ) {
        setStrings(localStrings);
      }

      let remoteStrings = await hordesApi.strings.getData();
      if( remoteStrings && remoteStrings['Wallet'] ) {
        setStrings(remoteStrings);
        await saveItem('strings', remoteStrings);
      }

    }
    doAsyncRequest();

  }, []);

  useEffect(() => {
    if( strings && Object.keys(strings).length > 0 ) setReady(true);
  }, [strings]);

  /* utils */
  const parseKey = (key) => {
    let splitKey = key.split('.');
    return {
      section: splitKey[0],
      key: splitKey[1]
    }
  }

  /* actions */
  const localize = (translateKey, params = [], fallback = null) => {
    let { section, key } = parseKey(translateKey);
    let localizedText = strings[section]?.[key] || null;
    if( !localizedText ) localizedText = fallback || key;
    params.forEach((param, index) => {
      localizedText = localizedText.replace(`STR_${(index+1)}`, param);
    });
    return localizedText;
  }

  /* provider */
  return (
    <LocalizationContext.Provider value={{ stringsReady: ready, localize }}>
      {children}
    </LocalizationContext.Provider>
  );

}

export const useLocalization = () => useContext(LocalizationContext);
