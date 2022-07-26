import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";

import ListMaxIndentLevelPlugin from "./plugins/ListMaxIndentLevelPlugin";
import CodeHighlightPlugin from "./plugins/CodeHighlightPlugin";
import AutoLinkPlugin from "./plugins/AutoLinkPlugin";
import ExampleTheme from "./themes/rspTheme";

import {View} from '@adobe/react-spectrum';

const editorConfig = {
  namespace: 'rsp-rte',
  onError(error: Error) {
    throw error;
  },
  theme: ExampleTheme,
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    AutoLinkNode,
    LinkNode
  ]
};

function Placeholder() {
  return <div className="react-spectrum-RichTextEditor-placeholder">Enter some rich text...</div>;
}

// TODO: likely similar props to TextArea
interface RichTextEditorProps {
  /** Whether the input should be displayed with a quiet style. */
  isQuiet?: boolean
}

export default function RichTextEditor(props: RichTextEditorProps) {
  const {isQuiet} = props;
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <View padding="size-200" position="relative">
        <ToolbarPlugin isQuiet={isQuiet} />
        <View position="relative" UNSAFE_className={`react-spectrum-RichTextEditor-inner ${isQuiet ? 'react-spectrum-RichTextEditor-inner--quiet' : ''}`}>
          <RichTextPlugin
            contentEditable={<ContentEditable className="react-spectrum-RichTextEditor-input" />}
            placeholder={<Placeholder />}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <CodeHighlightPlugin />
          <ListPlugin />
          <LinkPlugin />
          <AutoLinkPlugin />
          <ListMaxIndentLevelPlugin maxDepth={7} />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        </View>
      </View>
    </LexicalComposer>
  );
}
