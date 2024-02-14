export const validEmail = (email) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

export const emptyString = (str) => {
  return (str == null || /^\s*$/.test(str))
}

export const validUrl = (url) => {
  return /^(http|https):\/\/[^ "]+$/.test(url)
}

export const containsHTML = (text) => {
  const htmlRegex = /<\/?[a-z][\s\S]*>/i;
  return htmlRegex.test(text);
}

export const parseUrl = (url) => {
  var regex = /[?&]([^=#]+)=([^&#]*)/g, params = {}, match;
  while (match = regex.exec(url)) {
    params[match[1]] = match[2];
  }
  return params;
}

export const urlExtension = (url) => {
  if( !url ) return null;
  return url.split(/[#?]/)[0].split('.').pop().trim();
}

export const parseFilePath = (path) => {
  if( path.endsWith('/') ) {
    path = path.slice(0, -1);
  }
  return path;
}

export const ellipsis = (s = '', length = 8) => {
  let start = s.substring(0, length);
  let end = s.substring(s.length -length);
  return `${start}...${end}`;
}

export const capitalize = (string = '') => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
