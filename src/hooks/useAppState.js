/* mpdules */
import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export default function useAppState() {

  /* variables */
  const currentState = AppState.currentState;

  /* states */
  const [appState, setAppState] = useState(currentState);

  /* effects */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (newState) => {
      setAppState(newState)
    })
    return () => {
      subscription.remove()
    }
  }, []);

  return appState;

}
