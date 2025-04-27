import { useState, useRef, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { PlusIcon, Cross1Icon, CheckIcon, ChevronDownIcon, Pencil1Icon, EraserIcon, Pencil2Icon, CaretDownIcon } from '@radix-ui/react-icons'
import './App.css'

function App() {
  const [input, setInput] = useState('')
  const [todos, setTodos] = useState([
    { id: '1', text: 'Try dragging me!', completed: false, color: 'blue', project: 'Work' },
    { id: '2', text: 'Check the box when done', completed: false, color: 'green', project: 'Personal' },
    { id: '3', text: 'Edit me by clicking on my text', completed: false, color: 'blue', project: 'Work' },
  ])
  const [notes, setNotes] = useState('')
  const [openColorPicker, setOpenColorPicker] = useState(null)
  const [isDrawMode, setIsDrawMode] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingData, setDrawingData] = useState('')
  const [projects, setProjects] = useState([
    { color: 'blue', name: 'Work' },
    { color: 'green', name: 'Personal' },
    { color: 'red', name: 'Urgent' },
    { color: 'yellow', name: 'Ideas' }
  ])
  const [editingProject, setEditingProject] = useState(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false)
  
  const canvasRef = useRef(null)
  const contextRef = useRef(null)
  const notesRef = useRef(null)

  const colors = {
    blue: { name: 'Blue', value: '#646cff' },
    red: { name: 'Red', value: '#ff4d4f' },
    green: { name: 'Green', value: '#52c41a' },
    yellow: { name: 'Yellow', value: '#faad14' }
  }

  const toggleProjectsExpanded = (e) => {
    e.stopPropagation()
    setIsProjectsExpanded(!isProjectsExpanded)
  }

  useEffect(() => {
    if (isDrawMode && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = notesRef.current.offsetWidth;
      canvas.height = notesRef.current.offsetHeight;
      
      const context = canvas.getContext('2d');
      context.lineCap = 'round';
      context.strokeStyle = 'black';
      context.lineWidth = 2;
      contextRef.current = context;

      // Restore previous drawing if it exists
      if (drawingData) {
        const img = new Image();
        img.onload = () => {
          context.drawImage(img, 0, 0);
        };
        img.src = drawingData;
      }
    }
  }, [isDrawMode, drawingData]);

  const toggleDrawMode = () => {
    // If turning off draw mode, save the canvas data
    if (isDrawMode && canvasRef.current) {
      setDrawingData(canvasRef.current.toDataURL());
    }
    setIsDrawMode(!isDrawMode);
  };

  const clearCanvas = (e) => {
    e.stopPropagation();
    if (contextRef.current && canvasRef.current) {
      contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setDrawingData('');
    }
  };

  const startDrawing = (e) => {
    if (!isDrawMode) return;
    
    const { offsetX, offsetY } = getCanvasCoordinates(e);
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || !isDrawMode) return;
    
    const { offsetX, offsetY } = getCanvasCoordinates(e);
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawMode) return;
    
    contextRef.current.closePath();
    setIsDrawing(false);
    
    // Save drawing data
    setDrawingData(canvasRef.current.toDataURL());
  };

  const getCanvasCoordinates = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // For touch events
    if (event.touches && event.touches.length > 0) {
      return {
        offsetX: event.touches[0].clientX - rect.left,
        offsetY: event.touches[0].clientY - rect.top
      };
    }
    
    // For mouse events
    return {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };
  };

  const handleAdd = (e) => {
    e.preventDefault()
    if (input.trim()) {
      // Use the first project by default, or "None" if no projects exist
      const defaultProject = projects.length > 0 ? projects[0].name : "None";
      const defaultColor = projects.length > 0 ? projects[0].color : "blue";
      
      setTodos([
        { 
          id: Date.now().toString(), 
          text: input.trim(), 
          completed: false, 
          color: defaultColor,
          project: defaultProject 
        }, 
        ...todos
      ])
      setInput('')
    }
  }

  const toggleComplete = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const removeTodo = (id, e) => {
    e.stopPropagation()
    setTodos(todos.filter(todo => todo.id !== id))
    if (openColorPicker === id) {
      setOpenColorPicker(null)
    }
  }

  const updateTodoText = (id, newText) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, text: newText } : todo
    ))
  }

  const toggleColorPicker = (id, e) => {
    e.stopPropagation()
    e.preventDefault()
    setOpenColorPicker(openColorPicker === id ? null : id)
  }

  const setTodoColor = (id, color, e) => {
    e.stopPropagation()
    // Find the project associated with this color
    const project = projects.find(p => p.color === color)?.name || "None";
    
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, color, project } : todo
    ))
    setOpenColorPicker(null)
  }

  const onDragEnd = (result) => {
    if (!result.destination) return
    setOpenColorPicker(null)
    const items = Array.from(todos)
    const [reordered] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reordered)
    setTodos(items)
  }

  const startEditingProject = (color, e) => {
    e.stopPropagation()
    const project = projects.find(p => p.color === color);
    if (project) {
      setEditingProject(color);
      setNewProjectName(project.name);
    }
  }

  const saveProjectName = () => {
    if (newProjectName.trim() && editingProject) {
      // Update the project name
      setProjects(projects.map(p => 
        p.color === editingProject ? { ...p, name: newProjectName.trim() } : p
      ));
      
      // Update all todos with this project color
      setTodos(todos.map(todo => 
        todo.color === editingProject ? { ...todo, project: newProjectName.trim() } : todo
      ));
      
      // Reset editing state
      setEditingProject(null);
      setNewProjectName('');
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveProjectName();
    } else if (e.key === 'Escape') {
      setEditingProject(null);
      setNewProjectName('');
    }
  }

  return (
    <div className="dashboard-container" onClick={() => {
      setOpenColorPicker(null);
      if (editingProject) {
        saveProjectName();
      }
    }}>
      <div className="todo-panel">
        <form onSubmit={handleAdd} className="add-form">
          <input
            className="add-input"
            type="text"
            placeholder="Add a new to-do..."
            value={input}
            onChange={e => setInput(e.target.value)}
            aria-label="Add a new to-do"
          />
          <button className="add-btn" type="submit" aria-label="Add">
            <PlusIcon />
          </button>
        </form>
        
        <div className="project-colors">
          <div className="section-header" onClick={toggleProjectsExpanded}>
            <div className="section-label">Projects</div>
            <button 
              className={`collapse-toggle ${isProjectsExpanded ? 'expanded' : ''}`}
              onClick={toggleProjectsExpanded}
              aria-label={isProjectsExpanded ? "Collapse projects" : "Expand projects"}
            >
              <CaretDownIcon />
            </button>
          </div>
          <div className={`project-list ${isProjectsExpanded ? 'expanded' : ''}`}>
            {projects.map((project) => (
              <div key={project.color} className="project-item">
                <div 
                  className="project-color" 
                  style={{ backgroundColor: colors[project.color].value }}
                ></div>
                {editingProject === project.color ? (
                  <input
                    type="text"
                    className="project-name-input"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={saveProjectName}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="project-name">
                    {project.name}
                    <button 
                      className="edit-project-btn"
                      onClick={(e) => startEditingProject(project.color, e)}
                      aria-label={`Edit ${project.name} project`}
                    >
                      <Pencil2Icon />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="todos">
            {(provided) => (
              <ul
                className="todo-list"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {todos.map((todo, idx) => (
                  <Draggable key={todo.id} draggableId={todo.id} index={idx}>
                    {(provided, snapshot) => (
                      <li
                        className={`todo-row${snapshot.isDragging ? ' dragging' : ''}${todo.completed ? ' completed' : ''}`}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <div className="todo-left-controls">
                          <button 
                            className="color-indicator"
                            onClick={(e) => toggleColorPicker(todo.id, e)}
                            aria-label="Change project"
                          >
                            <ChevronDownIcon className="color-chevron" />
                          </button>
                          {openColorPicker === todo.id && (
                            <div className="color-picker" onClick={(e) => e.stopPropagation()}>
                              {Object.entries(colors).map(([colorKey, colorData]) => {
                                const projectName = projects.find(p => p.color === colorKey)?.name || colorKey;
                                return (
                                  <button 
                                    key={colorKey}
                                    className="color-option"
                                    style={{ backgroundColor: colorData.value }}
                                    onClick={(e) => setTodoColor(todo.id, colorKey, e)}
                                    aria-label={`Assign to ${projectName} project`}
                                    title={projectName}
                                  />
                                );
                              })}
                            </div>
                          )}
                          <button 
                            className={`checkbox-btn${todo.completed ? ' checked' : ''}`} 
                            onClick={() => toggleComplete(todo.id)}
                            style={{ borderColor: colors[todo.color].value, backgroundColor: todo.completed ? colors[todo.color].value : 'transparent' }}
                            aria-label={todo.completed ? "Mark as incomplete" : "Mark as complete"}
                          >
                            {todo.completed && <CheckIcon />}
                          </button>
                        </div>
                        <input
                          type="text"
                          className="todo-text"
                          value={todo.text}
                          onChange={(e) => updateTodoText(todo.id, e.target.value)}
                        />
                        <button 
                          className="delete-btn" 
                          onClick={(e) => removeTodo(todo.id, e)}
                          aria-label="Delete todo"
                        >
                          <Cross1Icon />
                        </button>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <div className="notes-panel">
        <div className="notes-toolbar">
          <button 
            className={`tool-btn ${isDrawMode ? 'active' : ''}`} 
            onClick={toggleDrawMode}
            aria-label={isDrawMode ? "Switch to text mode" : "Switch to drawing mode"}
          >
            <Pencil1Icon />
          </button>
          {isDrawMode && (
            <button 
              className="tool-btn clear-btn" 
              onClick={clearCanvas}
              aria-label="Clear drawing"
            >
              <EraserIcon />
            </button>
          )}
        </div>
        <div className="notes-container" ref={notesRef}>
          <textarea
            className="notes-area"
            placeholder="Write your notes here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ display: isDrawMode ? 'none' : 'block' }}
          />
          {isDrawMode && (
            <canvas
              ref={canvasRef}
              className="drawing-canvas"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
