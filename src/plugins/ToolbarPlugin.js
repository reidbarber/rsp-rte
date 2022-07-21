import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
} from "lexical";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  $isParentElementRTL,
  $wrapLeafNodesInElements,
  $isAtNodeEnd,
} from "@lexical/selection";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from "@lexical/list";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
} from "@lexical/rich-text";
import {
  $createCodeNode,
  $isCodeNode,
  getDefaultCodeLanguage,
  getCodeLanguages,
} from "@lexical/code";
import TextBulleted from "@spectrum-icons/workflow/TextBulleted";
import TextNumbered from "@spectrum-icons/workflow/TextNumbered";
import Code from "@spectrum-icons/workflow/Code";
import TextIncrease from "@spectrum-icons/workflow/TextIncrease";
import TextDecrease from "@spectrum-icons/workflow/TextDecrease";
import TextAlignLeft from "@spectrum-icons/workflow/TextAlignLeft";
import TextAlignRight from "@spectrum-icons/workflow/TextAlignRight";
import TextAlignCenter from "@spectrum-icons/workflow/TextAlignCenter";
import Link from "@spectrum-icons/workflow/Link";
import TextStrikethrough from "@spectrum-icons/workflow/TextStrikethrough";
import TextItalic from "@spectrum-icons/workflow/TextItalic";
import TextBold from "@spectrum-icons/workflow/TextBold";
import { ActionGroup, Divider, Flex, Item, Text } from "@adobe/react-spectrum";
import Undo from "@spectrum-icons/workflow/Undo";
import Redo from "@spectrum-icons/workflow/Redo";
import TextAlignJustify from "@spectrum-icons/workflow/TextAlignJustify";
import TextUnderline from "@spectrum-icons/workflow/TextUnderline";
import TextParagraph from "@spectrum-icons/workflow/TextParagraph";

const Low_Priority = 1;

function getSelectedNode(selection) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
  }
}

