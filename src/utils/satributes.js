/* assets */
import SatoSatsLogo from 'assets/svgs/satributes/sato_sats.svg';
import UncommonLogo from 'assets/svgs/satributes/uncommon.svg';
import RareLogo from 'assets/svgs/satributes/rare.svg';
import EpicLogo from 'assets/svgs/satributes/epic.svg';
import VintageLogo from 'assets/svgs/satributes/vintage.svg';
import NakamotoLogo from 'assets/svgs/satributes/nakamoto.svg';
import FirstTxLogo from 'assets/svgs/satributes/first_transaction.svg';
import PalindromesLogo from 'assets/svgs/satributes/palindromes.svg';
import PizzaLogo from 'assets/svgs/satributes/pizza.svg';
import Block9Logo from 'assets/svgs/satributes/block_9.svg';
import Block78Logo from 'assets/svgs/satributes/block_78.svg';
import AlphaLogo from 'assets/svgs/satributes/alpha.svg';
import OmegaLogo from 'assets/svgs/satributes/omega.svg';
import BlackLogo from 'assets/svgs/satributes/black.svg';

export default satributes = {
  sato_sats: { title: 'Satributes.SatoSatsTitleText', desc: 'Satributes.SatoSatsDescText', icon: SatoSatsLogo },
  uncommon: { title: 'Satributes.UncommonTitleText', desc: 'Satributes.UncommonDescText', icon: UncommonLogo },
  rare: { title: 'Satributes.RareTitleText', desc: 'Satributes.RareDescText', icon: RareLogo },
  epic: { title: 'Satributes.EpicTitleText', desc: 'Satributes.EpicDescText', icon: EpicLogo },
  vintage: { title: 'Satributes.VintageTitleText', desc: 'Satributes.VintageDescText', icon: VintageLogo },
  nakamoto: { title: 'Satributes.NakamotoTitleText', desc: 'Satributes.NakamotoDescText', icon: NakamotoLogo },
  first_transaction: { title: 'Satributes.FirstTransactionTitleText', desc: 'Satributes.FirstTransactionDescText', icon: FirstTxLogo },
  palindromes: { title: 'Satributes.PalindromesTitleText', desc: 'Satributes.PalindromesDescText', icon: PalindromesLogo },
  pizza: { title: 'Satributes.PizzaTitleText', desc: 'Satributes.PizzaDescText', icon: PizzaLogo },
  block_9: { title: 'Satributes.Block9TitleText', desc: 'Satributes.Block9DescText', icon: Block9Logo },
  block_78: { title: 'Satributes.Block78TitleText', desc: 'Satributes.Block78DescText', icon: Block78Logo },
  alpha: { title: 'Satributes.AlphaTitleText', desc: 'Satributes.AlphaDescText', icon: AlphaLogo },
  omega: { title: 'Satributes.OmegaTitleText', desc: 'Satributes.OmegaDescText', icon: OmegaLogo },
  black: { title: 'Satributes.BlackTitleText', desc: 'Satributes.BlackDescText', icon: BlackLogo }
}

export function parseSatributes(satributes = []) {
  let parsedSatributes = [];
  satributes.map((sat, subindex) => {
    let parsedSat = parseSatribute(sat);
    if( parsedSat ) parsedSatributes.push(parsedSat);
  });
  return parsedSatributes
}

export function parseSatribute(sat) {
  let parsedSat = sat.toLowerCase().replace(' ', '_');
  if( parsedSat == 'palindrome' ) parsedSat = 'palindromes';
  if( parsedSat == 'block9' ) parsedSat = 'block_9';
  if( parsedSat == 'block78' ) parsedSat = 'block_78';
  if( parsedSat == 'firsttx' ) parsedSat = 'first_transaction';
  if( parsedSat != 'common' ) return parsedSat;
  return null
}
