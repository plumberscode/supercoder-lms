"use client";

import { useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  reorderModules,
  reorderLessons,
  deleteLesson,
  deleteModule,
  updateModule,
  updateLesson,
} from "./actions";
import LessonForm from "./LessonForm";
import Link from "next/link";
import styles from "../../admin.module.css";
import ConfirmModal from "@/components/ConfirmModal";

interface ModuleListProps {
  initialModules: any[];
  subjectId: string;
}

export default function ModuleList({
  initialModules,
  subjectId,
}: ModuleListProps) {
  const [modules, setModules] = useState(initialModules);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [activeAddForm, setActiveAddForm] = useState<{
    moduleId: string;
    type: string;
  } | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);

  useEffect(() => {
    setModules(initialModules);
  }, [initialModules]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    if (type === "module") {
      const items = Array.from(modules);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      setModules(items);

      try {
        await reorderModules(subjectId, items);
      } catch (error) {
        console.error("Failed to reorder modules:", error);
        setModules(initialModules);
      }
    } else if (type === "lesson") {
      const moduleId = source.droppableId;
      const targetModule = modules.find((m) => m.id === moduleId);
      if (!targetModule) return;

      const lessons = Array.from(targetModule.lessons || []);
      const [reorderedItem] = lessons.splice(source.index, 1);
      lessons.splice(destination.index, 0, reorderedItem);

      const updatedModules = modules.map((m) => {
        if (m.id === moduleId) {
          return { ...m, lessons };
        }
        return m;
      });

      setModules(updatedModules);

      try {
        await reorderLessons(subjectId, lessons);
      } catch (error) {
        console.error("Failed to reorder lessons:", error);
        setModules(initialModules);
      }
    }
  };

  const handleEditModule = (module: any) => {
    setEditingModuleId(module.id);
    setEditTitle(module.title);
  };

  const handleSaveModule = async (moduleId: string) => {
    if (!editTitle.trim()) return;

    // Optimistic update
    const updatedModules = modules.map((m) =>
      m.id === moduleId ? { ...m, title: editTitle } : m,
    );
    setModules(updatedModules);
    setEditingModuleId(null);

    try {
      await updateModule(moduleId, subjectId, editTitle);
    } catch (error) {
      console.error("Failed to update module:", error);
      setModules(initialModules);
    }
  };

  const handleEditLesson = (lesson: any) => {
    setEditingLessonId(lesson.id);
    setEditLessonTitle(lesson.title);
  };

  const handleSaveLesson = async (lessonId: string, moduleId: string) => {
    if (!editLessonTitle.trim()) return;

    // Optimistic update
    const updatedModules = modules.map((m) => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map((l: any) =>
            l.id === lessonId ? { ...l, title: editLessonTitle } : l,
          ),
        };
      }
      return m;
    });
    setModules(updatedModules);
    setEditingLessonId(null);

    try {
      await updateLesson(lessonId, subjectId, editLessonTitle);
    } catch (error) {
      console.error("Failed to update lesson:", error);
      setModules(initialModules);
    }
  };

  const handleDeleteModule = async () => {
    if (!moduleToDelete) return;

    const moduleId = moduleToDelete;
    setModuleToDelete(null);

    // Optimistic update
    const updatedModules = modules.filter((m) => m.id !== moduleId);
    setModules(updatedModules);

    try {
      await deleteModule(moduleId, subjectId);
    } catch (error) {
      console.error("Failed to delete module:", error);
      setModules(initialModules);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="modules" type="module">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={{ display: "flex", flexDirection: "column", gap: "32px" }}
          >
            {modules.map((module, index) => (
              <Draggable key={module.id} draggableId={module.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="card"
                    style={{
                      ...provided.draggableProps.style,
                      boxShadow: snapshot.isDragging
                        ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                        : "none",
                      transition: "all 0.2s ease",
                      border: snapshot.isDragging
                        ? "2px solid var(--primary)"
                        : "1px solid var(--border)",
                      zIndex: snapshot.isDragging ? 100 : 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          flex: 1,
                        }}
                      >
                        <div
                          {...provided.dragHandleProps}
                          style={{
                            cursor: "grab",
                            color: "#94A3B8",
                            display: "flex",
                            alignItems: "center",
                            padding: "4px",
                          }}
                        >
                          <svg
                            width="20"
                            height="20"
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
                        {editingModuleId === module.id ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              flex: 1,
                              alignItems: "center",
                            }}
                          >
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="input"
                              style={{
                                margin: 0,
                                padding: "4px 8px",
                                fontSize: "1.25rem",
                                fontWeight: 600,
                                flex: 1,
                              }}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleSaveModule(module.id);
                                if (e.key === "Escape")
                                  setEditingModuleId(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveModule(module.id)}
                              className="btn btn-primary"
                              style={{ padding: "6px 12px" }}
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => setEditingModuleId(null)}
                              className="btn btn-secondary"
                              style={{ padding: "6px 12px" }}
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>
                              {module.title}
                            </h2>
                            <button
                              onClick={() => handleEditModule(module)}
                              style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                padding: "4px",
                                opacity: 0.5,
                                transition: "opacity 0.2s",
                                fontSize: "1rem",
                              }}
                              className="edit-button"
                              title="Edit Nama Modul"
                            >
                              ✏️
                            </button>
                          </div>
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
                          style={{
                            fontSize: "0.875rem",
                            color: "#94A3B8",
                            fontWeight: 600,
                          }}
                        >
                          MODUL {index + 1}
                        </span>
                        <button
                          onClick={() => setModuleToDelete(module.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            color: "#EF4444",
                            opacity: 0.5,
                            transition: "opacity 0.2s",
                            fontSize: "1rem",
                          }}
                          className="delete-button"
                          title="Hapus Modul"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <Droppable droppableId={module.id} type="lesson">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            marginBottom: "24px",
                          }}
                        >
                          {(module.lessons || []).map(
                            (lesson: any, lessonIndex: number) => (
                              <Draggable
                                key={lesson.id}
                                draggableId={lesson.id}
                                index={lessonIndex}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      padding: "12px 16px",
                                      backgroundColor: snapshot.isDragging
                                        ? "#EEF2FF"
                                        : "#F8FAFC",
                                      borderRadius: "8px",
                                      border: snapshot.isDragging
                                        ? "1px solid var(--primary)"
                                        : "1px solid var(--border)",
                                      boxShadow: snapshot.isDragging
                                        ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                                        : "none",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                      }}
                                    >
                                      <div
                                        {...provided.dragHandleProps}
                                        style={{
                                          cursor: "grab",
                                          color: "#CBD5E1",
                                          display: "flex",
                                          alignItems: "center",
                                        }}
                                      >
                                        <svg
                                          width="16"
                                          height="16"
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
                                      <div style={{ flex: 1 }}>
                                        {editingLessonId === lesson.id ? (
                                          <div
                                            style={{
                                              display: "flex",
                                              gap: "8px",
                                              alignItems: "center",
                                              width: "100%",
                                            }}
                                          >
                                            <input
                                              type="text"
                                              value={editLessonTitle}
                                              onChange={(e) =>
                                                setEditLessonTitle(
                                                  e.target.value,
                                                )
                                              }
                                              className="input"
                                              style={{
                                                margin: 0,
                                                padding: "4px 8px",
                                                fontSize: "0.875rem",
                                                fontWeight: 600,
                                                flex: 1,
                                              }}
                                              autoFocus
                                              onKeyDown={(e) => {
                                                if (e.key === "Enter")
                                                  handleSaveLesson(
                                                    lesson.id,
                                                    module.id,
                                                  );
                                                if (e.key === "Escape")
                                                  setEditingLessonId(null);
                                              }}
                                            />
                                            <button
                                              onClick={() =>
                                                handleSaveLesson(
                                                  lesson.id,
                                                  module.id,
                                                )
                                              }
                                              className="btn btn-primary"
                                              style={{
                                                padding: "4px 8px",
                                                fontSize: "0.75rem",
                                              }}
                                            >
                                              Simpan
                                            </button>
                                            <button
                                              onClick={() =>
                                                setEditingLessonId(null)
                                              }
                                              className="btn btn-secondary"
                                              style={{
                                                padding: "4px 8px",
                                                fontSize: "0.75rem",
                                              }}
                                            >
                                              Batal
                                            </button>
                                          </div>
                                        ) : (
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "8px",
                                            }}
                                          >
                                            <div style={{ fontWeight: 600 }}>
                                              {lesson.title}
                                            </div>
                                            <button
                                              onClick={() =>
                                                handleEditLesson(lesson)
                                              }
                                              style={{
                                                background: "transparent",
                                                border: "none",
                                                cursor: "pointer",
                                                padding: "2px",
                                                opacity: 0.5,
                                                fontSize: "0.875rem",
                                              }}
                                              title="Edit Nama Materi"
                                            >
                                              ✏️
                                            </button>
                                          </div>
                                        )}
                                        <div
                                          style={{
                                            fontSize: "0.75rem",
                                            color: "#64748B",
                                          }}
                                        >
                                          {lesson.type.toUpperCase()}{" "}
                                          {lesson.description &&
                                            `• ${lesson.description}`}
                                        </div>
                                      </div>
                                    </div>
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: "8px",
                                        alignItems: "center",
                                      }}
                                    >
                                      {lesson.type === "quiz" && (
                                        <Link
                                          href={`/admin/quizzes/${lesson.id}`}
                                          className="btn btn-secondary"
                                          style={{
                                            padding: "6px 12px",
                                            fontSize: "0.75rem",
                                          }}
                                        >
                                          Kelola Soal
                                        </Link>
                                      )}
                                      <form
                                        action={deleteLesson.bind(
                                          null,
                                          lesson.id,
                                          subjectId,
                                        )}
                                      >
                                        <button
                                          className="btn"
                                          style={{
                                            padding: "8px",
                                            color: "#EF4444",
                                            backgroundColor: "transparent",
                                          }}
                                        >
                                          🗑️
                                        </button>
                                      </form>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ),
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>

                    <div
                      style={{
                        marginTop: "24px",
                        borderTop: "1px solid var(--border)",
                        paddingTop: "24px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          alignItems: "center",
                          marginBottom:
                            activeAddForm?.moduleId === module.id ? "16px" : 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "#64748B",
                          }}
                        >
                          TAMBAH:
                        </span>
                        <button
                          onClick={() =>
                            setActiveAddForm(
                              activeAddForm?.moduleId === module.id &&
                                activeAddForm?.type === "text"
                                ? null
                                : { moduleId: module.id, type: "text" },
                            )
                          }
                          className="btn"
                          style={{
                            padding: "8px 16px",
                            fontSize: "0.875rem",
                            backgroundColor:
                              activeAddForm?.moduleId === module.id &&
                              activeAddForm?.type === "text"
                                ? "var(--primary)"
                                : "#F1F5F9",
                            color:
                              activeAddForm?.moduleId === module.id &&
                              activeAddForm?.type === "text"
                                ? "white"
                                : "var(--secondary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          📖 Materi
                        </button>
                        <button
                          onClick={() =>
                            setActiveAddForm(
                              activeAddForm?.moduleId === module.id &&
                                activeAddForm?.type === "project"
                                ? null
                                : { moduleId: module.id, type: "project" },
                            )
                          }
                          className="btn"
                          style={{
                            padding: "8px 16px",
                            fontSize: "0.875rem",
                            backgroundColor:
                              activeAddForm?.moduleId === module.id &&
                              activeAddForm?.type === "project"
                                ? "var(--primary)"
                                : "#F1F5F9",
                            color:
                              activeAddForm?.moduleId === module.id &&
                              activeAddForm?.type === "project"
                                ? "white"
                                : "var(--secondary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          📝 Pengumpulan Tugas
                        </button>
                        <button
                          onClick={() =>
                            setActiveAddForm(
                              activeAddForm?.moduleId === module.id &&
                                activeAddForm?.type === "quiz"
                                ? null
                                : { moduleId: module.id, type: "quiz" },
                            )
                          }
                          className="btn"
                          style={{
                            padding: "8px 16px",
                            fontSize: "0.875rem",
                            backgroundColor:
                              activeAddForm?.moduleId === module.id &&
                              activeAddForm?.type === "quiz"
                                ? "var(--primary)"
                                : "#F1F5F9",
                            color:
                              activeAddForm?.moduleId === module.id &&
                              activeAddForm?.type === "quiz"
                                ? "white"
                                : "var(--secondary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          🧠 Kuis
                        </button>
                      </div>

                      {activeAddForm && activeAddForm.moduleId === module.id && (
                        <div style={{ position: "relative" }}>
                          <button
                            onClick={() => setActiveAddForm(null)}
                            style={{
                              position: "absolute",
                              right: "12px",
                              top: "28px",
                              zIndex: 10,
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "1.25rem",
                              color: "#94A3B8",
                            }}
                          >
                            ✕
                          </button>
                          <LessonForm
                            key={`${module.id}-${activeAddForm.type}`}
                            moduleId={module.id}
                            subjectId={subjectId}
                            orderIndex={(module.lessons?.length || 0) + 1}
                            initialType={activeAddForm.type}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <ConfirmModal
        isOpen={!!moduleToDelete}
        onClose={() => setModuleToDelete(null)}
        onConfirm={handleDeleteModule}
        title="Hapus Modul?"
        message="Apakah Anda yakin ingin menghapus modul ini? Seluruh materi di dalamnya akan ikut terhapus secara permanen."
        confirmText="Hapus Modul"
      />
    </DragDropContext>
  );
}
