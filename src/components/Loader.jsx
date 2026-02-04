import React from 'react';

import './Loader.css';
import Lottie from 'lottie-react';
import barChartAnimation from '../assets/Bar chart.json';

const Loader = ({ size = 'medium', text, overlay = false }) => {
  const loaderContent = (
    <div className="loader">
      <Lottie 
        animationData={barChartAnimation}
        loop
        autoplay
        style={{ width: size === 'small' ? 60 : size === 'large' ? 180 : 120, height: size === 'small' ? 60 : size === 'large' ? 180 : 120 }}
      />
      {text && <p className="loader-text">{text}</p>}
    </div>
  );

  if (overlay) {
    return (
      <div className="loader-overlay">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
};

export default Loader;
