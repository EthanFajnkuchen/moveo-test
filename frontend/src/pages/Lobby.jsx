import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Lobby = () => {
  const navigate = useNavigate();
  const [codeBlocks, setCodeBlocks] = useState([]);

  useEffect(() => {
    // Fetch code blocks from the backend
    const fetchCodeBlocks = async () => {
      try {
        const response = await fetch('http://localhost:3000/codeblocks', {
          credentials: 'include'
        });
        const data = await response.json();
        setCodeBlocks(data);
      } catch (error) {
        console.error('Error fetching code blocks:', error);
      }
    };

    fetchCodeBlocks();
  }, []);

  const handleCodeBlockClick = (id) => {
    navigate(`/codeblock/${id}`);
  };

  return (
    <div>
      <h1>Choose code block</h1>
      <ul>
        {codeBlocks.map((block) => (
          <li key={block._id} onClick={() => handleCodeBlockClick(block._id)}>
            {block.title}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Lobby;