const HISTORY_COMMANDS = {
  undo: UNDO_COMMAND,
  redo: REDO_COMMAND,
};

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] = useState("paragraph");
  const [selectedElementKey, setSelectedElementKey] = useState(null);
  let [selectedCodeLanguage, setSelectedCodeLanguage] = useState(
    new Set(['js'])
  );
  let [selectedFormatOptions, setSelectedFormatOptions] = useState(new Set());
  let [selectedBlockType, setSelectedBlockType] = useState(
    new Set(["paragraph"])
  );

  const formatOptions = useMemo(
    () => [
      { key: "bold", label: "Format bold", icon: <TextBold /> },
      { key: "italic", label: "Format italic", icon: <TextItalic /> },
      { key: "underline", label: "Format underline", icon: <TextUnderline /> },
      {
        key: "strikethrough",
        label: "Format strikethrough",
        icon: <TextStrikethrough />,
      },
      { key: "code", label: "Insert Code", icon: <Code /> },
      { key: "link", label: "Insert Link", icon: <Link /> },
    ],
    []
  );

  let alignmentOptions = useMemo(
    () => [
      { key: "left", label: "Left align", icon: <TextAlignLeft /> },
      { key: "center", label: "Center align", icon: <TextAlignCenter /> },
      { key: "right", label: "Right align", icon: <TextAlignRight /> },
      { key: "justify", label: "Justify align", icon: <TextAlignJustify /> },
    ],
    []
  );

  const codeLanguageOptions = useMemo(
    () => getCodeLanguages().map((key) => ({ key })),
    []
  );

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);
      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type = parentList ? parentList.getTag() : element.getTag();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          setBlockType(type);
          if ($isCodeNode(element)) {
            let nextLanguage = codeLanguageOptions.find(lang => lang.key === element.getLanguage()) || codeLanguageOptions.find(lang => lang.key === getDefaultCodeLanguage()) ;
            setSelectedCodeLanguage(
              new Set([nextLanguage.key])
            );
          }
        }
      }

      // Check if link or parent is link
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      let isLink = $isLinkNode(parent) || $isLinkNode(node);

      // Update text format selected state
      let nextSelectedOptions = new Set([
        ...formatOptions
          .filter((format) => selection.hasFormat(format.key))
          .map((option) => option.key),
        ...(isLink ? ["link"] : []),
      ]);

      setSelectedFormatOptions(nextSelectedOptions);
    }
  }, [codeLanguageOptions, editor, formatOptions]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          updateToolbar();
          return false;
        },
        Low_Priority
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        Low_Priority
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        Low_Priority
      )
    );
  }, [editor, updateToolbar]);

  const insertLink = useCallback(() => {
    if (!selectedFormatOptions.has("link")) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, selectedFormatOptions]);

  const formatParagraph = useCallback(() => {
    if (blockType !== "paragraph") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapLeafNodesInElements(selection, () => $createParagraphNode());
        }
      });
    }
  }, [blockType, editor]);

  const formatLargeHeading = useCallback(() => {
    if (blockType !== "h1") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapLeafNodesInElements(selection, () => $createHeadingNode("h1"));
        }
      });
    }
  }, [blockType, editor]);

  const formatSmallHeading = useCallback(() => {
    if (blockType !== "h2") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapLeafNodesInElements(selection, () => $createHeadingNode("h2"));
        }
      });
    }
  }, [blockType, editor]);

  const formatBulletList = useCallback(() => {
    if (blockType !== "ul") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND);
    }
  }, [blockType, editor]);

  const formatNumberedList = useCallback(() => {
    if (blockType !== "ol") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND);
    }
  }, [blockType, editor]);

  const formatQuote = useCallback(() => {
    if (blockType !== "quote") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapLeafNodesInElements(selection, () => $createQuoteNode());
        }
      });
    }
  }, [blockType, editor]);

  const formatCode = useCallback(() => {
    if (blockType !== "code") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapLeafNodesInElements(selection, () => $createCodeNode());
        }
      });
    }
  }, [blockType, editor]);

  let blockTypeOptions = useMemo(
    () => [
      {
        key: "paragraph",
        label: "Normal",
        icon: <TextParagraph />,
        formatAction: formatParagraph,
      },
      {
        key: "h1",
        label: "Large Heading",
        icon: <TextIncrease />,
        formatAction: formatLargeHeading,
      },
      {
        key: "h2",
        label: "Small Heading",
        icon: <TextDecrease />,
        formatAction: formatSmallHeading,
      },
      {
        key: "ol",
        label: "Bulleted List",
        icon: <TextBulleted />,
        formatAction: formatBulletList,
      },
      {
        key: "ul",
        label: "Numbered List",
        icon: <TextNumbered />,
        formatAction: formatNumberedList,
      },
      {
        key: "quote",
        label: "Quote",
        icon: <TextAlignJustify />,
        formatAction: formatQuote,
      },
      {
        key: "code",
        label: "Code Block",
        icon: <Code />,
        formatAction: formatCode,
      },
    ],
    [
      formatParagraph,
      formatLargeHeading,
      formatSmallHeading,
      formatBulletList,
      formatNumberedList,
      formatQuote,
      formatCode,
    ]
  );

  return (
    <Flex marginTop="size-100" marginBottom="size-100">
      <ActionGroup
        isQuiet
        buttonLabelBehavior="hide"
        density="compact"
        disabledKeys={[
          ...(canUndo ? [] : ["undo"]),
          ...(canRedo ? [] : ["redo"]),
        ]}
        onAction={(key) => editor.dispatchCommand(HISTORY_COMMANDS[key])}
      >
        <Item key="undo" textValue="Undo">
          <Undo />
          <Text>Undo</Text>
        </Item>
        <Item key="redo" textValue="Redo">
          <Redo />
          <Text>Redo</Text>
        </Item>
      </ActionGroup>
      <Divider
        orientation="vertical"
        size="S"
        marginStart="size-100"
        marginEnd="size-100"
      />
      <ActionGroup
        isQuiet
        aria-label="Block type"
        overflowMode="collapse"
        selectionMode="single"
        selectedKeys={selectedBlockType}
        items={blockTypeOptions}
        buttonLabelBehavior="hide"
        onSelectionChange={(keys) => {
          let key = [...keys][0];
          blockTypeOptions.find((option) => option.key === key).formatAction();
          setSelectedBlockType(keys);
        }}
        disallowEmptySelection
        maxWidth={100}
      >
        {(item) => (
          <Item textValue={item.label} key={item.key}>
            {item.icon}
            <Text>{item.label}</Text>
          </Item>
        )}
      </ActionGroup>
      <Divider
        orientation="vertical"
        size="S"
        marginStart="size-100"
        marginEnd="size-100"
      />
      {blockType === "code" ? (
        <ActionGroup
          isQuiet
          aria-label="Code language"
          overflowMode="collapse"
          selectionMode="single"
          selectedKeys={selectedCodeLanguage}
          items={codeLanguageOptions}
          onSelectionChange={(keys) => {
            editor.update(() => {
              if (selectedElementKey !== null) {
                const node = $getNodeByKey(selectedElementKey);
                if ($isCodeNode(node)) {
                  node.setLanguage([...keys][0]);
                }
              }
            });
            setSelectedCodeLanguage(new Set([...keys][0]));
          }}
          disallowEmptySelection
        >
          {(item) => (
            <Item textValue={item.key} key={item.key}>
              {item.key}
            </Item>
          )}
        </ActionGroup>
      ) : (
        <>
          <ActionGroup
            isQuiet
            aria-label="Format options"
            selectionMode="multiple"
            buttonLabelBehavior="hide"
            density="compact"
            items={formatOptions}
            selectedKeys={selectedFormatOptions}
            onSelectionChange={(keys) => {
              let pressedKeys = [
                ...[...keys].filter((key) => !selectedFormatOptions.has(key)),
                ...[...selectedFormatOptions].filter((key) => !keys.has(key)),
              ];
              if (pressedKeys.includes("link")) {
                insertLink();
              } else {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, ...pressedKeys);
              }
            }}
          >
            {(item) => (
              <Item textValue={item.label} key={item.key}>
                {item.icon}
                <Text>{item.label}</Text>
              </Item>
            )}
          </ActionGroup>
          <Divider
            orientation="vertical"
            size="S"
            marginStart="size-100"
            marginEnd="size-100"
          />
          <ActionGroup
            isQuiet
            aria-label="Alignment options"
            selectionMode="single"
            disallowEmptySelection
            defaultSelectedKeys={["left"]} // TODO: make dependent on locale?
            buttonLabelBehavior="hide"
            density="compact"
            items={alignmentOptions}
            onSelectionChange={(keys) =>
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, ...keys)
            }
          >
            {(item) => (
              <Item textValue={item.label} key={item.key}>
                {item.icon}
                <Text>{item.label}</Text>
              </Item>
            )}
          </ActionGroup>
        </>
      )}
    </Flex>
  );
}
