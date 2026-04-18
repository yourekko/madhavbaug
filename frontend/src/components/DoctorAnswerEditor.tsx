import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, type ReactNode } from 'react';
import {
  FaBold,
  FaCode,
  FaImage,
  FaItalic,
  FaLink,
  FaListOl,
  FaListUl,
  FaQuoteLeft,
  FaArrowRotateLeft,
  FaArrowRotateRight,
  FaStrikethrough,
  FaUnderline,
} from 'react-icons/fa6';
import { apiUploadImage } from '../lib/api';

type Props = {
  token: string;
  /** Called with HTML whenever the document changes */
  onChange: (html: string) => void;
  /** When false, editor is read-only */
  editable: boolean;
  onUploadError?: (message: string) => void;
};

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`dp-tb-btn${active ? ' is-active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

export default function DoctorAnswerEditor({ token, onChange, editable, onUploadError }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { class: 'answer-inline-img' },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Placeholder.configure({
        placeholder: 'Write a clear, evidence-based reply for the patient…',
      }),
    ],
    editable,
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap dp-prose-mirror',
        spellCheck: 'true',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editor, editable]);

  const insertImage = useCallback(() => {
    if (!editor || !editable) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/gif,image/webp';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const { url } = await apiUploadImage('/doctor/uploads/image', file, token);
        editor.chain().focus().setImage({ src: url, alt: '' }).run();
      } catch (e) {
        onUploadError?.(e instanceof Error ? e.message : 'Image upload failed');
      }
    };
    input.click();
  }, [editor, editable, token, onUploadError]);

  const setLink = useCallback(() => {
    if (!editor || !editable) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', prev ?? 'https://');
    if (url === null) return;
    const trimmed = url.trim();
    if (trimmed === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
  }, [editor, editable]);

  if (!editor) return <div className="dp-editor-loading">Loading editor…</div>;

  return (
    <div className="dp-editor-wrap">
      <div className="dp-editor-scroll">
        <EditorContent editor={editor} />
      </div>
      {editable ? (
        <div className="dp-editor-toolbar" role="toolbar" aria-label="Formatting">
          <div className="dp-editor-toolbar-group">
            <label className="dp-tb-select-wrap">
              <span className="visually-hidden">Paragraph or heading</span>
              <select
                className="dp-tb-select"
                aria-label="Text style"
                value={
                  editor.isActive('heading', { level: 1 })
                    ? 'h1'
                    : editor.isActive('heading', { level: 2 })
                      ? 'h2'
                      : editor.isActive('heading', { level: 3 })
                        ? 'h3'
                        : 'p'
                }
                onChange={(e) => {
                  const v = e.target.value;
                  const chain = editor.chain().focus();
                  if (v === 'p') chain.setParagraph().run();
                  else if (v === 'h1') chain.setHeading({ level: 1 }).run();
                  else if (v === 'h2') chain.setHeading({ level: 2 }).run();
                  else if (v === 'h3') chain.setHeading({ level: 3 }).run();
                }}
              >
                <option value="p">Normal</option>
                <option value="h1">Heading 1</option>
                <option value="h2">Heading 2</option>
                <option value="h3">Heading 3</option>
              </select>
            </label>
          </div>
          <div className="dp-editor-toolbar-group">
            <ToolbarButton
              title="Bold"
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <FaBold aria-hidden />
            </ToolbarButton>
            <ToolbarButton
              title="Italic"
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <FaItalic aria-hidden />
            </ToolbarButton>
            <ToolbarButton
              title="Underline"
              active={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <FaUnderline aria-hidden />
            </ToolbarButton>
            <ToolbarButton
              title="Strikethrough"
              active={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <FaStrikethrough aria-hidden />
            </ToolbarButton>
          </div>
          <div className="dp-editor-toolbar-group">
            <ToolbarButton
              title="Numbered list"
              active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <FaListOl aria-hidden />
            </ToolbarButton>
            <ToolbarButton
              title="Bullet list"
              active={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <FaListUl aria-hidden />
            </ToolbarButton>
          </div>
          <div className="dp-editor-toolbar-group">
            <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
              <FaLink aria-hidden />
            </ToolbarButton>
            <ToolbarButton title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
              <FaQuoteLeft aria-hidden />
            </ToolbarButton>
            <ToolbarButton title="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
              <FaCode aria-hidden />
            </ToolbarButton>
            <ToolbarButton title="Insert image" onClick={insertImage}>
              <FaImage aria-hidden />
            </ToolbarButton>
          </div>
          <div className="dp-editor-toolbar-group dp-editor-toolbar-group--end">
            <ToolbarButton title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
              <FaArrowRotateLeft aria-hidden />
            </ToolbarButton>
            <ToolbarButton title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
              <FaArrowRotateRight aria-hidden />
            </ToolbarButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
