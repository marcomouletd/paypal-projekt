import '../styles/PayPalStyle.css';

interface ErrorProps {
  message?: string;
}

function Error({ message = 'Something went wrong. Please try again later.' }: ErrorProps) {
  return (
    <div className="paypal-container">
      <div className="paypal-form-container">
        <div className="paypal-logo-container">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M 7.763 3 C 7.427 3 7.158 3.257 7.158 3.573 C 7.158 3.62 7.158 3.667 7.173 3.713 L 8.501 9.843 C 8.56 10.122 8.804 10.318 9.083 10.318 L 12.998 10.318 C 16.607 10.318 18.444 8.492 18.967 5.3 C 19.057 4.731 19.057 4.267 18.982 3.887 C 18.892 3.35 18.623 3 18.25 3 L 7.763 3 Z" fill="#253B80"/>
            <path d="M 18.967 5.3 C 18.444 8.492 16.607 10.318 12.998 10.318 L 9.083 10.318 C 8.804 10.318 8.56 10.122 8.501 9.843 L 7.173 3.713 C 7.158 3.667 7.158 3.62 7.158 3.573 C 7.158 3.257 7.427 3 7.763 3 L 18.25 3 C 18.623 3 18.892 3.35 18.982 3.887 C 19.057 4.267 19.057 4.731 18.967 5.3 Z" fill="#179BD7"/>
            <path d="M 5.45 11.683 C 5.114 11.683 4.845 11.94 4.845 12.257 C 4.845 12.303 4.845 12.35 4.86 12.397 L 6.188 18.527 C 6.248 18.805 6.492 19.001 6.771 19.001 L 10.685 19.001 C 14.295 19.001 16.132 17.175 16.655 13.983 C 16.744 13.414 16.744 12.95 16.67 12.57 C 16.58 12.033 16.311 11.683 15.938 11.683 L 5.45 11.683 Z" fill="#253B80"/>
            <path d="M 16.655 13.983 C 16.132 17.175 14.295 19.001 10.685 19.001 L 6.771 19.001 C 6.492 19.001 6.248 18.805 6.188 18.527 L 4.86 12.397 C 4.845 12.35 4.845 12.303 4.845 12.257 C 4.845 11.94 5.114 11.683 5.45 11.683 L 15.938 11.683 C 16.311 11.683 16.58 12.033 16.67 12.57 C 16.744 12.95 16.744 13.414 16.655 13.983 Z" fill="#179BD7"/>
          </svg>
        </div>
        
        <form className="paypal-form">
          <h1 className="paypal-form-title">
            Something went wrong
          </h1>
          
          <div style={{ margin: '40px 0', textAlign: 'center' }}>
            <div className="error-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#d20000"/>
              </svg>
            </div>
            <p className="error-message">{message}</p>
            <button 
              className="paypal-button-primary" 
              style={{ maxWidth: '200px', margin: '0 auto' }}
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </form>
      </div>
      
      <div className="paypal-footer">
        <a href="#">Contact Us</a>
        <a href="#">Privacy</a>
        <a href="#">Legal</a>
        <a href="#">Policy Updates</a>
        <a href="#">Worldwide</a>
      </div>
      
      <style>
        {`
          .error-icon {
            margin: 0 auto 20px;
            display: flex;
            justify-content: center;
          }
          
          .error-message {
            color: #666;
            font-size: 14px;
          }
        `}
      </style>
    </div>
  );
}

export default Error;
