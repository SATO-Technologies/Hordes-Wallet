/* modules */
import { useState, useEffect, createContext, useContext, useRef } from 'react';

export const MempoolContext = createContext({ });

export default function MempoolProvider({ children }) {

  /* states */
  const [satsPerVbyte, setSatsPerVbytes] = useState({
    hourFee: 0,
    halfHourFee: 0,
    fastestFee: 0
  });

  /* effects */
  useEffect(() => {

    const doAsyncRequest = async () => {
      await fetchRecommendedFees();
    }
    doAsyncRequest();

  }, []);

  /* data */
  const fetchRecommendedFees = async () => {
    try {
      let response = await fetch('https://mempool.space/api/v1/fees/recommended');
      response = await response.json();
      if( response && response.fastestFee ) setSatsPerVbytes(response);
    } catch { }
  }

  /* provider */
  const states = {
    satsPerVbyte
  }
  const actions = {
    fetchRecommendedFees
  }
  return (
    <MempoolContext.Provider value={{ ...states, ...actions }}>
      {children}
    </MempoolContext.Provider>
  );

}

export const useMempool = () => useContext(MempoolContext);
