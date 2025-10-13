import React from 'react';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="error-container">
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Error</h4>
        <p>{message}</p>
      </div>
    </div>
  );
};
