import { Provider, defaultTheme, View } from '@adobe/react-spectrum';
import RichTextEditor from './RichTextEditor';
import './App.css';

function App() {
  return (
    <Provider theme={defaultTheme}>
       <View padding="size-500">
        <h1>React Spectrum + Lexical</h1>
        <RichTextEditor />
        <h2>Quiet variant:</h2>
        <RichTextEditor isQuiet />
      </View>
    </Provider>
  );
}

export default App;
