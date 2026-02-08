import React, { useMemo, useState, useEffect } from "react";
import styles from "./TaskCard.module.css";
import { useDrag } from "react-dnd";

export default function TaskCard({ task, socket }) {
    const [IsEditing, setIsEditing] = useState(false);

    const [Title, setTitle] = useState(task.title);
    const [Description, setDescription] = useState(task.description || "");
    const [Priority, setPriority] = useState(task.priority || "low");
    const [Category, setCategory] = useState(task.category || "general");
    const [Status, setStatus] = useState(task.status || "todo");
    const [Attachments, setAttachments] = useState(task.attachments || []);
    const [PreviewFile, setPreviewFile] = useState(null);

    useEffect(() => {
        setTitle(task.title);
        setDescription(task.description || "");
        setPriority(task.priority || "low");
        setCategory(task.category || "general");
        setStatus(task.status || "todo");
        setAttachments(task.attachments || []);
    }, [task]);


    const [{ IsDragging }, dragRef] = useDrag(() => ({
        type: "TASK",
        item: { id: task.id },
        canDrag: !IsEditing,
        collect: (monitor) => ({
            IsDragging: monitor.isDragging(),
        }),
    }));

    const PriorityLabel = useMemo(() => {
        if (Priority === "high") return "High";
        if (Priority === "medium") return "Medium";
        return "Low";
    }, [Priority]);

    function HandleDelete() {
        socket.emit("task:delete", { id: task.id });
    }

    function HandleSave() {
        socket.emit("task:update", {
            id: task.id,
            updates: {
                title: Title,
                description: Description,
                priority: Priority,
                category: Category,
                status: Status,
                attachments: Attachments,

            },
        });

        setIsEditing(false);
    }

    function HandleCancel() {
        setTitle(task.title);
        setDescription(task.description || "");
        setPriority(task.priority || "low");
        setCategory(task.category || "general");
        setStatus(task.status || "todo");
        setIsEditing(false);
        setAttachments(task.attachments || []);

    }

    function HandleUploadFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        const FileUrl = URL.createObjectURL(file);

        const NewAttachment = {
            name: file.name,
            type: file.type,
            url: FileUrl,
        };

        const UpdatedAttachments = [...Attachments, NewAttachment];
        setAttachments(UpdatedAttachments);

        // Update backend (simulated storage)
        socket.emit("task:update", {
            id: task.id,
            updates: { attachments: UpdatedAttachments, },
        });

        // Reset input so same file can be uploaded again
        e.target.value = "";
    }


    return (
        <div ref={dragRef}
            className={`${styles.card} ${IsDragging ? styles.dragging : ""}`}
        >

            {!IsEditing ? (
                <>  {/*not editing */}
                    <div className={styles.header}>
                        <h4 className={styles.title}>{task.title}</h4>

                        <button className={styles.deleteBtn} onClick={HandleDelete}>
                            ✖
                        </button>
                    </div>

                    <p className={styles.description}>{task.description || "—"}</p>

                    <div className={styles.meta}>
                        <span className={styles.badge}>Priority: {PriorityLabel}</span>
                        <span className={styles.badge}>Category: {task.category}</span>
                    </div>

                    <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                        Edit
                    </button>

                    {Array.isArray(task.attachments) && task.attachments.length > 0 && (
                        <div className={styles.attachments}>
                            <p className={styles.attachmentsTitle}>Attachments</p>

                            <div className={styles.attachmentChips}>
                                {task.attachments.map((file, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className={styles.attachmentChip}
                                        onClick={() => setPreviewFile(file)}
                                    >
                                        {file.type?.startsWith("image/") ? "🖼" : "📎"} {file.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}


                </>
            ) : (
                <>
                    <input
                        className={styles.input}
                        value={Title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Task title"
                    />

                    <textarea
                        className={styles.textarea}
                        value={Description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Task description"
                    />

                    <div className={styles.fieldRow}>
                        <div className={styles.field}>
                            <label className={styles.label}>Priority</label>
                            <select
                                className={styles.select}
                                value={Priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Category</label>
                            <select
                                className={styles.select}
                                value={Category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="bug">Bug</option>
                                <option value="feature">Feature</option>
                                <option value="enhancement">Enhancement</option>
                            </select>
                        </div>
                    </div>


                    <div className={styles.field}>
                        <label className={styles.label}>Status</label>
                        <select
                            className={styles.select}
                            value={Status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="todo">To Do</option>
                            <option value="inprogress">In Progress</option>
                            <option value="done">Done</option>
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Upload Attachment</label>
                        <input
                            type="file"
                            className={styles.fileInput}
                            onChange={HandleUploadFile}
                        />
                    </div>


                    <div className={styles.actions}>
                        <button className={styles.saveBtn} onClick={HandleSave}>
                            Save
                        </button>
                        <button className={styles.cancelBtn} onClick={HandleCancel}>
                            Cancel
                        </button>
                    </div>

                    {Attachments.length > 0 && (
                        <div className={styles.attachments}>
                            <p className={styles.attachmentsTitle}>Selected Attachments</p>

                            <div className={styles.attachmentChips}>
                                {Attachments.map((file, index) => (
                                    <div key={index} className={styles.attachmentChipRow}>
                                        <button
                                            type="button"
                                            className={styles.attachmentChip}
                                            onClick={() => setPreviewFile(file)}
                                        >
                                            {file.type?.startsWith("image/") ? "🖼" : "📎"} {file.name}
                                        </button>

                                        <button
                                            type="button"
                                            className={styles.removeAttachmentBtn}
                                            onClick={() => {
                                                const Updated = Attachments.filter((_, i) => i !== index);
                                                setAttachments(Updated);

                                                socket.emit("task:update", {
                                                    id: task.id,
                                                    updates: { attachments: Updated },
                                                });
                                            }}
                                        >
                                            ❌
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </>
            )}

            {PreviewFile && (
                <div className={styles.previewOverlay} onClick={() => setPreviewFile(null)}>
                    <div
                        className={styles.previewModal}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.previewHeader}>
                            <p className={styles.previewName}>{PreviewFile.name}</p>
                            <button
                                className={styles.previewClose}
                                onClick={() => setPreviewFile(null)}
                            >
                                ✖
                            </button>
                        </div>

                        {PreviewFile.type?.startsWith("image/") ? (
                            <img
                                src={PreviewFile.url}
                                alt={PreviewFile.name}
                                className={styles.previewImage}
                            />
                        ) : (
                            <a
                                href={PreviewFile.url}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.previewLink}
                            >
                                Open file
                            </a>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}
