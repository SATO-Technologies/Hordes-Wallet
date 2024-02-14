/* modules */
import { useState, useEffect, createContext, useContext, useRef } from 'react';
import _ from 'lodash';

/* managers */
import hordesApi from 'managers/hordes';

/* utils */
import { getItem, saveItem } from 'utils/storage';
import { emptyString, validUrl } from 'utils/string';
import { updateWithNotation, mergeDeep } from 'utils/object';

export const AccountContext = createContext({ });

export default function AccountProvider({ children }) {

  /* refs */
  const saveRef = useRef(null);

  /* defaults */
  const defaultAccount = () => {
    return {
      biometrics: false,
      currencies: {
        fiat: 'USD',
        balance: 'SATS',
        transactions: 'SATS'
      },
      hideBalance: false,
      notifications: true,
      language: 'en',
      backup: false,
      profile: {
        username: '',
        icon: null,
        socials: {
          twitter: {
            value: '',
            visible: false
          },
          linkedin: {
            value: '',
            visible: false
          },
          webs: [{
            value: '', visible: false
          }]
        }
      },
      blockchain: {
        electrumUrl: 'ssl://electrum.blockstream.info:60002'
      }
    }
  }

  /* states */
  const [account, setAccount] = useState(defaultAccount());

  /* effects */
  useEffect(() => {

    const doAsyncRequest = async () => {
      let localAccount = await getItem('account');
      if( localAccount ) {
        localAccount = JSON.parse(localAccount);
        setAccount(localAccount);
      }
    }
    doAsyncRequest();

  }, []);

  /* actions */
  const updateAccount = async (key, value) => {
    let updated = _.cloneDeep({ ...account });
    updateWithNotation(updated, key, value);
    setAccount(updated);

    if( saveRef.current ) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(async () => {
      await saveItem('account', updated);
      if( key.includes('profile.') ) await saveProfile(updated.profile);
    }, 2000);
  }

  const deleteAccount = async () => {
    setAccount(defaultAccount);
    await saveItem('account', defaultAccount());
  }

  const saveProfile = async (data = null) => {
    let profileToUpdate = _.cloneDeep(data || account.profile);
    profileToUpdate.socials.webs = profileToUpdate.socials.webs.filter((web) => !emptyString(web.value) && validUrl(web.value));
    await hordesApi.account.update({
      [`profileInfo.${global.app}`]: profileToUpdate
    });
  }

  /* provider */
  const states = {
    account
  }
  const actions = {
    updateAccount,
    deleteAccount,
    saveProfile
  }
  return (
    <AccountContext.Provider value={{ ...states, ...actions }}>
      {children}
    </AccountContext.Provider>
  );

}

export const useAccount = () => useContext(AccountContext);
