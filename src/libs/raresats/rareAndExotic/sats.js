import { 
  listLegendary, 
  listEpic,
  listRare,
  listUncommon
} from "./rare.js";

import {
  listFirstTx,
  listBlock9,
  listBlock78,
  listVintage,
  listPizza,
  listNakamoto,
  listPalindromes,
  listBlack,
  listAlpha,
  listOmega,
} from "./exotic.js";


// The order in the array is related to priority
// A pizza sat that is also uncommon is first extracted as an uncommon sat
const _typeByPriority = [
  // Rare
  { name: "legendary",  listingFunc: listLegendary   },
  { name: "epic",       listingFunc: listEpic        },
  { name: "rare",       listingFunc: listRare        },
  { name: "uncommon",   listingFunc: listUncommon    },

  // Exotic
  { name: "black",      listingFunc: listBlack       },
  { name: "alpha",      listingFunc: listAlpha       },
  { name: "omega",      listingFunc: listOmega       },
  { name: "nakamoto",   listingFunc: listNakamoto    },
  { name: "palindrome", listingFunc: listPalindromes },
  { name: "firstTx",    listingFunc: listFirstTx     },
  { name: "block9",     listingFunc: listBlock9      },
  { name: "block78",    listingFunc: listBlock78     },
  { name: "vintage",    listingFunc: listVintage     },
  { name: "pizza",      listingFunc: listPizza       },
];

export const SATRIBUTES = _typeByPriority.map(x => x.name);

export const typeToListingFunc = {};
for (let type of _typeByPriority) {
  typeToListingFunc[type.name] = type.listingFunc;
}