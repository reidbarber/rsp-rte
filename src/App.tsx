import { Provider, defaultTheme } from '@adobe/react-spectrum';
import RichTextEditor from './RichTextEditor';
import './App.css';

function App() {
  return (
    <Provider theme={defaultTheme}>
      <h1>React Spectrum + Lexical</h1>
      <RichTextEditor />
      <span>Quiet variation:</span>
      <RichTextEditor isQuiet />
    </Provider>
  );
}

export default App;
