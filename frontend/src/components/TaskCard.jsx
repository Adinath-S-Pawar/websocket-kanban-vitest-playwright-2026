import React, { useMemo, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import styles from "./TaskCard.module.css";
import { useDrag } from "react-dnd";

const Portal = ({ children }) => {
    return ReactDOM.createPortal(children, document.body);
};

function TaskEditModal({ 
    Title, setTitle, 
    Description, setDescription, 
    Priority, setPriority, 
    Category, setCategory, 
    Status, setStatus, 
    Attachments, setAttachments,
    NewAttachments, setNewAttachments, 
    HandleSave, HandleCancel,
    HandleFileChange 
}) {

    const removePendingUpload = (index) => {
        setNewAttachments(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <Portal>
            <div className={styles.modalOverlay} onClick={HandleCancel}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h3>Edit Task</h3>
                        <button className={styles.closeHeaderBtn} onClick={HandleCancel}>✖</button>
                    </div>

                    <div className={styles.modalBody}>
                        {/* Title & Description */}
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Title</label>
                            <input
                                className={styles.input}
                                value={Title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Task title"
                                autoFocus
                            />
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Description</label>
                            <textarea
                                className={styles.textarea}
                                value={Description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Task description"
                            />
                        </div>

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

                        {/* Attachments Section */}
                        <div className={styles.field}>
                            <label className={styles.label}>Attachments</label>
                            
                            {/* Existing File List */}
                            {Attachments.length > 0 && (
                                <ul className={styles.editAttachmentList}>
                                    {Attachments.map((file, index) => (
                                        <li key={index} className={styles.editAttachmentItem}>
                                            <span className={styles.fileName}>
                                                {file.type?.startsWith("image/") ? "🖼" : "📎"} {file.name}
                                            </span>
                                            <button
                                                type="button"
                                                className={styles.removeAttachmentBtn}
                                                onClick={() => {
                                                    const Updated = Attachments.filter((_, i) => i !== index);
                                                    setAttachments(Updated);
                                                }}
                                            >
                                                ❌
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Pending Uploads List */}
                            {NewAttachments.length > 0 && (
                                <div className={styles.pendingUploads}>
                                    <p className={styles.pendingLabel}>Pending Uploads:</p>
                                    <ul className={styles.editAttachmentList}>
                                        {NewAttachments.map((file, index) => (
                                            <li key={index} className={styles.editAttachmentItem}>
                                                <span className={styles.fileName}>🆕 {file.name}</span>
                                                <button
                                                    type="button"
                                                    className={styles.removeAttachmentBtn}
                                                    onClick={() => removePendingUpload(index)}
                                                >
                                                    ❌
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Upload Input */}
                            <div className={styles.uploadArea}>
                                <input
                                    type="file"
                                    className={styles.fileInput}
                                    onChange={HandleFileChange}
                                    multiple 
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button className={styles.saveBtn} onClick={HandleSave}>Save</button>
                        <button className={styles.cancelBtn} onClick={HandleCancel}>Cancel</button>
                    </div>
                </div>
            </div>
        </Portal>
    );
}

export default function TaskCard({ task, socket }) {
    const [IsEditing, setIsEditing] = useState(false);
    
    const [Title, setTitle] = useState(task.title);
    const [Description, setDescription] = useState(task.description || "");
    const [Priority, setPriority] = useState(task.priority || "low");
    const [Category, setCategory] = useState(task.category || "general");
    const [Status, setStatus] = useState(task.status || "todo");
    const [Attachments, setAttachments] = useState(task.attachments || []);
    
    const [NewAttachments, setNewAttachments] = useState([]);

    const [PreviewFile, setPreviewFile] = useState(null);
    const [ShowAttachmentPopup, setShowAttachmentPopup] = useState(false);

    useEffect(() => {
        if (!IsEditing) {
            setTitle(task.title);
            setDescription(task.description || "");
            setPriority(task.priority || "low");
            setCategory(task.category || "general");
            setStatus(task.status || "todo");
            setAttachments(task.attachments || []);
        }
    }, [task, IsEditing]);

    const [{ IsDragging }, dragRef] = useDrag(() => ({
        type: "TASK",
        item: { id: task.id },
        collect: (monitor) => ({
            IsDragging: monitor.isDragging(),
        }),
    }), [task.id]);

    const PriorityClass = useMemo(() => {
        switch (task.priority) {
            case "high": return styles.badgeHigh;
            case "medium": return styles.badgeMedium;
            default: return styles.badgeLow;
        }
    }, [task.priority]);

    function HandleDelete() {
        socket.emit("task:delete", { id: task.id });
    }

    function HandleEditOpen() {
        setIsEditing(true);

        setTitle(task.title);
        setDescription(task.description);
        setPriority(task.priority);
        setCategory(task.category);
        setStatus(task.status || "todo");
        setAttachments(task.attachments || []);
        
        setNewAttachments([]);
    }

    function HandleCancel() {
        setIsEditing(false);
        setNewAttachments([]);
    }

    function HandleFileChange(e) {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        
        setNewAttachments(prev => [...prev, ...files]);
        
        e.target.value = "";
    }

    function HandleSave() {
        let FinalAttachments = [...Attachments];

        if (NewAttachments.length > 0) {
            const processedFiles = NewAttachments.map(file => ({
                name: file.name,
                type: file.type,
                url: URL.createObjectURL(file),
            }));
            FinalAttachments = [...FinalAttachments, ...processedFiles];
        }

        socket.emit("task:update", {
            id: task.id,
            updates: {
                title: Title,
                description: Description,
                priority: Priority,
                category: Category,
                status: Status,
                attachments: FinalAttachments,
            },
        });

        setIsEditing(false);
        setNewAttachments([]);
    }

    return (
        <>
            <div ref={dragRef}
                className={`${styles.card} ${IsDragging ? styles.dragging : ""}`}
                onClick={HandleEditOpen}
            >
                <div className={styles.header}>
                    <h4 className={styles.title}>{task.title}</h4>
                    <div className={styles.actionsHeader}>
                        <button className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); HandleEditOpen(); }}>✏️</button>
                        <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={(e) => { e.stopPropagation(); HandleDelete(); }}>🗑️</button>
                    </div>
                </div>

                <p className={styles.description}>{task.description || "—"}</p>

                <div className={styles.meta}>
                    <span className={`${styles.badge} ${PriorityClass}`}>{task.priority}</span>
                    <span className={`${styles.badge} ${styles.badgeCategory}`}>{task.category}</span>
                </div>

                {/* Attachments Summary Chip */}
                {Array.isArray(task.attachments) && task.attachments.length > 0 && (
                    <div className={styles.attachments}>
                        <div 
                            className={styles.attachmentSummaryChip}
                            onClick={(e) => { e.stopPropagation(); setShowAttachmentPopup(true); }}
                        >
                            📎 {task.attachments.length} Attachment{task.attachments.length > 1 ? "s" : ""}
                        </div>
                    </div>
                )}
            </div>
            
            {/* 1. Edit Modal */}
            {IsEditing && (
                <TaskEditModal 
                    Title={Title} setTitle={setTitle}
                    Description={Description} setDescription={setDescription}
                    Priority={Priority} setPriority={setPriority}
                    Category={Category} setCategory={setCategory}
                    Status={Status} setStatus={setStatus}
                    Attachments={Attachments} setAttachments={setAttachments}
                    NewAttachments={NewAttachments} setNewAttachments={setNewAttachments}
                    HandleSave={HandleSave} HandleCancel={HandleCancel}
                    HandleFileChange={HandleFileChange}
                />
            )}

            {/* 2. Attachment List Popup */}
            {ShowAttachmentPopup && (
                <Portal>
                     <div className={styles.modalOverlay} onClick={() => setShowAttachmentPopup(false)}>
                        <div className={styles.popupContent} onClick={e => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h4>Attachments</h4>
                                <button className={styles.closeHeaderBtn} onClick={() => setShowAttachmentPopup(false)}>✖</button>
                            </div>
                             <div className={styles.popupList}>
                                {task.attachments.map((file, i) => (
                                    <div 
                                        key={i} 
                                        className={styles.popupItem}
                                        onClick={() => {
                                           
                                            if (file.type?.startsWith("image/")) {
                                                setPreviewFile(file);
                                                setShowAttachmentPopup(false); 
                                            } else {
                                                window.open(file.url, "_blank");
                                                setShowAttachmentPopup(false);
                                                
                                            }
                                        }}
                                    >
                                        <span>{file.type?.startsWith("image/") ? "🖼" : "📎"}</span>
                                        <span className={styles.popupFileName}>{file.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Portal>
            )}

            {/* 3. Image Preview Modal */}
            {PreviewFile && (
                <Portal>
                    <div className={styles.previewOverlay} onClick={() => setPreviewFile(null)}>
                        <div className={styles.previewModal} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.previewHeader}>
                                <p className={styles.previewName}>{PreviewFile.name}</p>
                                <button className={styles.previewClose} onClick={() => setPreviewFile(null)}>✖</button>
                            </div>
                            <img
                                src={PreviewFile.url}
                                alt={PreviewFile.name}
                                className={styles.previewImage}
                            />
                        </div>
                    </div>
                </Portal>
            )}
        </>
    );
}
