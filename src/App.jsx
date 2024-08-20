
import React from 'react'

import { ChakraProvider } from '@chakra-ui/react'
import Paint4 from './components/Paint4'


const App = () => {
  // const value = "Hello"
  // console.log(value)
  return (
    <ChakraProvider>
      {/* <p>{value}</p> */}
      
      <Paint4 />
    </ChakraProvider>
  
  )
}

export default App