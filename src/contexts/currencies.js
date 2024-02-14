/* modules */
import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { EXCHANGE_RATE_KEY } from '@env';

/* managers */
import hordesApi from 'managers/hordes';

export const CurrenciesContext = createContext({ });

export default function CurrenciesProvider({ children }) {

  /* states */
  const [btcPrice, setBtcPrice] = useState(0);
  const [currencies, setCurrencies] = useState({
    USD: 1
  });

  /* effects */
  useEffect(() => {

    const doAsyncRequest = async () => {
      await fetchBTCPrice();
      await fetchCurrencies();
    }
    doAsyncRequest();

  }, []);

  /* data */
  const fetchBTCPrice = async () => {
    try {
      let binanceResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
      binanceResponse = await binanceResponse.json();
      if( binanceResponse && binanceResponse.price ) {
        setBtcPrice(+binanceResponse.price);
        return
      }
    } catch { }

    try {
      let cryptocompareResponse = await fetch('https://min-api.cryptocompare.com/data/histohour?fsym=BTC&tsym=USD&limit=1');
      cryptocompareResponse = await cryptocompareResponse.json();
      if( cryptocompareResponse && cryptocompareResponse.Data ) {
        let price = 0;
        cryptocompareResponse.Data.forEach((item, i) => {
          price = +item.close;
        });
        setBtcPrice(price);
      }
    } catch { }
  }

  const fetchCurrencies = async () => {
    try {
      let currencies = await hordesApi.currencies.get();
      if( currencies ) {
        let data = { USD: 1 }
        Object.keys(currencies).map((key) => {
          data[key.toUpperCase()] = currencies[key] / currencies['usd'];
        });
        setCurrencies(data);
      }
    } catch { }
  }

  /* provider */
  const states = {
    btcPrice,
    currencies
  }
  const actions = {
    fetchBTCPrice,
    fetchCurrencies
  }
  return (
    <CurrenciesContext.Provider value={{ ...states, ...actions }}>
      {children}
    </CurrenciesContext.Provider>
  );

}

export const useCurrencies = () => useContext(CurrenciesContext);
