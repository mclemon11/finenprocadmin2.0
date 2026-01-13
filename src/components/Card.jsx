import React from 'react';
import '../styles/theme.css';

export default function Card({ title, children, className = '' }){
  return (
    <div className={"card " + className}>
      {title && <div className="card-title">{title}</div>}
      <div className="card-body">{children}</div>
    </div>
  );
}
