
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from "react-router-dom";
import { Provider } from 'react-redux';
import { store } from './app/store';
import { LanguageProvider } from './context/LanguageContext.jsx';

createRoot(document.getElementById('root')).render(
  
    <Provider store={store}>
      <LanguageProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </LanguageProvider>
    </Provider>
  ,
)
