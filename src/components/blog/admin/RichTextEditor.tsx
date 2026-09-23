"use client";

import "highlight.js/styles/github-dark.css";
import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { TextSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { Placeholder } from "@tiptap/extensions";
import { common, createLowlight } from "lowlight";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Code,
  SquareCode,
  Check,
  X,
  Table as TableIcon,
  Minus,
  FileText,
} from "lucide-react";
import MediaLibraryModal from "./MediaLibraryModal";
import { looksLikeMarkdown, markdownToArticle } from "@/lib/blog/markdown";

const lowlight = createLowlight(common);

const CODE_LANGUAGES = [
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "json", label: "JSON" },
  { value: "bash", label: "Terminal / Bash" },
  { value: "sql", label: "SQL" },
  { value: "plaintext", label: "Teks biasa" },
];

type Props = {
  content: string;
  onChange: (html: string) => void;
  /** Dipanggil saat Markdown yang di-paste diawali "# Judul" */
  onMarkdownTitle?: (h1: string) => void;
};

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
      className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
        active ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-200/60"
      }`}
    >
      {children}
    </button>
  );
}

const Divider = () => <div className="w-px h-5 bg-slate-300 mx-1" />;

/**
 * Terapkan H2/H3 hanya pada teks yang disorot (paragraf dipecah), bukan seluruh
 * paragraf. Diadaptasi dari editor Falya.
 */
function applyHeading(editor: Editor, level: 2 | 3) {
  editor
    .chain()
    .focus()
    .command(({ tr, state, dispatch }) => {
      const { $from, $to } = state.selection;
      if (state.selection.empty || !$from.sameParent($to)) return false;
      if (!dispatch) return true;

      const parentStart = $from.start();
      if ($to.pos < $to.end()) tr.split($to.pos);
      const mappedFrom = tr.mapping.map($from.pos);
      if (mappedFrom > tr.mapping.map(parentStart)) tr.split(mappedFrom);

      const selFrom = tr.mapping.map($from.pos, 1);
      const selTo = tr.mapping.map($to.pos, -1);
      tr.setSelection(TextSelection.create(tr.doc, selFrom, selTo));
      return true;
    })
    .run();
  editor.chain().focus().toggleHeading({ level }).run();
}

export default function RichTextEditor({ content, onChange, onMarkdownTitle }: Props) {
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [showMedia, setShowMedia] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ src: string; alt: string } | null>(null);
  const [markdownDraft, setMarkdownDraft] = useState<string | null>(null);

  // editorProps dibuat sekali saat editor dibuat, jadi callback terbaru disimpan di ref
  const editorRef = useRef<Editor | null>(null);
  const onMarkdownTitleRef = useRef(onMarkdownTitle);
  useEffect(() => {
    onMarkdownTitleRef.current = onMarkdownTitle;
  }, [onMarkdownTitle]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] }, // H1 = headline artikel
        link: false,
        codeBlock: false,
      }),
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        // target/rel diatur saat render: internal tanpa _blank, eksternal _blank
        HTMLAttributes: { target: null, rel: null },
      }),
      ImageExtension.configure({ allowBase64: false }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: "plaintext" }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: "Tulis artikel di sini, atau paste teks Markdown (# Judul, ## Subjudul, - list, ```kode```)…",
      }),
    ],
    content: content || "",
    immediatelyRender: false,
    // Toolbar membaca editor.isActive(), jadi render ulang setiap transaksi
    shouldRerenderOnTransaction: true,
    onCreate: ({ editor }) => {
      editorRef.current = editor;
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      // Paste Markdown (mis. dari ChatGPT/Claude/file .md) langsung jadi teks terformat.
      // Pakai text/plain walau ada text/html: VS Code mengirim HTML berisi source mentah.
      handlePaste: (_view, event) => {
        const text = event.clipboardData?.getData("text/plain") ?? "";
        const ed = editorRef.current;
        if (!ed || !looksLikeMarkdown(text)) return false;
        event.preventDefault();
        const { html, h1 } = markdownToArticle(text);
        ed.chain().focus().insertContent(html).run();
        if (h1) onMarkdownTitleRef.current?.(h1);
        return true;
      },
      attributes: {
        class:
          "prose prose-slate max-w-none min-h-[480px] p-5 focus:outline-none prose-headings:font-poppins prose-pre:bg-[#0d1117] prose-code:before:content-none prose-code:after:content-none",
      },
    },
  });

  if (!editor) {
    return (
      <div className="border border-slate-300 rounded-xl bg-white min-h-[530px] flex items-center justify-center text-sm text-slate-400">
        Memuat editor…
      </div>
    );
  }

  const state = {
    bold: editor.isActive("bold"),
    italic: editor.isActive("italic"),
    h2: editor.isActive("heading", { level: 2 }),
    h3: editor.isActive("heading", { level: 3 }),
    bullet: editor.isActive("bulletList"),
    ordered: editor.isActive("orderedList"),
    quote: editor.isActive("blockquote"),
    code: editor.isActive("code"),
    codeBlock: editor.isActive("codeBlock"),
    codeLanguage: (editor.getAttributes("codeBlock").language as string) || "plaintext",
    link: editor.isActive("link"),
    table: editor.isActive("table"),
  };

  const applyMarkdown = () => {
    const text = (markdownDraft ?? "").trim();
    if (!text) return;
    if (
      !editor.isEmpty &&
      !confirm("Isi editor saat ini akan diganti dengan hasil konversi Markdown. Lanjutkan?")
    ) {
      return;
    }
    const { html, h1 } = markdownToArticle(text);
    editor.chain().focus().setContent(html, { emitUpdate: true }).run();
    if (h1) onMarkdownTitle?.(h1);
    setMarkdownDraft(null);
  };

  const applyLink = () => {
    const url = (linkUrl ?? "").trim();
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const href = /^(https?:\/\/|\/|#|mailto:)/i.test(url) ? url : `https://${url}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    setLinkUrl(null);
  };

  const insertImage = () => {
    if (!pendingImage) return;
    editor.chain().focus().setImage({ src: pendingImage.src, alt: pendingImage.alt.trim() }).run();
    setPendingImage(null);
  };

  return (
    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-400 transition">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 p-2 border-b border-slate-200 bg-slate-50">
        <ToolbarButton title="Tebal" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Miring" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton title="Heading 2 (subjudul utama)" active={state.h2} onClick={() => applyHeading(editor, 2)}>
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Heading 3 (sub-subjudul)" active={state.h3} onClick={() => applyHeading(editor, 3)}>
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton title="Daftar poin" active={state.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Daftar angka" active={state.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Kutipan" active={state.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Garis pemisah" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="w-4 h-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton title="Kode inline" active={state.code} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Blok kode" active={state.codeBlock} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <SquareCode className="w-4 h-4" />
        </ToolbarButton>
        {state.codeBlock && (
          <select
            value={state.codeLanguage}
            onChange={(e) =>
              editor.chain().focus().updateAttributes("codeBlock", { language: e.target.value }).run()
            }
            className="ml-1 px-2 py-1 text-xs rounded-md border border-slate-300 bg-white"
            aria-label="Bahasa kode"
          >
            {CODE_LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        )}
        <Divider />
        <ToolbarButton
          title="Link"
          active={state.link}
          onClick={() => setLinkUrl(editor.getAttributes("link").href || "")}
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        {state.link && (
          <ToolbarButton title="Hapus link" onClick={() => editor.chain().focus().unsetLink().run()}>
            <Unlink className="w-4 h-4 text-red-500" />
          </ToolbarButton>
        )}
        <ToolbarButton title="Sisipkan gambar" onClick={() => setShowMedia(true)}>
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Sisipkan tabel 3×3"
          active={state.table}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <TableIcon className="w-4 h-4" />
        </ToolbarButton>
        <Divider />
        <button
          type="button"
          onClick={() => setMarkdownDraft("")}
          title="Tempel seluruh artikel dalam format Markdown"
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 text-red-700 bg-red-50 hover:bg-red-100 transition cursor-pointer"
        >
          <FileText className="w-4 h-4" /> Tempel Markdown
        </button>
        <Divider />
        <ToolbarButton title="Urungkan" onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Ulangi" onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {markdownDraft !== null && (
        <div className="p-3 bg-slate-100 border-b border-slate-200 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm font-semibold text-slate-800">Tempel artikel Markdown</p>
            <p className="text-xs text-slate-500 hidden sm:block">
              Baris pertama &quot;# Judul&quot; otomatis mengisi Headline &amp; Judul SEO yang masih kosong.
            </p>
            <button
              type="button"
              onClick={() => setMarkdownDraft(null)}
              className="ml-auto p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            autoFocus
            rows={12}
            value={markdownDraft}
            onChange={(e) => setMarkdownDraft(e.target.value)}
            placeholder={"# Judul Artikel\n\nParagraf pembuka...\n\n## Subjudul\n\n- poin satu\n- poin dua\n\n```html\n<p>contoh kode</p>\n```"}
            className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 bg-white"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyMarkdown}
              disabled={!markdownDraft.trim()}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white disabled:opacity-40 flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Konversi ke artikel
            </button>
            <button
              type="button"
              onClick={() => setMarkdownDraft(null)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-600 cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {linkUrl !== null && (
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-red-600 shrink-0" />
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
            placeholder="/daftar, /blog/slug-artikel, atau https://..."
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white"
          />
          <button type="button" onClick={applyLink} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white flex items-center gap-1 cursor-pointer">
            <Check className="w-3.5 h-3.5" /> Terapkan
          </button>
          <button type="button" onClick={() => setLinkUrl(null)} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Batal">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {pendingImage && (
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pendingImage.src} alt="" className="w-16 h-10 object-cover rounded" />
          <input
            autoFocus
            value={pendingImage.alt}
            onChange={(e) => setPendingImage({ ...pendingImage, alt: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                insertImage();
              }
            }}
            placeholder="Alt text: jelaskan isi gambar (wajib untuk SEO)"
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white"
          />
          <button
            type="button"
            onClick={insertImage}
            disabled={!pendingImage.alt.trim()}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white disabled:opacity-40 cursor-pointer"
          >
            Sisipkan
          </button>
          <button type="button" onClick={() => setPendingImage(null)} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Batal">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {state.table && (
        <div className="px-3 py-1.5 bg-red-50 border-b border-red-100 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
          <span className="text-red-800 mr-1">Tabel:</span>
          {[
            ["+ Kolom", () => editor.chain().focus().addColumnAfter().run()],
            ["− Kolom", () => editor.chain().focus().deleteColumn().run()],
            ["+ Baris", () => editor.chain().focus().addRowAfter().run()],
            ["− Baris", () => editor.chain().focus().deleteRow().run()],
            ["Hapus tabel", () => editor.chain().focus().deleteTable().run()],
          ].map(([label, fn]) => (
            <button
              key={label as string}
              type="button"
              onClick={fn as () => void}
              className="px-2 py-1 bg-white border border-red-200 rounded-md text-red-800 hover:bg-red-100 cursor-pointer"
            >
              {label as string}
            </button>
          ))}
        </div>
      )}

      <MediaLibraryModal
        isOpen={showMedia}
        onClose={() => setShowMedia(false)}
        title="Sisipkan gambar ke artikel"
        onSelect={(m) => {
          setShowMedia(false);
          setPendingImage({ src: m.url, alt: "" });
        }}
      />

      <EditorContent editor={editor} />
    </div>
  );
}
