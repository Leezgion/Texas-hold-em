import React from 'react';

import SeatCard from './SeatCard';

const SeatRing = ({ seats = [], roomState, gameState, gameStarted, geometryContract = null }) => {
  const tableProfile = geometryContract?.tableSurfaceLayout?.profile || seats[0]?.position?.profile || 'desktop-oval';

  return (
    <div className="absolute inset-0 z-20" data-table-profile={tableProfile}>
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
