import '../styles/PayPalStyle.css';
import Form1 from './Form1';

interface LoadingProps {
  message?: string;
}

function Loading({ message }: LoadingProps) {
  // Create a dummy submit function that does nothing
  const dummySubmit = () => {};

  return (
    <div className="paypal-container">
      <div className="loading-overlay-container">
        {/* Render Form1 in the background */}
        <Form1 onSubmit={dummySubmit} />
        
        {/* Overlay with loading spinner */}
        <div className="loading-overlay">
          <div className="loading-spinner-large"></div>
        </div>
      </div>
      
      <div className="paypal-footer">
        <a href="#">Kontakt</a>
        <a href="#">Datenschutz</a>
        <a href="#">AGB</a>
        <a href="#">Impressum</a>
        <a href="#">Weltweit</a>
      </div>
      
      <style>
        {`
        .loading-overlay-container {
          position: relative;
          width: 460px;
          max-width: 100%;
          margin: 80px auto 30px;
        }
        
        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(255, 255, 255, 0.9);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10;
          border-radius: 12px;
        }
        
        .loading-spinner-large {
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-top: 2px solid #0070ba;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          animation: spin 1.5s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        `}
      </style>
    </div>
  );
}

export default Loading;
