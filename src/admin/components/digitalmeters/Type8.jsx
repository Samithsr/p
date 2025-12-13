import React from 'react';

const Type8 = ({ speed = 40 }) => {
  const minSpeed = 20;
  const maxSpeed = 220;
  const rotation = ((speed - minSpeed) / (maxSpeed - minSpeed)) * 240 - 120;

  return (
    <div style={{
      backgroundColor: '#000',
      padding: '20px',
      borderRadius: '20px',
      fontFamily: 'Arial, sans-serif',
      display: 'inline-block'
    }}>
      <svg 
        viewBox="0 0 320 320" 
        style={{
          width: '400px',
          height: '400px'
        }}
      >
        {/* Speed numbers placed around the circle */}
        <text 
          x="160" 
          y="60" 
          style={{
            fill: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            textAnchor: 'middle',
            alignmentBaseline: 'middle',
            filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))'
          }}
        >
          100
        </text>
        <text 
          x="240" 
          y="90" 
          style={{
            fill: 'white',
            fontSize: '14px',
            textAnchor: 'middle',
            alignmentBaseline: 'middle',
            filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))'
          }}
        >
          120
        </text>
        <text 
          x="80" 
          y="90" 
          style={{
            fill: 'white',
            fontSize: '14px',
            textAnchor: 'middle',
            alignmentBaseline: 'middle',
            filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))'
          }}
        >
          80
        </text>
        <text 
          x="270" 
          y="160" 
          style={{
            fill: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            textAnchor: 'middle',
            alignmentBaseline: 'middle',
            filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))'
          }}
        >
          140
        </text>
        <text 
          x="50" 
          y="160" 
          style={{
            fill: 'white',
            fontSize: '14px',
            textAnchor: 'middle',
            alignmentBaseline: 'middle',
            filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))'
          }}
        >
          60
        </text>
        <text 
          x="270" 
          y="230" 
          style={{
            fill: 'white',
            fontSize: '14px',
            textAnchor: 'middle',
            alignmentBaseline: 'middle',
            filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))'
          }}
        >
          160
        </text>
        <text 
          x="50" 
          y="230" 
          style={{
            fill: 'white',
            fontSize: '14px',
            textAnchor: 'middle',
            alignmentBaseline: 'middle',
            filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))'
          }}
        >
          40
        </text>
        <text 
          x="240" 
          y="270" 
          style={{
            fill: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            textAnchor: 'middle',
            alignmentBaseline: 'middle',
            filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))'
          }}
        >
          180
        </text>
        <text 
          x="80" 
          y="270" 
          style={{
            fill: 'white',
            fontSize: '14px',
            textAnchor: 'middle',
            alignmentBaseline: 'middle',
            filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))'
          }}
        >
          20
        </text>
        <text 
          x="160" 
          y="300" 
          style={{
            fill: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            textAnchor: 'middle',
            alignmentBaseline: 'middle',
            filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))'
          }}
        >
          200
        </text>
        <text 
          x="160" 
          y="300" 
          style={{
            fill: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            textAnchor: 'middle',
            alignmentBaseline: 'middle',
            filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))'
          }}
        >
          220
        </text>

        {/* Center circle */}
        <circle 
          cx="160" 
          cy="160" 
          r="70" 
          fill="#111" 
        />

        {/* Speed display */}
        <text 
          x="160" 
          y="160" 
          style={{
            fill: '#fff',
            fontSize: '40px',
            fontWeight: 'bold',
            textAnchor: 'middle',
            alignmentBaseline: 'middle'
          }}
        >
          <tspan x="160" dy="0">{speed}</tspan>
          <tspan 
            x="160" 
            dy="25" 
            style={{
              fontSize: '20px',
              fill: '#888'
            }}
          >
            km/h
          </tspan>
        </text>

        {/* Needle */}
        <line 
          x1="160" 
          y1="160" 
          x2="160" 
          y2="80" 
          style={{
            stroke: '#ff4444',
            strokeWidth: '3',
            strokeLinecap: 'round',
            transition: 'transform 0.5s ease-out',
            transform: `rotate(${rotation}deg)`,
            transformOrigin: '160px 160px'
          }}
        />
        
        {/* Center dot */}
        <circle 
          cx="160" 
          cy="160" 
          r="5" 
          fill="#ff4444" 
        />
      </svg>
    </div>
  );
};

export default Type8;