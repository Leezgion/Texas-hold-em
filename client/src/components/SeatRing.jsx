import React from 'react';

import SeatCard from './SeatCard';

const SeatRing = ({ seats = [], roomState, gameState, gameStarted }) => {
  return (
    <div className="absolute inset-0 z-20">
      {seats.map((seat) => (
        <SeatCard
          key={`seat-${seat.seatIndex}`}
          seat={seat}
          roomState={roomState}
          gameState={gameState}
          gameStarted={gameStarted}
        />
      ))}
    </div>
  );
};

export default SeatRing;
