import { Provider, defaultTheme } from '@adobe/react-spectrum';
import RichTextEditor from './RichTextEditor';
import './App.css';

function App() {
  return (
    <Provider theme={defaultTheme}>
      <RichTextEditor />
      <RichTextEditor isQuiet />
    </Provider>
  );
}

export default App;
