/* components */
import Response from './Response';
import Loader from './Loader';
import WalletReceive from './Wallet/Receive';
import WalletSend from './Wallet/Send';
import WalletSecretPhrase from './Wallet/SecretPhrase';
import WalletDelete from './Wallet/Delete';
import InscriptionTransfer from './Inscription/Transfer';
import Profile from './Profile';
import ProfileChooseImage from './Profile/ChooseImage';
import AuthenticatorPasscode from './Authenticator/Passcode';
import AuthenticatorBiometrics from './Authenticator/Biometrics';
import QRScanner from './QRScanner';
import HordesAddress from './Hordes/Address';
import HordesSignMessage from './Hordes/SignMessage';
import HordesSignTransaction from './Hordes/SignTransaction';

/* contexts */
import { useModals } from 'contexts/modals';

export default function Modals() {

  /* modal context */
  const { components } = useModals();

  /* ui */
  return (
    <>
      {components.map((component, index) => {
        switch(component.name) {
          case 'RESPONSE':
            return <Response key={`modal_${component.name}`} name={component.name} {...component.params} />
          case 'LOADER':
            return <Loader key={`modal_${component.name}`} name={component.name} {...component.params} />
          case 'WALLET_RECEIVE':
            return <WalletReceive key={`modal_${component.name}`} name={component.name} {...component.params} />
          case 'WALLET_SEND':
            return <WalletSend key={`modal_${component.name}`} name={component.name} {...component.params} />
          case 'WALLET_DELETE':
            return <WalletDelete key={`modal_${component.name}`} name={component.name} {...component.params} />
          case 'WALLET_SECRET_PHRASE':
            return <WalletSecretPhrase key={`modal_${component.name}`} name={component.name} {...component.params} />
          case 'INSCRIPTION_TRANSFER':
            return <InscriptionTransfer key={`modal_${component.name}`} name={component.name} {...component.params} />
          case 'PROFILE':
            return <Profile key={`modal_${component.name}`} name={component.name} {...component.params} />
          case 'PROFILE_CHOOSE_IMAGE':
            return <ProfileChooseImage key={`modal_${component.name}`} name={component.name} {...component.params} />
          case 'PASSCODE_AUTHENTICATOR':
            return <AuthenticatorPasscode key={`modal_${component.name}`} name={component.name} {...component.params} />
          case 'BIOMETRICS_AUTHENTICATOR':
            return <AuthenticatorBiometrics key={`modal_${component.name}`} name={component.name} {...component.params} />
          case 'QR_SCANNER':
            return <QRScanner key={`modal_${component.name}`} name={component.name} {...component.params} />
          case 'HORDES_ADDRESS':
            return <HordesAddress key={`modal_${component.name}`} name={component.name} {...component.params} />
          case 'HORDES_SIGN_MESSAGE':
            return <HordesSignMessage key={`modal_${component.name}`} name={component.name} {...component.params} />
          case 'HORDES_SIGN_TRANSACTION':
            return <HordesSignTransaction key={`modal_${component.name}`} name={component.name} {...component.params} />
        }
      })}
    </>
  )

}
