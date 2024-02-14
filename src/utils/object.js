export const updateWithNotation = (object, key, value) => {
  var keys = Array.isArray(key) ? key : key.split('.');
  var curStep = object;
  for (var i = 0; i < keys.length - 1; i++) {
    var key = keys[i];
    if( !curStep[key] && !Object.prototype.hasOwnProperty.call(curStep, key) ) {
      var nextKey = keys[i+1];
      var useArray = /^\+?(0|[1-9]\d*)$/.test(nextKey);
      curStep[key] = useArray ? [] : {};
    }
    curStep = curStep[key];
  }
  var finalStep = keys[keys.length - 1];
  curStep[finalStep] = value;
}

export const mergeDeep = (...objects) => {
  const isObject = obj => obj && typeof obj === 'object';
  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach(key => {
      const pVal = prev[key];
      const oVal = obj[key];
      if( Array.isArray(pVal) && Array.isArray(oVal) ) {
        prev[key] = pVal.concat(...oVal);
      } else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = mergeDeep(pVal, oVal);
      } else {
        prev[key] = oVal;
      }
    });
    return prev;
  }, {});
}
