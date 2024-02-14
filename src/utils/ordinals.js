export function sortInscriptions(inscriptionsToSort) {

  function extractNumberFromName(name) {
    const match = name && name.match(/#(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  inscriptionsToSort.sort((a, b) => {
    const numA = extractNumberFromName(a.meta?.name);
    const numB = extractNumberFromName(b.meta?.name);
    if( numA !== null && numB !== null ) {
      return numA - numB;
    } else if( numA !== null ) {
      return -1;
    } else if( numB !== null ) {
      return 1;
    } else if( a.meta?.name && b.meta?.name) {
      return a.meta?.name.localeCompare(b.meta?.name);
    } else {
      return a.num - b.num;
    }
  });
  return inscriptionsToSort;

}
