
import React from 'react'
import Paint2 from './components/Paint'
import { ChakraProvider } from '@chakra-ui/react'

const App = () => {
  return (
    <ChakraProvider>

      <Paint2 />
    </ChakraProvider>
  
  )
}

export default App