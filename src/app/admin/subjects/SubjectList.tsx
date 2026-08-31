"use client";

import { useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { reorderSubjects, updateSubject } from "./actions";
import Link from "next/link";

interface SubjectListProps {
  initialSubjects: any[];
}

export default function SubjectList({ initialSubjects }: SubjectListProps) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    setSubjects(initialSubjects);
  }, [initialSubjects]);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    const items = Array.from(subjects);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSubjects(items);

    try {
      await reorderSubjects(items);
    } catch (error) {
      console.error("Failed to reorder subjects:", error);
      setSubjects(initialSubjects);
    }
  };

  const handleEdit = (subject: any) => {
    setEditingId(subject.id);
    setEditTitle(subject.title);
    setEditDescription(subject.description || "");
  };

  const handleSave = async (id: string) => {
    if (!editTitle.trim()) return;

    // Optimistic update
    const updatedSubjects = subjects.map((s) =>
      s.id === id
        ? { ...s, title: editTitle, description: editDescription }
        : s,
    );
    setSubjects(updatedSubjects);
    setEditingId(null);

    try {
      await updateSubject(id, editTitle, editDescription);
    } catch (error) {
      console.error("Failed to update subject:", error);
      setSubjects(initialSubjects);
    }
  };

  // Remove the dummy source line

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="subjects" direction="vertical">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {subjects.map((subject, index) => (
              <Draggable
                key={subject.id}
                draggableId={subject.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="card"
                    style={{
                      ...provided.draggableProps.style,
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "24px",
                      padding: "20px",
                      boxShadow: snapshot.isDragging
                        ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                        : "none",
                      border: snapshot.isDragging
                        ? "2px solid var(--primary)"
                        : "1px solid var(--border)",
                      zIndex: snapshot.isDragging ? 100 : 1,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      {...provided.dragHandleProps}
                      style={{
                        cursor: "grab",
                        color: "#94A3B8",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="9" cy="12" r="1" />
                        <circle cx="9" cy="5" r="1" />
                        <circle cx="9" cy="19" r="1" />
                        <circle cx="15" cy="12" r="1" />
                        <circle cx="15" cy="5" r="1" />
                        <circle cx="15" cy="19" r="1" />
                      </svg>
                    </div>

                    <div style={{ fontSize: "2.5rem" }}>📚</div>

                    <div style={{ flex: 1 }}>
                      {editingId === subject.id ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="input"
                            style={{
                              margin: 0,
                              padding: "8px 12px",
                              fontWeight: 600,
                            }}
                            placeholder="Judul Mata Pelajaran"
                            autoFocus
                          />
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="input"
                            style={{
                              margin: 0,
                              padding: "8px 12px",
                              minHeight: "60px",
                              fontSize: "0.875rem",
                            }}
                            placeholder="Deskripsi (Opsional)"
                          />
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => handleSave(subject.id)}
                              className="btn btn-primary"
                              style={{
                                padding: "6px 12px",
                                fontSize: "0.875rem",
                              }}
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="btn btn-secondary"
                              style={{
                                padding: "6px 12px",
                                fontSize: "0.875rem",
                              }}
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "4px",
                            }}
                          >
                            <h3 style={{ margin: 0 }}>{subject.title}</h3>
                            <button
                              onClick={() => handleEdit(subject)}
                              style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                padding: "4px",
                                opacity: 0.5,
                                transition: "opacity 0.2s",
                              }}
                              title="Edit Mata Pelajaran"
                            >
                              ✏️
                            </button>
                          </div>
                          <p
                            style={{
                              color: "#64748B",
                              fontSize: "0.875rem",
                              margin: 0,
                            }}
                          >
                            {subject.description}
                          </p>
                        </>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      <span
                        className="badge"
                        style={{
                          backgroundColor: subject.is_active
                            ? "#DCFCE7"
                            : "#F1F5F9",
                          color: subject.is_active ? "#166534" : "#64748B",
                        }}
                      >
                        {subject.is_active ? "Aktif" : "Draft"}
                      </span>
                      <Link
                        href={`/admin/subjects/${subject.id}`}
                        className="btn btn-secondary"
                        style={{ padding: "8px 16px", fontSize: "0.875rem" }}
                      >
                        Kelola Modul →
                      </Link>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
