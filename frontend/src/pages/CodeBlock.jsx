import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { Controlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css'; // Choose a CodeMirror theme you like
import 'codemirror/mode/javascript/javascript'; // Import the JavaScript mode

// Make sure this socket connection is only established once
const socket = io('https://moveo-test-production.up.railway.app', {
  withCredentials: true,
  extraHeaders: {
    'my-custom-header': 'abcd'
  },
  transports: ['websocket']
});

const CodeBlock = () => {
  const { id } = useParams();
  const [codeBlock, setCodeBlock] = useState(null);
  const [solution, setSolution] = useState('');
  const [isMentor, setIsMentor] = useState(false);
  const [showSmiley, setShowSmiley] = useState(false);
  const hasJoinedRoom = useRef(false);

  useEffect(() => {
    // Fetch code block details
    const fetchCodeBlock = async () => {
      try {
        const response = await fetch(`https://moveo-test-production.up.railway.app/codeblock/${id}`, {
          credentials: 'include'
        });
        const data = await response.json();
        setCodeBlock(data);
      } catch (error) {
        console.error('Error fetching code block:', error);
      }
    };

    fetchCodeBlock();

    // Fetch solution
    const fetchSolution = async () => {
      try {
        const response = await fetch(`https://moveo-test-production.up.railway.app/solution/${id}`, {
          credentials: 'include'
        });
        const data = await response.json();
        setSolution(data.solution);
      } catch (error) {
        console.error('Error fetching solution:', error);
      }
    };

    fetchSolution();

    if (!hasJoinedRoom.current) {
      // Join room
      socket.emit('joinRoom', id);
      hasJoinedRoom.current = true;
    }

    // Determine role
    socket.on('role', (role) => {
      setIsMentor(role === 'mentor');
      console.log(`Role determined: ${role}`);
    });

    // Handle code updates
    socket.on('codeUpdate', (newCode) => {
      console.log(`Code update received: ${newCode}`); // Log for debugging
      setCodeBlock((prev) => ({ ...prev, code: newCode }));
      if (newCode === solution) {
        setShowSmiley(true);
      } else {
        setShowSmiley(false);
      }
    });

    return () => {
      socket.off('role');
      socket.off('codeUpdate');
    };
  }, [id, solution]);

  const handleCodeChange = (editor, data, value) => {
    setCodeBlock((prev) => ({ ...prev, code: value }));
    socket.emit('codeUpdate', { roomId: id, code: value });
    if (value === solution) {
      setShowSmiley(true);
    } else {
      setShowSmiley(false);
    }
  };

  return (
    <div>
      <h1>{codeBlock?.title}</h1>
      {isMentor ? (
        <CodeMirror
          value={codeBlock?.code}
          options={{
            mode: 'javascript',
            theme: 'material',
            lineNumbers: true,
            readOnly: true
          }}
        />
      ) : (
        <div style={{ display: 'flex' }}>
          <CodeMirror
            value={codeBlock?.code}
            options={{
              mode: 'javascript',
              theme: 'material',
              lineNumbers: true
            }}
            onBeforeChange={handleCodeChange}
          />
        </div>
      )}
      {showSmiley && (
        <div><p style={{ fontSize: '10em', marginTop: '10px', textAlign: 'center'}}>😊</p></div>
      )}
    </div>
  );
};

export default CodeBlock;
