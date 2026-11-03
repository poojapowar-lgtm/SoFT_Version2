import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  TextStyleKit,
  FontSize,
} from "@tiptap/extension-text-style";
import "./RichTextEditor.css";

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyleKit,
      FontSize,
    ],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "rich-editor-content",
        "data-placeholder": placeholder || "Type here...",
      },
    },
  });

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", {
        emitUpdate: false,
      });
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="rich-editor">
      <div className="rich-toolbar">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}>
          <b>B</b>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}>
          <i>I</i>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <u>U</u>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • List
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. List
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          Heading
        </button>

        <select
          defaultValue=""
          aria-label="Font size"
          onChange={(e) => {
            if (e.target.value) {
              editor.chain().focus().setFontSize(e.target.value).run();
            }
            e.target.value = "";
          }}
        >
          <option value="">Font size</option>
          <option value="12px">12px</option>
          <option value="14px">14px</option>
          <option value="16px">16px</option>
          <option value="18px">18px</option>
          <option value="24px">24px</option>
          <option value="32px">32px</option>
        </select>

        <button
          type="button"
          onClick={() => {
            const url = window.prompt("Enter link URL");
            if (url) {
              editor.chain().focus().extendMarkRange("link")
                .setLink({ href: url }).run();
            }
          }}
        >
          Link
        </button>

        <button type="button" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          Clear
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;