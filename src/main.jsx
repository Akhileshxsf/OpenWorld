import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { ChakraProvider } from '@chakra-ui/react';
import { extendTheme } from '@chakra-ui/react';
import {mode} from '@chakra-ui/theme-tools';//imported mode
import { BrowserRouter } from 'react-router-dom';
const styles = {
  global:(props) => ({
    body:{
       bg:mode("gray.100","#000")(props),//in light mode background colour(grey) and in dark mode background colour(#000(black))
       color:mode("gray.800","whiteAlpha.900")(props),//in light mode letter colour is grey and in dark mode letter colour is white
    },
  }),
};

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

// 3. extend the theme
const theme = extendTheme({ config,styles });//in theme we mention config and styles

//in chakra provider we send theme
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
  <BrowserRouter>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

