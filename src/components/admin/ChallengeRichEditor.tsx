"use client";

import "highlight.js/styles/github-dark.css";
import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Placeholder } from "@tiptap/extensions";
import { common, createLowlight } from "lowlight";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  Code,
  SquareCode,
  Check,
  X,
} from "lucide-react";
import { isRichDescription } from "@/components/ChallengeDescription";

const lowlight = createLowlight(common);

interface Props {
  /** Nama field di FormData */
  name: string;
  /** Isi awal: HTML atau teks polos lama */
  initialValue?: string;
  placeholder?: string;
}

/** Teks polos lama -> HTML paragraf, agar baris & spasi tidak hilang saat dibuka di editor. */
function legacyToHtml(text: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${esc(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`p-2 rounded-lg flex items-center transition cursor-pointer ${
        active ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-200/60"
      }`}
    >
      {children}
    </button>
  );
}

const Divider = () => <div className="w-px h-5 bg-slate-300 mx-1" />;

export default function ChallengeRichEditor({ name, initialValue = "", placeholder }: Props) {
  const startHtml = isRichDescription(initialValue)
    ? initialValue
    : initialValue
      ? legacyToHtml(initialValue)
      : "";
  const [html, setHtml] = useState(startHtml);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false, codeBlock: false }),
      LinkExtension.configure({ openOnClick: false, autolink: true, defaultProtocol: "https" }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: "plaintext" }),
      Placeholder.configure({ placeholder: placeholder ?? "Tulis instruksi soal di sini…" }),
    ],
    content: startHtml,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor }) => setHtml(editor.isEmpty ? "" : editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-slate prose-sm max-w-none min-h-[180px] p-4 focus:outline-none prose-pre:bg-[#0d1117] prose-code:before:content-none prose-code:after:content-none",
      },
    },
  });

  const applyLink = () => {
    if (!editor) return;
    const url = (linkUrl ?? "").trim();
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const href = /^(https?:\/\/|mailto:)/i.test(url) ? url : `https://${url}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    setLinkUrl(null);
  };

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-400 transition">
      <input type="hidden" name={name} value={html} />
      {editor && (
        <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-slate-200 bg-slate-50">
          <ToolbarButton title="Tebal" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton title="Miring" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton title="Daftar poin" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton title="Daftar angka" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton title="Kutipan" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton title="Kode inline" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton title="Blok kode" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <SquareCode className="w-4 h-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton title="Link" active={editor.isActive("link")} onClick={() => setLinkUrl(editor.getAttributes("link").href || "")}>
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          {editor.isActive("link") && (
            <ToolbarButton title="Hapus link" onClick={() => editor.chain().focus().unsetLink().run()}>
              <Unlink className="w-4 h-4 text-red-500" />
            </ToolbarButton>
          )}
          <Divider />
          <ToolbarButton title="Urungkan" onClick={() => editor.chain().focus().undo().run()}>
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton title="Ulangi" onClick={() => editor.chain().focus().redo().run()}>
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>
      )}
      {linkUrl !== null && (
        <div className="flex items-center gap-2 p-2 border-b border-slate-200 bg-white">
          <input
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
            }}
            placeholder="https://…"
            className="flex-1 px-2 py-1 text-sm rounded-md border border-slate-300"
          />
          <button type="button" onClick={applyLink} aria-label="Terapkan link" className="p-1.5 rounded-md text-green-700 hover:bg-green-50 cursor-pointer">
            <Check className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => setLinkUrl(null)} aria-label="Batal" className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
