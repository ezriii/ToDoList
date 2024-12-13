// pages/index.tsx
"use client";
import { useState, FormEvent, useEffect } from 'react';
import qs from "qs"

// Define the type for a task
type Task = {
  name: string;
  todo: string;
  documentId?: string;
};

interface TypeWithId extends Task {
  documentId: string
}

export default function TodoList() {
  const [todos, setTasks] = useState<Task[]>([]); // State to store tasks
  const [todo, setTask] = useState<string>(''); // State to store input value
  const [name, setName] = useState<string>(''); // State to store name input value

  const auditTrail = async (action: string, collection: string, data: unknown) => {
    try {
      const response = await fetch('http://localhost:1337/api/audit-trails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: { action, collection, data } }),
      });

      if (!response.ok) {
        throw new Error('Failed to save task');
      }

      console.log('Audit Trail saved to Strapi:', await response.json());
    } catch (error) {
      console.error('Error saving trail to Strapi:', error);
    }
  };
  // Function to save a task to Strapi
  const saveTaskToStrapi = async (task: Task) => {
    try {
      const response = await fetch('http://localhost:1337/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: task }),
      });

      if (!response.ok) {
        throw new Error('Failed to save task');
      }

      const res = await response.json();
      task.documentId = res.data.documentId;
      setTasks([...todos, task]); // Add task with name to the list
      setTask(''); // Clear task input field
      setName(''); // Clear name input field
      //audit trail
      auditTrail('create', 'todos', res)
    } catch (error) {
      console.error('Error saving task to Strapi:', error);
    }
  };
  const deleteTaskToStrapi = async (documentId: string) => {

    try {
      const response = await fetch('http://localhost:1337/api/todos/' + documentId, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: { deleted: true } }),
      });

      if (!response.ok) {
        throw new Error('Failed to save task');
      }

      setTasks(todos.filter((t) => t.documentId !== documentId))
      const res = await response.json();
      auditTrail('delete', 'todos', res)
    } catch (error) {
      console.error('Error saving task to Strapi:', error);
    }
  };

  useEffect(() => {
    const query = qs.stringify({
      filters: {
        deleted: {
          $ne: true
        }
      },
    }, {
      encodeValuesOnly: true, // prettify URL
    });
    async function fetchData() {
      // You can await here
      try {
        const response = await fetch('http://localhost:1337/api/todos?' + query, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {

          throw new Error('Failed to save task');
        }
        const data = await response.json();
        const mappedData = data.data.map(function (d: TypeWithId) {
          return {
            name: d.name,
            todo: d.todo,
            documentId: d.documentId
          };
        });
        setTasks(mappedData);
        // console.log('Task saved to Strapi:', await response.json());
      } catch (error) {
        console.error('Error saving task to Strapi:', error);
      }
    }
    fetchData()
  }, [])


  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (todo.trim() && name.trim()) {
      const newTask = { name: name.trim(), todo: todo.trim() };

      await saveTaskToStrapi(newTask); // Save task to Strapi

    }

  };

  // Handle task deletion
  const handleDelete = async (documentId?: string) => {
    const updatedTasks = todos.filter((t) => t.documentId !== documentId);
    setTasks(updatedTasks);
    if (documentId)
      await deleteTaskToStrapi(documentId);
  };

  return (

    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-8">
        <p className="text-[10px] text-indigo-600 font-bold text-center text-shadow">
          Maengo Records
        </p>
        <h1 className="text-3xl font-semibold text-center text-indigo-600 mb-6">Todo List</h1>

        <form onSubmit={handleSubmit} className="flex flex-col items-center mb-6">
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full max-w-xs p-3 mb-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Enter a task"
            value={todo}
            onChange={(e) => setTask(e.target.value)}
            className="w-full max-w-xs p-3 mb-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition duration-200 w-full max-w-xs"
          >
            Add
          </button>
        </form>

        <ul className="space-y-4">
          {todos.map((item, index) => (
            <li
              key={index}
              className="flex justify-between items-center p-4 bg-gray-50 rounded-lg shadow-sm"
            >
              <div>
                <span className="font-semibold text-indigo-600">{item.name}:</span> {item.todo}
              </div>
              <button
                onClick={() => handleDelete(item.documentId)}
                className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition duration-200"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>

    // <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
    //   <h1>Todo List</h1>

    //   <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
    //     <input
    //       type="text"
    //       placeholder="Enter your name"
    //       value={name}
    //       onChange={(e) => setName(e.target.value)}
    //       style={{ padding: '10px', fontSize: '16px', width: '250px', marginBottom: '10px', display: 'block' }}
    //     />
    //     <input
    //       type="text"
    //       placeholder="Enter a task"
    //       value={todo}
    //       onChange={(e) => setTask(e.target.value)}
    //       style={{ padding: '10px', fontSize: '16px', width: '250px' }}
    //     />
    //     <button type="submit" style={{ padding: '10px', fontSize: '16px', marginLeft: '10px' }}>
    //       Add
    //     </button>
    //   </form>

    //   <ul style={{ listStyleType: 'none', padding: 0 }}>
    //     {todos.map((item, index) => (
    //       <li key={index} style={{ marginBottom: '10px' }}>
    //         <strong>{item.name}:</strong> {item.todo}
    //         <button
    //           onClick={() => handleDelete(item?.documentId)}
    //           style={{ marginLeft: '10px', padding: '5px 10px', fontSize: '14px' }}
    //         >
    //           Delete
    //         </button>
    //       </li>
    //     ))}
    //   </ul>
    // </div>
  );
}
