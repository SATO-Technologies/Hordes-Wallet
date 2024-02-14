export const numberFormat = (amount, decimalCount = 8, decimal = '.', thousands = ',') => {
  const negativeSign = amount < 0 ? '-' : '';
  let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
  let j = (i.length > 3) ? i.length % 3 : 0;
  let formatted = negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : '');
  if( formatted.match(/\./) ) {
    formatted = formatted.replace(/\.?0+$/, '');
  }
  return formatted.replace(/\.0+$/, '');
}
