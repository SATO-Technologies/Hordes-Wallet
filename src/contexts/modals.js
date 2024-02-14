/* modules */
import { useState, useEffect, createContext, useContext, useRef } from 'react';

export const ModalsContext = createContext({ });

export default function ModalsProvider({ children }) {

  /* refs */
  const componentsRef = useRef([]);

  /* states */
  const [components, setComponents] = useState([]);

  /* actions */
  const showModal = (name, params = { }) => {
    let mountedComponets = [...componentsRef.current];
    if( !mountedComponets.find((modal) => modal.name == name) ) {
      componentsRef.current = [...componentsRef.current, { name: name, params: params }];
      setComponents(componentsRef.current);
    }
  }

  const hideModal = (name) => {
    let mountedComponets = [...componentsRef.current];
    componentsRef.current = mountedComponets.filter((modal) => modal.name != name )
    setComponents(componentsRef.current);
  }

  /* provider */
  return (
    <ModalsContext.Provider value={{ components, showModal, hideModal }}>
      {children}
    </ModalsContext.Provider>
  );

}

export const useModals = () => useContext(ModalsContext);
