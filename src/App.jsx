
import React from 'react'
import Paint from './components/Paint'
import { ChakraProvider } from '@chakra-ui/react'

const App = () => {
  return (
    <ChakraProvider>

      <Paint />
    </ChakraProvider>
  
  )
}

export default App