import React, { useMemo, useCallback } from "react";
import { Slate, Editable, withReact, useSlate, ReactEditor } from "slate-react";
import { HistoryEditor, withHistory } from "slate-history";
import {
  Editor,
  Transforms,
  Text,
  createEditor,
  Element as SlateElement,
  BaseEditor,
} from "slate";
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaCode,
  FaQuoteRight,
} from "react-icons/fa";

type CustomElement = {
  type: "paragraph" | "code" | "heading-one" | "heading-two" | "block-quote";
  children: CustomText[];
};

type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
};

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

const RichEditor: React.FC = () => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  const initialValue: CustomElement[] = useMemo(
    () => [
      {
        type: "paragraph",
        children: [{ text: "Start editing your document here..." }],
      },
    ],
    []
  );

  const renderElement = useCallback((props: any) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);

  return (
    <Slate editor={editor} initialValue={initialValue} onChange={() => {}}>
      <Toolbar />
      <Editable
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        placeholder="Enter some text..."
        style={{
          border: "1px solid #ccc",
          padding: "16px",
          minHeight: "200px",
        }}
      />
    </Slate>
  );
};

const Element: React.FC<{
  attributes: any;
  children: any;
  element: CustomElement;
}> = ({ attributes, children, element }) => {
  switch (element.type) {
    case "code":
      return (
        <pre {...attributes}>
          <code>{children}</code>
        </pre>
      );
    case "heading-one":
      return <h1 {...attributes}>{children}</h1>;
    case "heading-two":
      return <h2 {...attributes}>{children}</h2>;
    case "block-quote":
      return <blockquote {...attributes}>{children}</blockquote>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

const Leaf: React.FC<{ attributes: any; children: any; leaf: CustomText }> = ({
  attributes,
  children,
  leaf,
}) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  return <span {...attributes}>{children}</span>;
};

const Toolbar: React.FC = () => {
  const editor = useSlate();

  const toggleFormat = (format: keyof CustomText) => {
    const isActive = isFormatActive(editor, format);
    Transforms.setNodes(
      editor,
      { [format]: isActive ? undefined : true },
      { match: Text.isText, split: true }
    );
  };

  const isFormatActive = (editor: Editor, format: keyof CustomText) => {
    const [match] = Editor.nodes(editor, {
      match: (n) => (n as any)[format] === true,
      universal: true,
    });
    return !!match;
  };

  const toggleBlock = (format: CustomElement["type"]) => {
    const isActive = isBlockActive(editor, format);
    Transforms.setNodes(
      editor,
      { type: isActive ? "paragraph" : format },
      { match: (n) => Editor.isBlock(editor, n as any) }
    );
  };

  const isBlockActive = (editor: Editor, format: CustomElement["type"]) => {
    const [match] = Editor.nodes(editor, {
      //   match: (n) => n.type === format,
    });
    return !!match;
  };

  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
      <button type="button" onClick={() => toggleFormat("bold")}>
        <FaBold />
      </button>
      <button type="button" onClick={() => toggleFormat("italic")}>
        <FaItalic />
      </button>
      <button type="button" onClick={() => toggleFormat("underline")}>
        <FaUnderline />
      </button>
      <button type="button" onClick={() => toggleFormat("code")}>
        <FaCode />
      </button>
      <button type="button" onClick={() => toggleBlock("heading-one")}>
        H1
      </button>
      <button type="button" onClick={() => toggleBlock("heading-two")}>
        H2
      </button>
      <button type="button" onClick={() => toggleBlock("block-quote")}>
        <FaQuoteRight />
      </button>
    </div>
  );
};

export default RichEditor;
