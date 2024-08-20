
import React from 'react'

import { ChakraProvider } from '@chakra-ui/react'
import Paint3 from './components/Paint3'

const App = () => {
  // const value = "Hello"
  // console.log(value)
  return (
    <ChakraProvider>
      {/* <p>{value}</p> */}
      
      <Paint3 />
    </ChakraProvider>
  
  )
}

export default App