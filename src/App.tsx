import { Provider, defaultTheme } from '@adobe/react-spectrum';
import Editor from './Editor';
import './App.css';

function App() {
  return (
    <Provider theme={defaultTheme}>
      <Editor />
    </Provider>
  );
}

export default App;
